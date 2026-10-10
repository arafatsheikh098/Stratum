from django.db import models
from django.conf import settings

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        TASK_ASSIGNED = 'TASK_ASSIGNED', 'Task Assigned'
        STATUS_CHANGED = 'STATUS_CHANGED', 'Status Changed'
        DEADLINE_APPROACHING = 'DEADLINE_APPROACHING', 'Deadline Approaching'
        COMMENT_ADDED = 'COMMENT_ADDED', 'Comment Added'
        MENTION = 'MENTION', 'Mention'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    related_task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True)
    related_project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"To {self.recipient.email}: {self.title}"
