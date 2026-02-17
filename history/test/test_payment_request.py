import pytest
from decimal import Decimal
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from model_bakery import baker
from datetime import timedelta
from django.utils.timezone import localdate

from history.service import *
from history.models import Party, Service_Type, Record, Payment_Request, Payment


def _results(data):
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


@pytest.mark.django_db
class TestPaymentRequestAuth:
    def test_anonymous_user_cannot_list(self, api_client):
        response = api_client.get(reverse("request-payment-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_main_user_cannot_create_request(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user=main)
        service = baker.make(Service_Type, user=main)
        record = baker.make(
            Record, party=party, service_type=service, rate=Decimal("10.00"), pcs=5, paid_amount=0
        )

        api_client.force_authenticate(user=main)
        response = api_client.post(
            reverse("request-payment-list"),
            {"record": [record.id]},
            format="json",
        )

        # create allowed only for child user by PaymentRequestLimitastion
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]


@pytest.mark.django_db
class TestPaymentRequestCreate:
    def test_child_can_create_requests_grouped_by_party(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        child = baker.make(settings.AUTH_USER_MODEL, parent=main)

        party_a = baker.make(Party, user=main, assigned_to=child)
        party_b = baker.make(Party, user=main, assigned_to=child)
        service = baker.make(Service_Type, user=main)

        r1 = baker.make(Record, party=party_a, service_type=service,
                        rate=Decimal("10.00"), pcs=5, paid_amount=0)  # 50
        r2 = baker.make(Record, party=party_a, service_type=service,
                        rate=Decimal("20.00"), pcs=2, paid_amount=0)  # 40
        r3 = baker.make(Record, party=party_b, service_type=service,
                        rate=Decimal("15.00"), pcs=2, paid_amount=0)  # 30

        api_client.force_authenticate(user=child)
        response = api_client.post(
            reverse("request-payment-list"),
            {"record": [r1.id, r2.id, r3.id]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        created = response.data
        assert len(created) == 2

        amounts = sorted([Decimal(str(x["requested_amount"]))
                         for x in created])
        assert amounts == [Decimal("30.00"), Decimal("90.00")]

        assert Payment_Request.objects.count() == 2

    def test_child_cannot_request_unassigned_party_record(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        child = baker.make(settings.AUTH_USER_MODEL, parent=main)
        other_child = baker.make(settings.AUTH_USER_MODEL, parent=main)

        party = baker.make(Party, user=main, assigned_to=other_child)
        service = baker.make(Service_Type, user=main)
        record = baker.make(Record, party=party,
                            service_type=service, rate=10, pcs=2, paid_amount=0)

        api_client.force_authenticate(user=child)
        response = api_client.post(
            reverse("request-payment-list"),
            {"record": [record.id]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPaymentRequestApproveReject:
    def test_main_can_approve_pending_request(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        child = baker.make(settings.AUTH_USER_MODEL, parent=main)

        party = baker.make(Party, user=main, assigned_to=child)
        service = baker.make(Service_Type, user=main)
        record = baker.make(Record, party=party, service_type=service, rate=Decimal(
            "10.00"), pcs=5, paid_amount=0)

        pr = baker.make(
            Payment_Request,
            created_by=child,
            party=party,
            requested_amount=Decimal("50.00"),
            status="P",
        )
        pr.record.add(record)

        api_client.force_authenticate(user=main)
        response = api_client.post(
            reverse("request-payment-approve", args=[pr.id]), format="json")

        pr.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert pr.status == "A"
        assert Payment.objects.filter(
            party=party, amount=Decimal("50.00")).exists()

    def test_child_cannot_approve(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        child = baker.make(settings.AUTH_USER_MODEL, parent=main)

        party = baker.make(Party, user=main, assigned_to=child)
        pr = baker.make(Payment_Request, created_by=child,
                        party=party, requested_amount=50, status="P")

        api_client.force_authenticate(user=child)
        response = api_client.post(
            reverse("request-payment-approve", args=[pr.id]), format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_main_can_reject_pending_request(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        child = baker.make(settings.AUTH_USER_MODEL, parent=main)

        party = baker.make(Party, user=main, assigned_to=child)
        pr = baker.make(Payment_Request, created_by=child,
                        party=party, requested_amount=50, status="P")

        api_client.force_authenticate(user=main)
        response = api_client.post(
            reverse("request-payment-reject", args=[pr.id]),
            {"reason": "not valid"},
            format="json",
        )

        pr.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert pr.status == "R"
        assert pr.rejected_reason == "not valid"


@pytest.mark.django_db
class TestPaymentRequestUpdate:
    def test_update_can_only_remove_records_and_recalculates_amount(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        child = baker.make(settings.AUTH_USER_MODEL, parent=main)

        party = baker.make(Party, user=main, assigned_to=child)
        service = baker.make(Service_Type, user=main)

        r1 = baker.make(Record, party=party, service_type=service,
                        rate=Decimal("10.00"), pcs=5, paid_amount=0)  # 50
        r2 = baker.make(Record, party=party, service_type=service,
                        rate=Decimal("10.00"), pcs=3, paid_amount=0)  # 30

        pr = baker.make(
            Payment_Request,
            created_by=child,
            party=party,
            requested_amount=Decimal("80.00"),
            status="P",
        )
        pr.record.set([r1, r2])

        api_client.force_authenticate(user=child)
        response = api_client.patch(
            reverse("request-payment-detail", args=[pr.id]),
            {"record": [r1.id]},
            format="json",
        )

        pr.refresh_from_db()
        assert response.status_code == status.HTTP_200_OK
        assert pr.requested_amount == Decimal("50.00")
        assert list(pr.record.values_list("id", flat=True)) == [r1.id]


@pytest.mark.django_db
class TestPendingRequestRecalculationFromPaymentChanges:
    def test_pending_request_amount_updates_when_payment_amount_reduced(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        child = baker.make(settings.AUTH_USER_MODEL, parent=main)

        party = baker.make(Party, user=main, assigned_to=child)
        service = baker.make(Service_Type, user=main)

        # Two records: 100 + 100
        r1 = baker.make(
            Record,
            party=party,
            service_type=service,
            rate=Decimal("10.00"),
            pcs=10,
            paid_amount=Decimal("0.00"),
            record_date=localdate() - timedelta(days=1),
        )
        r2 = baker.make(
            Record,
            party=party,
            service_type=service,
            rate=Decimal("10.00"),
            pcs=10,
            paid_amount=Decimal("0.00"),
            record_date=localdate(),
        )

        # Payment 110 -> r1 fully paid (100), r2 partially paid (10), r2 remaining = 90
        payment = baker.make(Payment, party=party, amount=Decimal("110.00"))
        PaymentService.allocate_payment(payment)

        r1.refresh_from_db()
        r2.refresh_from_db()
        assert r1.remaining_amount == Decimal("0.00")
        assert r2.remaining_amount == Decimal("90.00")

        # Child creates pending request on unpaid record
        api_client.force_authenticate(user=child)
        create_resp = api_client.post(
            reverse("request-payment-list"),
            {"record": [r2.id]},
            format="json",
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        pr_id = create_resp.data[0]["id"]

        pr = Payment_Request.objects.get(id=pr_id)
        assert pr.requested_amount == Decimal("90.00")
        assert pr.status == "P"

        # Main updates payment 110 -> 100, pending request should become 100
        api_client.force_authenticate(user=main)
        update_resp = api_client.patch(
            reverse("payment-detail", args=[payment.id]),
            {"amount": Decimal("100.00")},
            format="json",
        )
        assert update_resp.status_code == status.HTTP_200_OK

        pr.refresh_from_db()
        assert pr.requested_amount == Decimal("100.00")
        assert pr.status == "P"

    def test_pending_request_amount_updates_when_payment_deleted(self, api_client):
        main = baker.make(settings.AUTH_USER_MODEL)
        child = baker.make(settings.AUTH_USER_MODEL, parent=main)

        party = baker.make(Party, user=main, assigned_to=child)
        service = baker.make(Service_Type, user=main)

        r1 = baker.make(
            Record,
            party=party,
            service_type=service,
            rate=Decimal("10.00"),
            pcs=10,
            paid_amount=Decimal("0.00"),
            record_date=localdate() - timedelta(days=1),
        )
        r2 = baker.make(
            Record,
            party=party,
            service_type=service,
            rate=Decimal("10.00"),
            pcs=10,
            paid_amount=Decimal("0.00"),
            record_date=localdate(),
        )

        payment = baker.make(Payment, party=party, amount=Decimal("110.00"))
        PaymentService.allocate_payment(payment)

        r2.refresh_from_db()
        assert r2.remaining_amount == Decimal("90.00")

        api_client.force_authenticate(user=child)
        create_resp = api_client.post(
            reverse("request-payment-list"),
            {"record": [r2.id]},
            format="json",
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        pr_id = create_resp.data[0]["id"]

        pr = Payment_Request.objects.get(id=pr_id)
        assert pr.requested_amount == Decimal("90.00")
        assert pr.status == "P"

        # Delete payment before approval -> pending request should become 100
        api_client.force_authenticate(user=main)
        delete_resp = api_client.delete(
            reverse("payment-detail", args=[payment.id]))
        assert delete_resp.status_code == status.HTTP_204_NO_CONTENT

        pr.refresh_from_db()
        assert pr.requested_amount == Decimal("100.00")
        assert pr.status == "P"
