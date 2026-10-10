from rest_framework import generics, permissions
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from apps.common.pagination import StandardResultsSetPagination

class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = ActivityLog.objects.select_related('actor', 'project', 'task').all()
        project_id = self.request.query_params.get('project')
        task_id = self.request.query_params.get('task')
        action_type = self.request.query_params.get('action_type')

        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        if action_type:
            queryset = queryset.filter(action_type=action_type)

        return queryset
