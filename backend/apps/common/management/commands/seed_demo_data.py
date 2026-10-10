from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task, SubTask, TaskComment
from apps.activity.models import ActivityLog
from apps.notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds realistic sample data for Stratum SaaS portfolio demonstration'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding Stratum SaaS demo data...'))

        # 1. Create Demo Users
        users_data = [
            {
                'email': 'alex.techlead@stratum.io',
                'username': 'alex_rivera',
                'first_name': 'Alex',
                'last_name': 'Rivera',
                'role': 'ADMIN',
                'title': 'VP of Engineering / Tech Lead',
                'avatar_color': '#6366F1',
                'bio': 'System architect focused on high-throughput microservices, Kubernetes, and SaaS reliability.',
            },
            {
                'email': 'sarah.pm@stratum.io',
                'username': 'sarah_chen',
                'first_name': 'Sarah',
                'last_name': 'Chen',
                'role': 'PROJECT_MANAGER',
                'title': 'Lead Technical Product Manager',
                'avatar_color': '#EC4899',
                'bio': 'Agile scrum lead orchestrating cross-functional sprint deliveries and product roadmaps.',
            },
            {
                'email': 'david.dev@stratum.io',
                'username': 'david_kim',
                'first_name': 'David',
                'last_name': 'Kim',
                'role': 'DEVELOPER',
                'title': 'Senior Backend Engineer',
                'avatar_color': '#10B981',
                'bio': 'Django & Python core developer optimizing query latencies, caching layers, and RESTful APIs.',
            },
            {
                'email': 'elena.frontend@stratum.io',
                'username': 'elena_rostova',
                'first_name': 'Elena',
                'last_name': 'Rostova',
                'role': 'DEVELOPER',
                'title': 'Senior Frontend Engineer',
                'avatar_color': '#F59E0B',
                'bio': 'React UI/UX specialist passionate about design systems, accessible components, and state caching.',
            },
            {
                'email': 'marcus.qa@stratum.io',
                'username': 'marcus_vance',
                'first_name': 'Marcus',
                'last_name': 'Vance',
                'role': 'VIEWER',
                'title': 'QA Lead & Client Reviewer',
                'avatar_color': '#8B5CF6',
                'bio': 'Observability reviewer and client representative conducting acceptance testing and audits.',
            },
        ]

        created_users = {}
        for udata in users_data:
            user, created = User.objects.get_or_create(
                email=udata['email'],
                defaults={
                    'username': udata['username'],
                    'first_name': udata['first_name'],
                    'last_name': udata['last_name'],
                    'role': udata['role'],
                    'title': udata['title'],
                    'avatar_color': udata['avatar_color'],
                    'bio': udata['bio'],
                }
            )
            user.set_password('Password123!')
            user.save()
            created_users[udata['email']] = user
            if created:
                self.stdout.write(f"  Created user: {user.email}")

        alex = created_users['alex.techlead@stratum.io']
        sarah = created_users['sarah.pm@stratum.io']
        david = created_users['david.dev@stratum.io']
        elena = created_users['elena.frontend@stratum.io']
        marcus = created_users['marcus.qa@stratum.io']

        # 2. Create Workspace
        workspace, _ = Workspace.objects.get_or_create(
            name='Apex Enterprise Systems',
            defaults={
                'description': 'Main engineering organization workspace for cloud infrastructure and SaaS products.',
                'owner': alex,
                'logo_color': '#6366F1'
            }
        )

        # Workspace Members
        ws_roles = [
            (alex, 'ADMIN'),
            (sarah, 'ADMIN'),
            (david, 'MEMBER'),
            (elena, 'MEMBER'),
            (marcus, 'VIEWER'),
        ]
        for u, r in ws_roles:
            WorkspaceMember.objects.get_or_create(workspace=workspace, user=u, defaults={'role': r})

        # 3. Create Projects
        p1, _ = Project.objects.get_or_create(
            workspace=workspace,
            key='STR',
            defaults={
                'name': 'Stratum Core Platform',
                'description': 'Distributed microservices backend, authentication token service, and real-time kanban state synchronization.',
                'status': 'ACTIVE',
                'owner': alex,
                'color': '#6366F1',
                'target_end_date': (timezone.now() + timedelta(days=45)).date()
            }
        )

        p2, _ = Project.objects.get_or_create(
            workspace=workspace,
            key='OPS',
            defaults={
                'name': 'DevOps & Observability Pipeline',
                'description': 'Container orchestration, Dockerized environments, CI/CD with GitHub Actions, and Prometheus metrics.',
                'status': 'ACTIVE',
                'owner': david,
                'color': '#10B981',
                'target_end_date': (timezone.now() + timedelta(days=20)).date()
            }
        )

        p3, _ = Project.objects.get_or_create(
            workspace=workspace,
            key='MOB',
            defaults={
                'name': 'Mobile Companion App',
                'description': 'Native mobile client for push notifications, quick status updates, and emergency triage.',
                'status': 'PLANNING',
                'owner': sarah,
                'color': '#F59E0B',
                'target_end_date': (timezone.now() + timedelta(days=90)).date()
            }
        )

        # Project Members
        for p in [p1, p2, p3]:
            ProjectMember.objects.get_or_create(project=p, user=alex, defaults={'role': 'MANAGER'})
            ProjectMember.objects.get_or_create(project=p, user=sarah, defaults={'role': 'MANAGER'})
            ProjectMember.objects.get_or_create(project=p, user=david, defaults={'role': 'CONTRIBUTOR'})
            ProjectMember.objects.get_or_create(project=p, user=elena, defaults={'role': 'CONTRIBUTOR'})
            ProjectMember.objects.get_or_create(project=p, user=marcus, defaults={'role': 'VIEWER'})

        # 4. Realistic Tasks for Project 1 (STR)
        today = timezone.now().date()
        tasks_data = [
            {
                'project': p1,
                'title': 'Design PostgreSQL partitioned index for task activity logs',
                'description': 'Optimize audit log table read latency under heavy concurrent writes by partitioning logs monthly.',
                'status': 'DONE',
                'priority': 'HIGH',
                'assignee': david,
                'reporter': alex,
                'order': 1000.0,
                'due_date': today - timedelta(days=5),
                'estimated_hours': 16.0,
                'actual_hours': 14.5,
                'tags': ['Database', 'PostgreSQL', 'Performance'],
                'subtasks': [
                    ('Analyze pg_stat_statements query execution plan', True),
                    ('Draft migration script with composite timestamp index', True),
                    ('Run load test benchmarking 10,000 writes/sec', True),
                ]
            },
            {
                'project': p1,
                'title': 'Implement JWT rotation and Redis token revocation list',
                'description': 'Ensure token refreshes issue new access/refresh pairs while invalidating superseded tokens upon logout.',
                'status': 'DONE',
                'priority': 'URGENT',
                'assignee': david,
                'reporter': alex,
                'order': 2000.0,
                'due_date': today - timedelta(days=2),
                'estimated_hours': 12.0,
                'actual_hours': 11.0,
                'tags': ['Security', 'JWT', 'Auth'],
                'subtasks': [
                    ('Configure SimpleJWT token rotation settings', True),
                    ('Add custom claims for user role and initials', True),
                    ('Write unit tests for invalid/expired tokens', True),
                ]
            },
            {
                'project': p1,
                'title': 'Build interactive Drag-and-Drop Kanban board columns',
                'description': 'Smooth drag-and-drop mechanics supporting cross-column status transitions with optimistic UI feedback.',
                'status': 'IN_PROGRESS',
                'priority': 'URGENT',
                'assignee': elena,
                'reporter': sarah,
                'order': 3000.0,
                'due_date': today + timedelta(days=2),
                'estimated_hours': 24.0,
                'actual_hours': 16.0,
                'tags': ['Frontend', 'Kanban', 'React'],
                'subtasks': [
                    ('Construct responsive column layout for Backlog, Todo, In Progress, In Review, Done', True),
                    ('Implement drag and drop handlers with reorder API integration', True),
                    ('Add keyboard accessible card movement shortcuts', False),
                    ('Handle network failure rollback smoothly', False),
                ]
            },
            {
                'project': p1,
                'title': 'Configure granular role-based permissions matrix',
                'description': 'Enforce that Viewers cannot edit/delete tasks, Contributors can edit assigned tasks, and Admins have full access.',
                'status': 'IN_REVIEW',
                'priority': 'HIGH',
                'assignee': david,
                'reporter': sarah,
                'order': 4000.0,
                'due_date': today + timedelta(days=1),
                'estimated_hours': 8.0,
                'actual_hours': 7.5,
                'tags': ['Backend', 'Security', 'Permissions'],
                'subtasks': [
                    ('Write IsTaskEditorOrReadOnly DRF permission class', True),
                    ('Add API tests verifying 403 Forbidden for unauthorized mutating verbs', True),
                    ('Verify UI buttons disable gracefully for Viewer persona', True),
                ]
            },
            {
                'project': p1,
                'title': 'Real-time in-app notification center and badge count',
                'description': 'Notify users upon task assignment, comment mention, or approaching deadline with mark-read capability.',
                'status': 'IN_PROGRESS',
                'priority': 'MEDIUM',
                'assignee': elena,
                'reporter': alex,
                'order': 5000.0,
                'due_date': today + timedelta(days=4),
                'estimated_hours': 14.0,
                'actual_hours': 8.0,
                'tags': ['Notifications', 'Frontend', 'UX'],
                'subtasks': [
                    ('Build Notification dropdown drawer with unread counter badge', True),
                    ('Implement mark individual as read and mark all read API hooks', True),
                    ('Add sound/toast micro-animation on incoming alerts', False),
                ]
            },
            {
                'project': p1,
                'title': 'Overdue deadline automated banner & SLA alert trigger',
                'description': 'Highlight tasks exceeding deadline with visual warning badges and high-priority escalation markers.',
                'status': 'TODO',
                'priority': 'HIGH',
                'assignee': david,
                'reporter': sarah,
                'order': 6000.0,
                'due_date': today - timedelta(days=1),  # Overdue for demo!
                'estimated_hours': 6.0,
                'actual_hours': 0.0,
                'tags': ['Deadlines', 'SLA', 'Backend'],
                'subtasks': [
                    ('Create is_overdue serializer computed field', True),
                    ('Render prominent amber/red countdown chips on card UI', False),
                ]
            },
            {
                'project': p1,
                'title': 'Integrate full-text search with multi-filter query bar',
                'description': 'Filter issues simultaneously across project, priority, assignee, status, and overdue flags.',
                'status': 'TODO',
                'priority': 'MEDIUM',
                'assignee': elena,
                'reporter': sarah,
                'order': 7000.0,
                'due_date': today + timedelta(days=7),
                'estimated_hours': 10.0,
                'actual_hours': 2.0,
                'tags': ['Search', 'Filters', 'UX'],
                'subtasks': [
                    ('Build debounced search input component', True),
                    ('Create filter pill chips with active count tag', False),
                ]
            },
            {
                'project': p1,
                'title': 'Design sprint burndown velocity and completion analytics',
                'description': 'Generate visual charts for total tasks completed, distribution by priority, and team member workload.',
                'status': 'BACKLOG',
                'priority': 'LOW',
                'assignee': None,
                'reporter': sarah,
                'order': 8000.0,
                'due_date': today + timedelta(days=14),
                'estimated_hours': 20.0,
                'actual_hours': 0.0,
                'tags': ['Analytics', 'Charts', 'Reporting'],
                'subtasks': [
                    ('Expose /api/projects/{id}/analytics/ endpoint', True),
                    ('Build SVG/CSS bar charts for workload and priority breakdown', False),
                ]
            },
            {
                'project': p1,
                'title': 'Export sprint issue report to CSV / JSON format',
                'description': 'Allow project managers to download task reports with deadlines, assignees, and time tracking data.',
                'status': 'BACKLOG',
                'priority': 'LOW',
                'assignee': None,
                'reporter': sarah,
                'order': 9000.0,
                'due_date': today + timedelta(days=21),
                'estimated_hours': 8.0,
                'actual_hours': 0.0,
                'tags': ['Export', 'Reports'],
                'subtasks': []
            },
        ]

        # 5. Realistic Tasks for Project 2 (OPS)
        ops_tasks = [
            {
                'project': p2,
                'title': 'Write production Dockerfile and multi-stage build caching',
                'description': 'Containerize Django DRF backend with Gunicorn and React with Nginx Alpine for minimal image size.',
                'status': 'DONE',
                'priority': 'URGENT',
                'assignee': david,
                'reporter': alex,
                'order': 1000.0,
                'due_date': today - timedelta(days=4),
                'estimated_hours': 8.0,
                'actual_hours': 7.0,
                'tags': ['Docker', 'DevOps', 'Containers'],
                'subtasks': [
                    ('Create backend Dockerfile with Python 3 slim', True),
                    ('Create frontend Dockerfile with node build + nginx', True),
                    ('Test docker compose up --build with healthchecks', True),
                ]
            },
            {
                'project': p2,
                'title': 'Configure GitHub Actions CI pipeline for tests & linting',
                'description': 'Automated workflow executing pytest suite, flake8 lint checks, and frontend build validations on pull request.',
                'status': 'DONE',
                'priority': 'HIGH',
                'assignee': alex,
                'reporter': sarah,
                'order': 2000.0,
                'due_date': today - timedelta(days=1),
                'estimated_hours': 6.0,
                'actual_hours': 5.5,
                'tags': ['CI/CD', 'GitHub Actions', 'Automation'],
                'subtasks': [
                    ('Set up .github/workflows/ci.yml workflow file', True),
                    ('Run backend tests with PostgreSQL service container', True),
                    ('Run React build & lint verification', True),
                ]
            },
            {
                'project': p2,
                'title': 'Setup OpenAPI Swagger UI & interactive schema explorer',
                'description': 'Self-documenting interactive REST API at /api/docs/ using drf-spectacular.',
                'status': 'DONE',
                'priority': 'MEDIUM',
                'assignee': david,
                'reporter': alex,
                'order': 3000.0,
                'due_date': today,
                'estimated_hours': 4.0,
                'actual_hours': 3.5,
                'tags': ['Documentation', 'Swagger', 'API'],
                'subtasks': [
                    ('Configure drf-spectacular schema view', True),
                    ('Annotate custom query parameters and response schemas', True),
                ]
            },
            {
                'project': p2,
                'title': 'Configure automated database backup cron to AWS S3',
                'description': 'Execute daily pg_dump backups with 30-day retention policies and encryption at rest.',
                'status': 'IN_PROGRESS',
                'priority': 'MEDIUM',
                'assignee': david,
                'reporter': alex,
                'order': 4000.0,
                'due_date': today + timedelta(days=5),
                'estimated_hours': 10.0,
                'actual_hours': 4.0,
                'tags': ['Backup', 'AWS', 'PostgreSQL'],
                'subtasks': [
                    ('Write pg_dump backup shell script', True),
                    ('Test backup restore drill on staging environment', False),
                ]
            }
        ]

        all_task_defs = tasks_data + ops_tasks

        for tdef in all_task_defs:
            subtasks_info = tdef.pop('subtasks', [])
            task, created = Task.objects.get_or_create(
                project=tdef['project'],
                title=tdef['title'],
                defaults=tdef
            )
            if created:
                for idx, (st_title, st_done) in enumerate(subtasks_info, start=1):
                    SubTask.objects.create(
                        task=task,
                        title=st_title,
                        is_completed=st_done,
                        order=idx
                    )

                # Add sample comments
                if task.status in ['IN_PROGRESS', 'IN_REVIEW', 'DONE']:
                    TaskComment.objects.create(
                        task=task,
                        author=sarah,
                        content=f"Sprint review notes: Requirement specs confirmed for {task.task_key}. Proceed with acceptance criteria checklist."
                    )
                    if task.assignee:
                        TaskComment.objects.create(
                            task=task,
                            author=task.assignee,
                            content=f"Working on this now. Verification tests passing locally. Ready for deployment testing."
                        )

                # Add activity logs
                ActivityLog.objects.create(
                    workspace=task.project.workspace,
                    project=task.project,
                    task=task,
                    actor=task.reporter or alex,
                    action_type=ActivityLog.ActionType.TASK_CREATED,
                    message=f"{task.reporter.full_name if task.reporter else 'Alex Rivera'} created {task.task_key}: {task.title}",
                    changes={'status': task.status, 'priority': task.priority}
                )

                if task.status != 'BACKLOG':
                    ActivityLog.objects.create(
                        workspace=task.project.workspace,
                        project=task.project,
                        task=task,
                        actor=sarah,
                        action_type=ActivityLog.ActionType.TASK_STATUS_CHANGED,
                        message=f"Sarah Chen transitioned {task.task_key} to {task.status}",
                        changes={'status': task.status}
                    )

                # Add sample notification
                if task.assignee:
                    Notification.objects.create(
                        recipient=task.assignee,
                        actor=sarah,
                        title=f"Sprint Assignment: {task.task_key}",
                        message=f"Sarah Chen assigned you to '{task.title}'",
                        notification_type=Notification.NotificationType.TASK_ASSIGNED,
                        related_task=task,
                        related_project=task.project,
                        is_read=(task.status == 'DONE')
                    )

        self.stdout.write(self.style.SUCCESS('Successfully seeded Stratum SaaS sample data!'))
