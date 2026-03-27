from urllib.parse import urlparse

from djoser.email import PasswordResetEmail
from django.conf import settings


class CustomPasswordResetEmail(PasswordResetEmail):
    def get_context_data(self):
        context = super().get_context_data()
        frontend = urlparse(settings.FRONTEND_URL)

        context["protocol"] = frontend.scheme
        context["domain"] = frontend.netloc
        context["url"] = f"reset-password/{context['uid']}/{context['token']}"
        return context
