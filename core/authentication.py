from django.conf import settings
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import Token


class CookieJwtAuthentication(JWTAuthentication):
    def authenticate(self, request):
        cookie_name = getattr(settings, "SIMPLE_JWT", {}).get('AUTH_COOKIE', 'access') 
        raw_token = request.COOKIES.get(cookie_name)

        if raw_token is None:
            return None
        
        try: 
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken: 
            return None
        
        return self.get_user(validated_token), validated_token
    

        

