from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Workspace, WorkspaceMember
from .serializers import WorkspaceSerializer, WorkspaceMemberSerializer
from apps.common.permissions import IsAdminUserOrReadOnly

User = get_user_model()

class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            return Workspace.objects.all()
        return Workspace.objects.filter(Q(memberships__user=user) | Q(owner=user)).distinct()

    def perform_create(self, serializer):
        workspace = serializer.save(owner=self.request.user)
        # Add owner as admin member
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            user=self.request.user,
            defaults={'role': 'ADMIN'}
        )

    @action(detail=True, methods=['get', 'post'])
    def members(self, request, pk=None):
        workspace = self.get_object()
        if request.method == 'GET':
            members = workspace.memberships.select_related('user').all()
            serializer = WorkspaceMemberSerializer(members, many=True)
            return Response(serializer.data)

        # POST: Add/invite member
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'MEMBER')
        user = get_object_or_404(User, id=user_id)
        
        member, created = WorkspaceMember.objects.update_or_create(
            workspace=workspace,
            user=user,
            defaults={'role': role}
        )
        serializer = WorkspaceMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)')
    def remove_member(self, request, pk=None, user_id=None):
        workspace = self.get_object()
        membership = get_object_or_404(WorkspaceMember, workspace=workspace, user_id=user_id)
        if membership.user_id == workspace.owner_id:
            return Response({'error': 'Cannot remove the workspace owner.'}, status=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        return Response({'message': 'Member removed successfully.'}, status=status.HTTP_204_NO_CONTENT)
