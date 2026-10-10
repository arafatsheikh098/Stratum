from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    CurrentUserView,
    UserListView,
    DemoAccountsListView,
    DemoLoginView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('demo-accounts/', DemoAccountsListView.as_view(), name='demo_accounts'),
    path('demo-login/', DemoLoginView.as_view(), name='demo_login'),
]
