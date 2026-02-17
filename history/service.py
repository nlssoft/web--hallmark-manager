from .models import *
from .serializer import *
from django.db.models import F, ExpressionWrapper, DecimalField


class RecordService:

    @staticmethod
    def _next_unpaid_record(party, exclude_record):
        return Record.objects.filter(
            party=party
        ).exclude(
            pk=exclude_record.pk
        ).filter(
            paid_amount__lt=ExpressionWrapper(
                F('pcs') * F('rate') - F('discount'),
                output_field=DecimalField()
            )
        ).order_by('record_date', 'pk').first()

    @staticmethod
    def _apply_advances_to_record(record, amount_needed):
        if amount_needed <= 0:
            return 0

        remaining = amount_needed
        advanceledger_qs = AdvanceLedger.objects.filter(
            party=record.party,
            direction='IN',
            remaining_amount__gt=0
        ).order_by('created_at')

        for entry in advanceledger_qs:
            if remaining <= 0:
                break

            used = min(remaining, entry.remaining_amount)

            AdvanceLedger.objects.create(
                party=record.party,
                payment=entry.payment,
                record=record,
                amount=used,
                remaining_amount=0,
                direction='OUT'
            )

            entry.remaining_amount -= used
            entry.save(update_fields=['remaining_amount'])
            record.apply_payment(used)
            remaining -= used

    @staticmethod
    def _reallocate_to_unpaid_or_advance(party, exclude_record, payment, amount):
        remaining = amount

        while remaining > 0:
            unpaid = RecordService._next_unpaid_record(party, exclude_record)
            if not unpaid:
                break

            amount_to_alocate = min(unpaid.remaining_amount, remaining)
            if amount_to_alocate <= 0:
                break

            Allocation.objects.create(
                payment=payment,
                record=unpaid,
                amount=amount_to_alocate
            )
            unpaid.apply_payment(amount_to_alocate)
            remaining -= amount_to_alocate

        if remaining > 0:
            AdvanceLedger.objects.create(
                party=party,
                payment=payment,
                record=None,
                amount=remaining,
                remaining_amount=remaining,
                direction='IN'
            )

    @staticmethod
    def apply_advance(record):
        RecordService._apply_advances_to_record(
            record, record.remaining_amount)

    @staticmethod
    def rollback(record):
        party = record.party

        if record.paid_amount > 0:
            record.reverse_payment(record.paid_amount)
            record.refresh_from_db(fields=["paid_amount"])

        advanceledger_qs = list(AdvanceLedger.objects.filter(
            record=record, direction='OUT'))

        for ledger in advanceledger_qs:
            remaining = ledger.amount

            while remaining > 0:
                unpaid = RecordService._next_unpaid_record(party, record)
                if not unpaid:
                    break

                amount_to_alocate = min(unpaid.remaining_amount, remaining)
                if amount_to_alocate <= 0:
                    break

                AdvanceLedger.objects.create(
                    party=party,
                    payment=ledger.payment,
                    record=unpaid,
                    amount=amount_to_alocate,
                    remaining_amount=0,
                    direction='OUT'
                )
                unpaid.apply_payment(amount_to_alocate)
                remaining -= amount_to_alocate

            if remaining > 0:
                AdvanceLedger.objects.filter(
                    payment=ledger.payment,
                    party=party,
                    direction='IN'
                ).update(
                    remaining_amount=F('remaining_amount') + remaining
                )

            ledger.delete()

        allocation_qs = list(Allocation.objects.filter(record=record))
        for row in allocation_qs:
            RecordService._reallocate_to_unpaid_or_advance(
                party=party,
                exclude_record=record,
                payment=row.payment,
                amount=row.amount
            )
            row.delete()

    @staticmethod
    def adjust_after_update(record, new_data):
        record.refresh_from_db(fields=["paid_amount"])

        new_pcs = new_data.get('pcs', record.pcs)
        new_rate = new_data.get('rate', record.rate)
        new_discount = new_data.get('discount', record.discount)
        new_amount = (new_rate * new_pcs) - new_discount

        # If the new amount is higher or equal, try to use advances to cover the gap
        if new_amount >= record.paid_amount:
            amount_needed = new_amount - record.paid_amount
            RecordService._apply_advances_to_record(record, amount_needed)
            return

        # If the new amount is lower, refund the surplus
        surplus = record.paid_amount - new_amount

        # First refund from advance OUT entries (move back to IN)
        ledger_out_entries = AdvanceLedger.objects.filter(
            record=record,
            direction='OUT'
        ).order_by('-created_at')

        for out_entry in ledger_out_entries:
            if surplus <= 0:
                break

            refund_from_this = min(surplus, out_entry.amount)

            AdvanceLedger.objects.filter(
                payment=out_entry.payment,
                party=record.party,
                direction='IN'
            ).update(remaining_amount=F('remaining_amount') + refund_from_this)

            if refund_from_this == out_entry.amount:
                out_entry.delete()
            else:
                out_entry.amount -= refund_from_this
                out_entry.save(update_fields=['amount'])

            surplus -= refund_from_this

        # Then refund from allocations: try to re-allocate to unpaid records
        if surplus > 0:
            allocations = Allocation.objects.filter(
                record=record).order_by('-id')

            for alloc in allocations:
                if surplus <= 0:
                    break

                refund_alloc = min(surplus, alloc.amount)
                RecordService._reallocate_to_unpaid_or_advance(
                    party=record.party,
                    exclude_record=record,
                    payment=alloc.payment,
                    amount=refund_alloc
                )

                if refund_alloc == alloc.amount:
                    alloc.delete()
                else:
                    alloc.amount -= refund_alloc
                    alloc.save(update_fields=['amount'])

                surplus -= refund_alloc

        record.refresh_from_db(fields=["paid_amount"])
        delta = record.paid_amount - new_amount
        if delta > 0:
            record.reverse_payment(delta)

    @staticmethod
    def cleanup_pending_requests_for_deleted_record(record):
        pending_requests = Payment_Request.objects.filter(
            status='P',
            record=record
        ).distinct()

        for pr in pending_requests:
            pr.record.remove(record)

            if not pr.record.exists():
                pr.delete()
            else:
                pr.requested_amount = sum(
                    r.remaining_amount for r in pr.record.all())
                pr.save(update_fields=['requested_amount'])

    @staticmethod
    def sync_pending_request_amounts(record):
        pending_requests = Payment_Request.objects.filter(
            status='P',
            record=record
        ).distinct()

        for pr in pending_requests:
            pr.requested_amount = sum(
                r.remaining_amount for r in pr.record.all()
            )
            pr.save(update_fields=['requested_amount'])


class PaymentService:

    @staticmethod
    def allocate_payment(payment):
        remaining_payment = payment.amount

        unpaid_records = Record.objects.filter(
            party=payment.party,
            paid_amount__lt=ExpressionWrapper(
                F('pcs') * F('rate') - F('discount'),
                output_field=DecimalField()
            )
        ).order_by('record_date')

        for record in unpaid_records:
            if remaining_payment <= 0:
                break

            allocated = min(record.remaining_amount, remaining_payment)

            Allocation.objects.create(
                payment=payment,
                amount=allocated,
                record=record
            )

            record.apply_payment(allocated)

            remaining_payment -= allocated

        if remaining_payment > 0:
            AdvanceLedger.objects.create(
                party=payment.party,
                payment=payment,
                amount=remaining_payment,
                remaining_amount=remaining_payment,
                direction='IN'
            )

    @staticmethod
    def rollback_payment(payment):
        # 1) Undo allocations
        allocation_qs = list(
            Allocation.objects.select_related('record').filter(payment=payment)
        )

        for allocation in allocation_qs:
            record = allocation.record
            record.reverse_payment(allocation.amount)
            allocation.delete()

        # 2) Undo any OUT advances created from this payment
        out_qs = list(
            AdvanceLedger.objects.select_related('record').filter(
                payment=payment,
                direction="OUT"
            )
        )
        for out_entry in out_qs:
            if out_entry.record:
                out_entry.record.reverse_payment(out_entry.amount)
            out_entry.delete()

        # 3) Delete remaining IN advances for this payment
        in_qs = list(
            AdvanceLedger.objects.filter(payment=payment, direction="IN")
        )
        for ledger in in_qs:
            ledger.delete()

    @staticmethod
    def sync_pending_request_amounts_for_party(party):
        pending_requests = Payment_Request.objects.filter(
            status='P',
            party=party
        ).distinct()

        for pr in pending_requests:
            pr.requested_amount = sum(
                r.remaining_amount for r in pr.record.all()
            )
            pr.save(update_fields=['requested_amount'])

    @staticmethod
    def create_payment(serializer):
        payment = serializer.save()
        PaymentService.allocate_payment(payment)
        PaymentService.sync_pending_request_amounts_for_party(payment.party)
        return payment

    @staticmethod
    def update_payment(serializer):
        payment = serializer.instance
        PaymentService.rollback_payment(payment)
        payment = serializer.save()
        PaymentService.allocate_payment(payment)
        PaymentService.sync_pending_request_amounts_for_party(payment.party)
        return payment
