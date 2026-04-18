import pytest
from django.conf import settings
from history.models import *
from model_bakery import baker
from rest_framework import status
from history.service import *
from django.urls import reverse
from datetime import date, timedelta
from django.utils.timezone import localdate
from decimal import Decimal


@pytest.mark.django_db
class TestAuthCheckSummary:
    """Test authentication and authorization"""

    def test_anonymous_user_cannot_see_summary_return_401(self, api_client):
        """Anonymous users should get 401"""
        response = api_client.get(reverse('summary'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_a_cannot_see_user_b_summary(self, api_client):
        """User A should not see User B's records"""
        today = localdate()
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)

        record = baker.make(Record, party=party, service_type=service)

        api_client.force_authenticate(user=user_a)

        response = api_client.get(reverse('summary'), {
            'type': 'record',
            'date_from': (today - timedelta(days=1)).isoformat(),
            'date_to': (today + timedelta(days=1)).isoformat(),
        })

        assert response.data["result"] == []


@pytest.mark.django_db
class TestRecordSummary:

    def test_user_can_filter_record_by_status(self, api_client, get_summary):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)
        record_paid = baker.make(
            Record, party=party, service_type=service, pcs=10, rate=10, record_date=date(2026, 1, 10))
        payment_used = baker.make(Payment, party=party, amount=100)
        PaymentService.allocate_payment(payment_used)
        record_unpaid = baker.make(
            Record, party=party, service_type=service, pcs=1, rate=50, record_date=date(2026, 1, 20))

        api_client.force_authenticate(user=user)

        paid_response = get_summary({
            'type': 'record',
            'date_from': '2025-12-20',
            'date_to': '2026-01-31',
            'status': 'paid'
        })

        unpaid_response = get_summary({
            'type': 'record',
            'date_from': '2025-12-20',
            'date_to': '2026-01-31',
            'status': 'unpaid'
        })

        paid_id = {item['id'] for item in paid_response.data["result"]}
        unpaid_id = {item['id'] for item in unpaid_response.data["result"]}

        assert paid_response.status_code == status.HTTP_200_OK
        assert unpaid_response.status_code == status.HTTP_200_OK
        assert paid_id == {record_paid.id}
        assert unpaid_id == {record_unpaid.id}

    def test_record_works_with_audit_log(self, api_client, get_summary):
        today = localdate()
        date_from = (today - timedelta(days=1)).isoformat()
        date_to = (today + timedelta(days=1)).isoformat()
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)
        record_update = baker.make(
            Record, party=party, service_type=service, pcs=10, rate=10, record_date=today)

        record_delete = baker.make(
            Record, party=party, service_type=service, pcs=1, rate=50, record_date=today)

        api_client.force_authenticate(user=user)

        update = api_client.patch(
            reverse('record-detail', args=[record_update.id]), {'pcs': 9})

        delete = api_client.delete(
            reverse('record-detail', args=[record_delete.id]))

        update_response = get_summary({
            'type': 'audit_log',
            'date_from': date_from,
            'date_to': date_to,
            'model': 'Record',
            'action': 'Update'
        })

        delete_response = get_summary({
            'type': 'audit_log',
            'date_from': date_from,
            'date_to': date_to,
            'model': 'record',
            'action': 'delete'
        })

        delete_id = {item['object_id']
                     for item in delete_response.data["results"]}
        update_id = {item['object_id']
                     for item in update_response.data["results"]}

        audit_log_delete = AuditLog.objects.get(
            user=user,
            model_name='Record',
            action='DELETE',
            object_id=record_delete.id
        )

        audit_log_update = AuditLog.objects.get(
            user=user,
            model_name='Record',
            action='UPDATE',
            object_id=record_update.id
        )

        assert update_response.status_code == status.HTTP_200_OK
        assert delete_response.status_code == status.HTTP_200_OK
        assert delete_id == {record_delete.id}
        assert update_id == {record_update.id}
        assert audit_log_delete.after is None
        assert audit_log_update.after is not None
        assert audit_log_update.after['pcs'] == 9


@pytest.mark.django_db
class TestPaymentSummary:

    def test_user_can_filter_payment(self, api_client, get_summary):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        payment = baker.make(Payment, party=party,
                             payment_date=date(2026, 2, 1))

        api_client.force_authenticate(user=user)

        response = get_summary({
            'type': 'payment',
            'date_from': '2025-12-20',
            'date_to': '2026-02-9',
        })

        payment_id = {i['id'] for i in response.data['result']}

        assert response.status_code == status.HTTP_200_OK
        assert payment_id == {payment.id}

    def test_payment_summary_includes_service_breakdown(self, api_client, get_summary):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service_a = baker.make(Service_Type, user=user, type_of_work="Service A")
        service_b = baker.make(Service_Type, user=user, type_of_work="Service B")

        baker.make(
            Record,
            party=party,
            service_type=service_a,
            pcs=10,
            rate=Decimal("70.00"),
            discount=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            record_date=date(2026, 2, 1),
        )
        baker.make(
            Record,
            party=party,
            service_type=service_b,
            pcs=20,
            rate=Decimal("15.00"),
            discount=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            record_date=date(2026, 2, 2),
        )

        payment_one = baker.make(
            Payment,
            party=party,
            amount=Decimal("500.00"),
            payment_date=date(2026, 2, 3),
        )
        payment_two = baker.make(
            Payment,
            party=party,
            amount=Decimal("500.00"),
            payment_date=date(2026, 2, 4),
        )

        PaymentService.allocate_payment(payment_one)
        PaymentService.allocate_payment(payment_two)

        api_client.force_authenticate(user=user)

        response = get_summary({
            'type': 'payment',
            'date_from': '2026-02-01',
            'date_to': '2026-02-28',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['summary']['total_payments'] == 2
        assert Decimal(response.data['summary']['total_paid']) == Decimal('1000.00')

        breakdown = {
            item['service_type__type_of_work']: item
            for item in response.data['summary']['service_type_summary']
        }

        assert breakdown['Service A']['total_pcs'] == 10
        assert Decimal(breakdown['Service A']['total_amount']) == Decimal('700.00')
        assert breakdown['Service B']['total_pcs'] == 20
        assert Decimal(breakdown['Service B']['total_amount']) == Decimal('300.00')

    def test_payment_summary_includes_partial_amount_but_not_pcs_until_fully_paid(self, api_client, get_summary):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service_full = baker.make(Service_Type, user=user, type_of_work="Fully Paid")
        service_partial = baker.make(Service_Type, user=user, type_of_work="Partially Paid")

        baker.make(
            Record,
            party=party,
            service_type=service_full,
            pcs=5,
            rate=Decimal("100.00"),
            discount=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            record_date=date(2026, 3, 1),
        )
        baker.make(
            Record,
            party=party,
            service_type=service_partial,
            pcs=4,
            rate=Decimal("100.00"),
            discount=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            record_date=date(2026, 3, 2),
        )

        payment = baker.make(
            Payment,
            party=party,
            amount=Decimal("700.00"),
            payment_date=date(2026, 3, 3),
        )

        PaymentService.allocate_payment(payment)

        api_client.force_authenticate(user=user)

        response = get_summary({
            'type': 'payment',
            'date_from': '2026-03-01',
            'date_to': '2026-03-31',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['summary']['total_payments'] == 1
        assert Decimal(response.data['summary']['total_paid']) == Decimal('700.00')

        breakdown = {
            item['service_type__type_of_work']: item
            for item in response.data['summary']['service_type_summary']
        }

        assert breakdown['Fully Paid']['total_pcs'] == 5
        assert Decimal(breakdown['Fully Paid']['total_amount']) == Decimal('500.00')
        assert breakdown['Partially Paid']['total_pcs'] == 0
        assert Decimal(breakdown['Partially Paid']['total_amount']) == Decimal('200.00')

    def test_payment_summary_adds_remaining_advance_to_single_fully_paid_service(self, api_client, get_summary):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service_card = baker.make(Service_Type, user=user, type_of_work="CARD")

        baker.make(
            Record,
            party=party,
            service_type=service_card,
            pcs=11,
            rate=Decimal("97.00"),
            discount=Decimal("1.80"),
            paid_amount=Decimal("0.00"),
            record_date=date(2026, 4, 17),
        )

        payment = baker.make(
            Payment,
            party=party,
            amount=Decimal("1165.20"),
            payment_date=date(2026, 4, 17),
        )

        PaymentService.allocate_payment(payment)

        api_client.force_authenticate(user=user)

        response = get_summary({
            'type': 'payment',
            'date_from': '2026-04-01',
            'date_to': '2026-04-30',
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['summary']['total_payments'] == 1
        assert Decimal(response.data['summary']['total_paid']) == Decimal('1165.20')

        breakdown = {
            item['service_type__type_of_work']: item
            for item in response.data['summary']['service_type_summary']
        }

        assert breakdown['CARD']['total_pcs'] == 11
        assert Decimal(breakdown['CARD']['total_amount']) == Decimal('1165.20')

    def test_payment_works_with_audit_log(self, api_client, get_summary):
        today = localdate()
        date_from = (today - timedelta(days=1)).isoformat()
        date_to = (today + timedelta(days=1)).isoformat()
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        payment_update = baker.make(Payment, party=party,
                                    payment_date=today)
        payment_delete = baker.make(Payment, party=party,
                                    payment_date=today)

        api_client.force_authenticate(user=user)

        update = api_client.patch(
            reverse('payment-detail', args=[payment_update.id]), {'amount': 90})

        delete = api_client.delete(
            reverse('payment-detail', args=[payment_delete.id]))

        update_response = get_summary({
            'type': 'audit_log',
            'date_from': date_from,
            'date_to': date_to,
            'model': 'Payment',
            'action': 'Update'
        })

        delete_response = get_summary({
            'type': 'audit_log',
            'date_from': date_from,
            'date_to': date_to,
            'model': 'Payment',
            'action': 'delete'
        })

        delete_id = {item['object_id']
                     for item in delete_response.data["results"]}
        update_id = {item['object_id']
                     for item in update_response.data["results"]}

        audit_log_update = AuditLog.objects.get(
            user=user,
            model_name='Payment',
            action='UPDATE',
            object_id=payment_update.id
        )

        audit_log_delete = AuditLog.objects.get(
            user=user,
            model_name='Payment',
            action='DELETE',
            object_id=payment_delete.id
        )

        assert update_response.status_code == status.HTTP_200_OK
        assert delete_response.status_code == status.HTTP_200_OK
        assert delete_id == {payment_delete.id}
        assert update_id == {payment_update.id}
        assert audit_log_delete.after is None
        assert audit_log_update.after is not None
        assert Decimal(audit_log_update.after['amount']) == Decimal('90')


@pytest.mark.django_db
class TestAdvanceLedgerSummary:

    def test_advance_ledger_in_out_query_work(self, api_client, get_summary):
        user = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=user)
        service = baker.make(Service_Type, user=user)

        payment = baker.make(Payment,
                             party=party,
                             payment_date=date(2026, 2, 1),
                             amount=100
                             )

        PaymentService.allocate_payment(payment)

        record = baker.make(Record,
                            party=party,
                            service_type=service,
                            pcs=10, rate=10,
                            record_date=date(2026, 1, 10)
                            )
        RecordService.apply_advance(record)

        api_client.force_authenticate(user=user)

        response_in = get_summary({
            'type': 'advance_ledger',
            'date_from': '2000-01-01',
            'date_to': '2099-12-31',
            'direction': "IN"
        })

        response_out = get_summary({
            'type': 'advance_ledger',
            'date_from': '2000-01-01',
            'date_to': '2099-12-31',
            'direction': "OUT"
        })

        advance_in = {i['payment_id'] for i in response_in.data['results']}
        advance_out = {i['record_id'] for i in response_out.data['results']}
        assert response_in.status_code == status.HTTP_200_OK
        assert response_out.status_code == status.HTTP_200_OK
        assert advance_in == {payment.id}
        assert advance_out == {record.id}
