from rest_framework import serializers
from django.utils import timezone
from .models import Project, ProjectMember
from apps.accounts.serializers import UserSerializer

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    owner_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    stats = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'workspace', 'name', 'key', 'description',
            'status', 'owner', 'owner_id', 'color', 'target_end_date',
            'stats', 'members_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_members_count(self, obj):
        return obj.memberships.count()

    def get_stats(self, obj):
        tasks = obj.tasks.all() if hasattr(obj, 'tasks') else []
        total = tasks.count() if hasattr(tasks, 'count') else len(tasks)
        if total == 0:
            return {
                'total': 0,
                'completed': 0,
                'in_progress': 0,
                'backlog': 0,
                'in_review': 0,
                'todo': 0,
                'overdue': 0,
                'completion_rate': 0
            }
        
        now = timezone.now().date()
        completed = tasks.filter(status='DONE').count()
        in_progress = tasks.filter(status='IN_PROGRESS').count()
        in_review = tasks.filter(status='IN_REVIEW').count()
        todo = tasks.filter(status='TODO').count()
        backlog = tasks.filter(status='BACKLOG').count()
        overdue = tasks.filter(due_date__lt=now).exclude(status__in=['DONE', 'CANCELLED']).count()
        
        completion_rate = round((completed / total) * 100) if total > 0 else 0

        return {
            'total': total,
            'completed': completed,
            'in_progress': in_progress,
            'in_review': in_review,
            'todo': todo,
            'backlog': backlog,
            'overdue': overdue,
            'completion_rate': completion_rate
        }
