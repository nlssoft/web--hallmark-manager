from djoser.serializers import UserSerializer as baseuserserillaizer, \
    UserCreateSerializer as BaseUserCreateSerializer


class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        fields = ['id', 'username', 'password', 'first_name',
                  'last_name', 'email', 'number', 'address']


class UserSerializer(baseuserserillaizer):
    class Meta(baseuserserillaizer.Meta):
        fields = ['id', 'username', 'first_name',
                  'last_name', 'email', 'number', 'address']
        read_only_fields = ['id', 'username']
