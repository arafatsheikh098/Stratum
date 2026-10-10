from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace
from apps.projects.models import Project

class ActivityLog(models.Model):
    class ActionType(models.TextChoices):
        TASK_CREATED = 'TASK_CREATED', 'Task Created'
        TASK_UPDATED = 'TASK_UPDATED', 'Task Updated'
        TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED', 'Task Status Changed'
        TASK_ASSIGNED = 'TASK_ASSIGNED', 'Task Assigned'
        COMMENT_ADDED = 'COMMENT_ADDED', 'Comment Added'
        PROJECT_CREATED = 'PROJECT_CREATED', 'Project Created'
        PROJECT_UPDATED = 'PROJECT_UPDATED', 'Project Updated'

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, related_name='activities', null=True, blank=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='actions')
    action_type = models.CharField(max_length=30, choices=ActionType.choices)
    message = models.TextField()
    changes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.action_type}] {self.actor.email}: {self.message[:50]}"
