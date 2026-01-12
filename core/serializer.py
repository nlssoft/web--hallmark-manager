from djoser.serializers import UserCreateSerializer as baseucs

class UserCreateSerializer(baseucs):
    class Meta(baseucs.Meta):
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email']