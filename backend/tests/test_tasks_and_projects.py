from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task, SubTask, TaskComment

User = get_user_model()

class TasksAndProjectsAPITests(APITestCase):
    def setUp(self):
        # Admin user
        self.admin_user = User.objects.create_user(
            email='admin@stratum.io',
            username='admin_user',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role='ADMIN'
        )
        # Developer user
        self.dev_user = User.objects.create_user(
            email='developer@stratum.io',
            username='developer_user',
            password='Password123!',
            first_name='Dev',
            last_name='User',
            role='DEVELOPER'
        )
        # Viewer user
        self.viewer_user = User.objects.create_user(
            email='viewer@stratum.io',
            username='viewer_user',
            password='Password123!',
            first_name='Viewer',
            last_name='User',
            role='VIEWER'
        )

        # Workspace
        self.workspace = Workspace.objects.create(
            name='Test Workspace',
            owner=self.admin_user
        )
        WorkspaceMember.objects.create(workspace=self.workspace, user=self.admin_user, role='ADMIN')
        WorkspaceMember.objects.create(workspace=self.workspace, user=self.dev_user, role='MEMBER')
        WorkspaceMember.objects.create(workspace=self.workspace, user=self.viewer_user, role='VIEWER')

        # Project
        self.project = Project.objects.create(
            workspace=self.workspace,
            name='Project Titan',
            key='TTN',
            owner=self.admin_user
        )
        ProjectMember.objects.create(project=self.project, user=self.admin_user, role='MANAGER')
        ProjectMember.objects.create(project=self.project, user=self.dev_user, role='CONTRIBUTOR')
        ProjectMember.objects.create(project=self.project, user=self.viewer_user, role='VIEWER')

        # Sample Task
        self.task = Task.objects.create(
            project=self.project,
            title='Implement API endpoint',
            description='Detailed task specifications',
            status='TODO',
            priority='HIGH',
            assignee=self.dev_user,
            reporter=self.admin_user,
            order=1000.0
        )

    def test_list_projects(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['key'], 'TTN')

    def test_create_task_auto_increments_key(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'project': self.project.id,
            'title': 'Second Task in TTN',
            'status': 'BACKLOG',
            'priority': 'MEDIUM'
        }
        response = self.client.post('/api/tasks/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['task_key'], 'TTN-2')

    def test_kanban_reorder(self):
        self.client.force_authenticate(user=self.dev_user)
        url = f'/api/tasks/{self.task.id}/reorder/'
        data = {'status': 'IN_PROGRESS', 'order': 2500.0}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'IN_PROGRESS')
        self.assertEqual(self.task.order, 2500.0)

    def test_subtask_create_and_toggle(self):
        self.client.force_authenticate(user=self.dev_user)
        # Create subtask
        url = f'/api/tasks/{self.task.id}/subtasks/'
        response = self.client.post(url, {'title': 'Check unit tests'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        subtask_id = response.data['id']
        self.assertFalse(response.data['is_completed'])

        # Toggle subtask
        toggle_url = f'/api/tasks/{self.task.id}/subtasks/{subtask_id}/'
        patch_response = self.client.patch(toggle_url, {'is_completed': True}, format='json')
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertTrue(patch_response.data['is_completed'])

    def test_viewer_permission_denied_on_delete(self):
        self.client.force_authenticate(user=self.viewer_user)
        url = f'/api/tasks/{self.task.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_tasks_by_status(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/tasks/?status=TODO')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

        empty_response = self.client.get('/api/tasks/?status=DONE')
        self.assertEqual(empty_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(empty_response.data['results']), 0)

    def test_contributor_can_comment_on_task(self):
        # Dev user comments on a task where reporter is admin
        self.client.force_authenticate(user=self.dev_user)
        url = f'/api/tasks/{self.task.id}/comments/'
        response = self.client.post(url, {'content': 'Working on this endpoint right now.'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Working on this endpoint right now.')
        self.assertEqual(response.data['author']['email'], self.dev_user.email)

    def test_unassign_task_logs_activity(self):
        from apps.activity.models import ActivityLog
        self.client.force_authenticate(user=self.admin_user)
        url = f'/api/tasks/{self.task.id}/'
        response = self.client.patch(url, {'assignee_id': None}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['assignee'])

        log = ActivityLog.objects.filter(task=self.task, action_type=ActivityLog.ActionType.TASK_ASSIGNED).last()
        self.assertIsNotNone(log)
        self.assertIn('unassigned', log.message)
