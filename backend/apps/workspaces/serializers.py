from rest_framework import serializers
from .models import Workspace, WorkspaceMember
from apps.accounts.serializers import UserSerializer

class WorkspaceMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WorkspaceMember
        fields = ['id', 'workspace', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'slug', 'description', 'owner',
            'logo_color', 'member_count', 'project_count',
            'user_role', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_project_count(self, obj):
        return obj.projects.count() if hasattr(obj, 'projects') else 0

    def get_user_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        if obj.owner_id == request.user.id or request.user.role == 'ADMIN':
            return 'ADMIN'
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else 'MEMBER'
