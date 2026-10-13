from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectMemberSerializer
from apps.workspaces.models import Workspace
from apps.common.permissions import IsAdminUserOrReadOnly

User = get_user_model()

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]
    filterset_fields = ['workspace', 'status']
    search_fields = ['name', 'key', 'description']

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.all().select_related('workspace', 'owner')
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        if user.role == 'ADMIN' or user.is_staff:
            return queryset
        # Filter to projects where user is project member, workspace member, or owner
        return queryset.filter(
            Q(memberships__user=user) |
            Q(workspace__memberships__user=user) |
            Q(owner=user) |
            Q(workspace__owner=user)
        ).distinct()

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        # Add creator as manager
        ProjectMember.objects.get_or_create(
            project=project,
            user=self.request.user,
            defaults={'role': 'MANAGER'}
        )

    @action(detail=True, methods=['get', 'post'])
    def members(self, request, pk=None):
        project = self.get_object()
        if request.method == 'GET':
            members = project.memberships.select_related('user').all()
            serializer = ProjectMemberSerializer(members, many=True)
            return Response(serializer.data)

        # POST add member
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'CONTRIBUTOR')
        user = get_object_or_404(User, id=user_id)
        
        member, created = ProjectMember.objects.update_or_create(
            project=project,
            user=user,
            defaults={'role': role}
        )
        serializer = ProjectMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)')
    def remove_member(self, request, pk=None, user_id=None):
        project = self.get_object()
        membership = get_object_or_404(ProjectMember, project=project, user_id=user_id)
        membership.delete()
        return Response({'message': 'Project member removed successfully.'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        project = self.get_object()
        tasks = project.tasks.select_related('assignee').all()
        
        # Priority breakdown
        priority_breakdown = {
            'URGENT': tasks.filter(priority='URGENT').count(),
            'HIGH': tasks.filter(priority='HIGH').count(),
            'MEDIUM': tasks.filter(priority='MEDIUM').count(),
            'LOW': tasks.filter(priority='LOW').count(),
        }

        # Status breakdown
        status_breakdown = {
            'BACKLOG': tasks.filter(status='BACKLOG').count(),
            'TODO': tasks.filter(status='TODO').count(),
            'IN_PROGRESS': tasks.filter(status='IN_PROGRESS').count(),
            'IN_REVIEW': tasks.filter(status='IN_REVIEW').count(),
            'DONE': tasks.filter(status='DONE').count(),
        }

        # Assignee workload
        workload = []
        members = project.memberships.select_related('user').all()
        for m in members:
            u = m.user
            assigned = tasks.filter(assignee=u)
            workload.append({
                'user_id': u.id,
                'name': u.full_name,
                'email': u.email,
                'avatar_color': u.avatar_color,
                'total_assigned': assigned.count(),
                'completed': assigned.filter(status='DONE').count(),
                'in_progress': assigned.filter(status='IN_PROGRESS').count(),
            })

        return Response({
            'project_id': project.id,
            'name': project.name,
            'key': project.key,
            'priority_breakdown': priority_breakdown,
            'status_breakdown': status_breakdown,
            'team_workload': workload
        })
