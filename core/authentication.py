from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import exceptions

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
        
        # check if it's the same site
        reason = CsrfViewMiddleware(lambda request: None).process_view(
            request,
            None,
            (),
            {},
        )
        if reason:
            raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")

        return self.get_user(validated_token), validated_token
  

        

