from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@stratum.io',
            username='testuser',
            password='TestPassword123!',
            first_name='Test',
            last_name='User',
            role='DEVELOPER'
        )

    def test_user_login_success(self):
        url = reverse('token_obtain_pair')
        data = {
            'email': 'testuser@stratum.io',
            'password': 'TestPassword123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'testuser@stratum.io')

    def test_user_login_invalid_credentials(self):
        url = reverse('token_obtain_pair')
        data = {
            'email': 'testuser@stratum.io',
            'password': 'WrongPassword!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_registration(self):
        url = reverse('auth_register')
        data = {
            'email': 'newdev@stratum.io',
            'username': 'newdev',
            'first_name': 'New',
            'last_name': 'Developer',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'role': 'DEVELOPER'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['email'], 'newdev@stratum.io')

    def test_demo_accounts_list(self):
        url = reverse('demo_accounts')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['demo_accounts']) >= 4)
