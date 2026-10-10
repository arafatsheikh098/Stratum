from rest_framework import serializers
from .models import ActivityLog
from apps.accounts.serializers import UserSerializer

class ActivityLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    project_name = serializers.ReadOnlyField(source='project.name')
    project_key = serializers.ReadOnlyField(source='project.key')
    task_key = serializers.ReadOnlyField(source='task.task_key')
    task_title = serializers.ReadOnlyField(source='task.title')

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'workspace', 'project', 'project_name', 'project_key',
            'task', 'task_key', 'task_title', 'actor',
            'action_type', 'message', 'changes', 'created_at'
        ]
