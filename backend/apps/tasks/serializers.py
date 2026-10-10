from rest_framework import serializers
from django.utils import timezone
from .models import Task, SubTask, TaskComment
from apps.accounts.serializers import UserSerializer

class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ['id', 'task', 'title', 'is_completed', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    task_key = serializers.ReadOnlyField()
    project_key = serializers.ReadOnlyField(source='project.key')
    project_name = serializers.ReadOnlyField(source='project.name')
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    reporter = UserSerializer(read_only=True)
    reporter_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    subtasks_total = serializers.SerializerMethodField()
    subtasks_completed = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_key', 'project_name',
            'task_number', 'task_key', 'title', 'description',
            'status', 'priority', 'assignee', 'assignee_id',
            'reporter', 'reporter_id', 'order', 'due_date',
            'estimated_hours', 'actual_hours', 'tags',
            'subtasks_total', 'subtasks_completed', 'comments_count',
            'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'task_number', 'task_key', 'created_at', 'updated_at']

    def get_subtasks_total(self, obj):
        return obj.subtasks.count() if hasattr(obj, 'subtasks') else 0

    def get_subtasks_completed(self, obj):
        return obj.subtasks.filter(is_completed=True).count() if hasattr(obj, 'subtasks') else 0

    def get_comments_count(self, obj):
        return obj.comments.count() if hasattr(obj, 'comments') else 0

    def get_is_overdue(self, obj):
        if not obj.due_date or obj.status == 'DONE':
            return False
        return obj.due_date < timezone.now().date()


class TaskDetailSerializer(TaskSerializer):
    subtasks = SubTaskSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)

    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['subtasks', 'comments']
