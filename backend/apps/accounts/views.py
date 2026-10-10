from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UpdateProfileSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        # Add custom claims
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['full_name'] = user.full_name
        refresh['initials'] = user.initials

        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Account created successfully.'
        }, status=status.HTTP_201_CREATED)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateProfileSerializer
        return UserSerializer


class UserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('first_name', 'last_name')
    filterset_fields = ['role']
    search_fields = ['first_name', 'last_name', 'email', 'title']


class DemoAccountsListView(APIView):
    """
    Public endpoint providing available demo accounts for instant evaluation.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        accounts = [
            {
                'role': 'ADMIN',
                'role_label': 'Workspace Administrator / Tech Lead',
                'name': 'Alex Rivera',
                'email': 'alex.techlead@stratum.io',
                'title': 'VP of Engineering',
                'description': 'Full administrative permissions: create projects, invite users, delete resources, manage billing.'
            },
            {
                'role': 'PROJECT_MANAGER',
                'role_label': 'Project Manager (Scrum Master)',
                'name': 'Sarah Chen',
                'email': 'sarah.pm@stratum.io',
                'title': 'Lead Technical PM',
                'description': 'Manage sprints, prioritize backlog, assign tasks, reorder kanban columns, update timelines.'
            },
            {
                'role': 'DEVELOPER',
                'role_label': 'Senior Software Engineer',
                'name': 'David Kim',
                'email': 'david.dev@stratum.io',
                'title': 'Senior Full-Stack Engineer',
                'description': 'Update assigned tasks, create subtasks, comment on issues, change task status to In Progress / In Review.'
            },
            {
                'role': 'VIEWER',
                'role_label': 'Client / Stakeholder (Read-Only)',
                'name': 'Marcus Vance',
                'email': 'marcus.qa@stratum.io',
                'title': 'Product Stakeholder & QA',
                'description': 'Read-only access across boards and analytics; restricted from mutating or deleting tasks.'
            }
        ]
        return Response({'demo_accounts': accounts, 'default_password': 'Password123!'})


class DemoLoginView(APIView):
    """
    1-Click demo login endpoint. Allows recruiters, hiring managers, and evaluators
    to immediately test role-based permissions without typing passwords.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        role_type = request.data.get('role', 'ADMIN').upper()
        email_map = {
            'ADMIN': 'alex.techlead@stratum.io',
            'PROJECT_MANAGER': 'sarah.pm@stratum.io',
            'PM': 'sarah.pm@stratum.io',
            'DEVELOPER': 'david.dev@stratum.io',
            'DEV': 'david.dev@stratum.io',
            'VIEWER': 'marcus.qa@stratum.io'
        }

        target_email = email_map.get(role_type, 'alex.techlead@stratum.io')
        user = User.objects.filter(email=target_email).first()

        if not user:
            # Fallback to first user or create on-the-fly if seed hasn't run yet
            user = User.objects.filter(role=role_type).first()
            if not user:
                user = User.objects.first()

        if not user:
            return Response(
                {'error': 'Demo data not initialized. Please run `python manage.py seed_demo_data`.'},
                status=status.HTTP_404_NOT_FOUND
            )

        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['full_name'] = user.full_name
        refresh['initials'] = user.initials

        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': f'Logged in as {user.full_name} ({user.get_role_display()})'
        })
