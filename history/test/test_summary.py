import pytest
from django.conf import settings
from history.models import *
from model_bakery import baker
from rest_framework import status
from history.service import *
from django.urls import reverse
from datetime import date
from django.utils.timezone import localdate


@pytest.mark.django_db
class TestAuthCheckSummary:
    """Test authentication and authorization"""

    def test_anonymous_user_cannot_see_summary_return_401(self, api_client):
        """Anonymous users should get 401"""
        response = api_client.get(reverse('summary'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_a_cannot_see_user_b_summary(self, api_client):
        """User A should not see User B's records"""
        user_a = baker.make(settings.AUTH_USER_MODEL)
        user_b = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user=user_b)
        service = baker.make(Service_Type, user=user_b)

        record = baker.make(Record, party=party, service_type=service)

        api_client.force_authenticate(user=user_a)

        response = api_client.get(reverse('summary'), {
            'type': 'record',
            'date_from': '2025-12-20',
            'date_to': '2026-01-31',
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
            'date_from': '2025-12-20',
            'date_to': '2026-01-31',
            'model': 'Record',
            'action': 'Update'
        })

        delete_response = get_summary({
            'type': 'audit_log',
            'date_from': '2025-12-20',
            'date_to': '2026-01-31',
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

    def test_payment_works_with_audit_log(self, api_client, get_summary):
        today = localdate()
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
            'date_from': '2025-12-20',
            'date_to': '2026-01-31',
            'model': 'Payment',
            'action': 'Update'
        })

        delete_response = get_summary({
            'type': 'audit_log',
            'date_from': '2025-12-20',
            'date_to': '2026-01-31',
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
            'date_from': '2025-12-20',
            'date_to': '2026-02-15',
            'direction': "IN"
        })

        response_out = get_summary({
            'type': 'advance_ledger',
            'date_from': '2025-12-20',
            'date_to': '2026-02-15',
            'direction': "OUT"
        })

        advance_in = {i['payment_id'] for i in response_in.data['results']}
        advance_out = {i['record_id'] for i in response_out.data['results']}
        assert response_in.status_code == status.HTTP_200_OK
        assert response_out.status_code == status.HTTP_200_OK
        assert advance_in == {payment.id}
        assert advance_out == {record.id}
