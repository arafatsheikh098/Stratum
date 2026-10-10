from rest_framework import serializers
from .models import Notification
from apps.accounts.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    task_key = serializers.ReadOnlyField(source='related_task.task_key')
    project_name = serializers.ReadOnlyField(source='related_project.name')

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'actor', 'title', 'message',
            'notification_type', 'related_task', 'task_key',
            'related_project', 'project_name', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'recipient', 'actor', 'created_at']
