from django.db import models
from django.conf import settings
from apps.projects.models import Project

class Task(models.Model):
    class Status(models.TextChoices):
        BACKLOG = 'BACKLOG', 'Backlog'
        TODO = 'TODO', 'To Do'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        IN_REVIEW = 'IN_REVIEW', 'In Review'
        DONE = 'DONE', 'Done'

    class Priority(models.TextChoices):
        URGENT = 'URGENT', 'Urgent'
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    task_number = models.PositiveIntegerField(editable=False)
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reported_tasks'
    )
    
    order = models.FloatField(default=1000.0, help_text='Ordering value for Kanban column sorting')
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.FloatField(default=0.0)
    actual_hours = models.FloatField(default=0.0)
    tags = models.JSONField(default=list, blank=True, help_text='List of tag strings e.g. ["Backend", "Auth"]')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']
        unique_together = ('project', 'task_number')

    def __str__(self):
        return f"{self.task_key}: {self.title}"

    @property
    def task_key(self):
        return f"{self.project.key}-{self.task_number}"

    def save(self, *args, **kwargs):
        if not self.task_number:
            last_task = Task.objects.filter(project=self.project).order_by('-task_number').first()
            self.task_number = (last_task.task_number + 1) if last_task else 1
        super().save(*args, **kwargs)


class SubTask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=250)
    is_completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"[{'x' if self.is_completed else ' '}] {self.title}"


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.email} on {self.task.task_key}"
