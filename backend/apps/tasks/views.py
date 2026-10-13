from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from .models import Task, SubTask, TaskComment
from .serializers import (
    TaskSerializer,
    TaskDetailSerializer,
    SubTaskSerializer,
    TaskCommentSerializer
)
from apps.activity.models import ActivityLog
from apps.notifications.models import Notification
from apps.common.pagination import StandardResultsSetPagination
from apps.common.permissions import IsTaskEditorOrReadOnly

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTaskEditorOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.select_related(
            'project', 'project__workspace', 'assignee', 'reporter'
        ).prefetch_related('subtasks', 'comments')

        if not (user.role == 'ADMIN' or user.is_staff):
            queryset = queryset.filter(
                Q(project__memberships__user=user) |
                Q(project__workspace__memberships__user=user) |
                Q(project__owner=user) |
                Q(assignee=user) |
                Q(reporter=user)
            ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        task_status = self.request.query_params.get('status')
        if task_status:
            queryset = queryset.filter(status=task_status)

        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)

        assignee_id = self.request.query_params.get('assignee')
        if assignee_id:
            queryset = queryset.filter(assignee_id=assignee_id)

        is_overdue = self.request.query_params.get('is_overdue')
        if is_overdue is not None and is_overdue.lower() in ['true', '1']:
            queryset = queryset.filter(due_date__lt=timezone.now().date()).exclude(status='DONE')

        search_term = self.request.query_params.get('search')
        if search_term:
            queryset = queryset.filter(
                Q(title__icontains=search_term) |
                Q(description__icontains=search_term) |
                Q(task_number__icontains=search_term)
            )

        ordering = self.request.query_params.get('ordering', 'order')
        return queryset.order_by(ordering)

    def perform_create(self, serializer):
        user = self.request.user
        task = serializer.save(reporter=user)

        # Log Activity
        ActivityLog.objects.create(
            workspace=task.project.workspace,
            project=task.project,
            task=task,
            actor=user,
            action_type=ActivityLog.ActionType.TASK_CREATED,
            message=f"{user.full_name} created task {task.task_key}: {task.title}",
            changes={'status': task.status, 'priority': task.priority}
        )

        # Notify assignee if assigned to someone else
        if task.assignee and task.assignee != user:
            Notification.objects.create(
                recipient=task.assignee,
                actor=user,
                title=f"New Task Assigned: {task.task_key}",
                message=f"{user.full_name} assigned you to '{task.title}' in {task.project.name}",
                notification_type=Notification.NotificationType.TASK_ASSIGNED,
                related_task=task,
                related_project=task.project
            )

    def perform_update(self, serializer):
        user = self.request.user
        old_task = self.get_object()
        old_status = old_task.status
        old_assignee = old_task.assignee
        task = serializer.save()

        changes = {}
        if old_status != task.status:
            changes['status'] = {'old': old_status, 'new': task.status}
            ActivityLog.objects.create(
                workspace=task.project.workspace,
                project=task.project,
                task=task,
                actor=user,
                action_type=ActivityLog.ActionType.TASK_STATUS_CHANGED,
                message=f"{user.full_name} moved {task.task_key} from {old_status} to {task.status}",
                changes=changes
            )
            # Notify assignee if someone else moved it
            if task.assignee and task.assignee != user:
                Notification.objects.create(
                    recipient=task.assignee,
                    actor=user,
                    title=f"Task Status Changed: {task.task_key}",
                    message=f"Status changed to {task.status} by {user.full_name}",
                    notification_type=Notification.NotificationType.STATUS_CHANGED,
                    related_task=task,
                    related_project=task.project
                )

        if old_assignee != task.assignee:
            new_assignee_email = task.assignee.email if task.assignee else None
            old_assignee_email = old_assignee.email if old_assignee else None
            changes['assignee'] = {'old': old_assignee_email, 'new': new_assignee_email}

            if task.assignee:
                msg = f"{user.full_name} assigned {task.task_key} to {task.assignee.full_name}"
            else:
                msg = f"{user.full_name} unassigned {task.task_key}"

            ActivityLog.objects.create(
                workspace=task.project.workspace,
                project=task.project,
                task=task,
                actor=user,
                action_type=ActivityLog.ActionType.TASK_ASSIGNED,
                message=msg,
                changes=changes
            )
            if task.assignee and task.assignee != user:
                Notification.objects.create(
                    recipient=task.assignee,
                    actor=user,
                    title=f"Task Assigned: {task.task_key}",
                    message=f"{user.full_name} assigned you to '{task.title}'",
                    notification_type=Notification.NotificationType.TASK_ASSIGNED,
                    related_task=task,
                    related_project=task.project
                )

    @action(detail=True, methods=['post'], url_path='reorder')
    def reorder(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        new_order = request.data.get('order')

        old_status = task.status
        if new_status and new_status in dict(Task.Status.choices):
            task.status = new_status
        if new_order is not None:
            task.order = float(new_order)
        task.save()

        if new_status and old_status != new_status:
            ActivityLog.objects.create(
                workspace=task.project.workspace,
                project=task.project,
                task=task,
                actor=request.user,
                action_type=ActivityLog.ActionType.TASK_STATUS_CHANGED,
                message=f"{request.user.full_name} moved {task.task_key} to {new_status}",
                changes={'old_status': old_status, 'new_status': new_status}
            )

        serializer = TaskSerializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='subtasks')
    def subtasks(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            subtasks = task.subtasks.all()
            return Response(SubTaskSerializer(subtasks, many=True).data)

        title = request.data.get('title', '').strip()
        if not title:
            return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)

        order = task.subtasks.count() + 1
        subtask = SubTask.objects.create(task=task, title=title, order=order)
        return Response(SubTaskSerializer(subtask).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch', 'delete'], url_path='subtasks/(?P<subtask_id>[^/.]+)')
    def manage_subtask(self, request, pk=None, subtask_id=None):
        task = self.get_object()
        subtask = get_object_or_404(SubTask, id=subtask_id, task=task)

        if request.method == 'DELETE':
            subtask.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        if 'is_completed' in request.data:
            subtask.is_completed = request.data['is_completed']
        if 'title' in request.data:
            subtask.title = request.data['title']
        subtask.save()
        return Response(SubTaskSerializer(subtask).data)

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            comments = task.comments.select_related('author').all()
            return Response(TaskCommentSerializer(comments, many=True).data)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Comment content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = TaskComment.objects.create(task=task, author=request.user, content=content)

        # Log Activity
        ActivityLog.objects.create(
            workspace=task.project.workspace,
            project=task.project,
            task=task,
            actor=request.user,
            action_type=ActivityLog.ActionType.COMMENT_ADDED,
            message=f"{request.user.full_name} commented on {task.task_key}",
            changes={'comment': content[:80]}
        )

        # Notify assignee if someone else commented
        if task.assignee and task.assignee != request.user:
            Notification.objects.create(
                recipient=task.assignee,
                actor=request.user,
                title=f"New Comment on {task.task_key}",
                message=f"{request.user.full_name}: {content[:100]}",
                notification_type=Notification.NotificationType.COMMENT_ADDED,
                related_task=task,
                related_project=task.project
            )

        return Response(TaskCommentSerializer(comment).data, status=status.HTTP_201_CREATED)
