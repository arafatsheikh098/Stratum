from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace

class Project(models.Model):
    class Status(models.TextChoices):
        PLANNING = 'PLANNING', 'Planning'
        ACTIVE = 'ACTIVE', 'Active'
        ON_HOLD = 'ON_HOLD', 'On Hold'
        COMPLETED = 'COMPLETED', 'Completed'

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=150)
    key = models.CharField(max_length=10, help_text='Short prefix for tasks e.g. STR, PAY, MOB')
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_projects'
    )
    color = models.CharField(max_length=20, default='#3B82F6')
    target_end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('workspace', 'key')

    def __str__(self):
        return f"{self.name} ({self.key})"

    def save(self, *args, **kwargs):
        self.key = self.key.upper().strip()
        super().save(*args, **kwargs)


class ProjectMember(models.Model):
    class Role(models.TextChoices):
        MANAGER = 'MANAGER', 'Project Manager'
        CONTRIBUTOR = 'CONTRIBUTOR', 'Contributor'
        VIEWER = 'VIEWER', 'Viewer'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CONTRIBUTOR)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.email} on {self.project.name} ({self.role})"
