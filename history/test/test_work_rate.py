import pytest
from django.conf import settings
from history.models import Party, Record, Service_Type, Work_Rate
from model_bakery import baker
from rest_framework import status
from django.urls import reverse




@pytest.mark.django_db
class TestGetingDetails:

    def test_if_anonymous_user_see_work_rate_return_401(self, api_client):
        response = api_client.get(reverse('work-rate-list'))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_if_user_owner_return_200(self, api_client):
        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)
        response = api_client.get(reverse('work-rate-list'))

        assert response.status_code == status.HTTP_200_OK

    def test_if_user_a_can_see_user_b_work_rate(self, api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL)


        user_b = baker.make(settings.AUTH_USER_MODEL)


        party = baker.make(Party, user = user_b)

        service = baker.make(
            Service_Type,
            user= user_b,
        )

        baker.make(
            Work_Rate,
            party = party,
            service_type = service,
            rate = 33 
        )

        api_client.force_authenticate(user=user_a)

        response = api_client.get(reverse('work-rate-list'))

        assert response.data["results"] == []


@pytest.mark.django_db
class TestCreateWork_rate:

    def test_cheking_if_anonymous_can_not_create_work_rate(self,api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL)
        party = baker.make(Party, user = user_a)

        service = baker.make(
            Service_Type,
            user= user_a,
        )


        response = api_client.post(
            reverse('work-rate-list'), {
                'party':party.id,
                'service_type': service.id,
                'rate': 55
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cheking_if_user_can_create_work_rate(self, api_client):

        user_a = baker.make(settings.AUTH_USER_MODEL)
        api_client.force_authenticate(user=user_a)
        

        party = baker.make(Party, user = user_a)

        service = baker.make(
            Service_Type,
            user= user_a,
        )


        response = api_client.post(
            reverse('work-rate-list'), {
                'party':party.id,
                'service_type': service.id,
                'rate': 55
            }
        )

        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['id'] > 0



@pytest.mark.django_db
class TestDeleteWork_rate:

    def test_user_can_delete_work_rate(self, api_client):
        
        user = baker.make(settings.AUTH_USER_MODEL)

        party = baker.make(Party, user = user)

        service = baker.make(Service_Type, user = user)

        work_rate = baker.make(
            Work_Rate,
            party = party,
            service_type = service
        )

        api_client.force_authenticate(user=user)

        response = api_client.delete(
            reverse('work-rate-detail', args=[work_rate.id])
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_cheking_if_user_a_can_delete_user_b_work_rate(self, api_client):

        user_a = baker.make(
            settings.AUTH_USER_MODEL
        )

        user_b = baker.make(
            settings.AUTH_USER_MODEL
        )


        party = baker.make(Party, user = user_b)

        service = baker.make(
            Service_Type,
            user= user_b,
        )


        work_rate = baker.make(
            Work_Rate,
            party = party,
            service_type = service,
            rate = 33 
        )

        api_client.force_authenticate(user=user_a)

        response = api_client.delete(reverse('work-rate-detail', args=[work_rate.id]))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cheking_work_rate_validations_fials(self, api_client):

        user = baker.make(settings.AUTH_USER_MODEL)

        party= baker.make(Party, user=user)

        service = baker.make(Service_Type, user=user)

        api_client.force_authenticate(user=user)

        response = api_client.post(reverse('work-rate-list'), {
            "party": party.id,
            "service_type": service.id,
            "rate": -10
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST



@pytest.mark.django_db
class TestUpdateWork_rate:
    def test_checking_if_update_works(self, api_client):

        user_b = baker.make(
            settings.AUTH_USER_MODEL
        )


        party = baker.make(Party, user = user_b)

        service = baker.make(
            Service_Type,
            user= user_b,
        )


        work_rate = Work_Rate.objects.create(
            party = party,
            service_type = service,
            rate = 33 
        )

        api_client.force_authenticate(user=user_b)

        response = api_client.patch(reverse('work-rate-detail', args=[work_rate.id]), {"rate": 99})

        assert response.status_code == status.HTTP_200_OK
 
    def test_cheking_if_user_a_can_update_user_b_work_rate(self, api_client):

        user_a = baker.make(
            settings.AUTH_USER_MODEL
        )

        user_b = baker.make(
            settings.AUTH_USER_MODEL
        )


        party = baker.make(Party, user = user_b)

        service = baker.make(
            Service_Type,
            user= user_b,
        )


        work_rate = baker.make(
            Work_Rate,
            party = party,
            service_type = service,
            rate = 33 
        )

        api_client.force_authenticate(user=user_a)

        response = api_client.patch(reverse('work-rate-detail', args=[work_rate.id]), {"rate": 43})

        assert response.status_code == status.HTTP_404_NOT_FOUND



@pytest.mark.django_db
class TestUinqueConditionsWork_rate:
       
    def test_cheking_if_duplicate_can_happen_in_work_rate(self, api_client):

        user_b = baker.make(
            settings.AUTH_USER_MODEL
        )


        party = baker.make(Party, user = user_b)

        service = baker.make(
            Service_Type,
            user= user_b,
        )


        work_rate = baker.make(
            Work_Rate,
            party = party,
            service_type = service,
            rate = 33 
        )

        api_client.force_authenticate(user=user_b)

        response = api_client.post(reverse(
                                        'work-rate-list'), {
                                        "party": party.id,
                                        'service_type': service.id, 
                                        "rate": 100
                                        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
