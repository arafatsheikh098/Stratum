from rest_framework import permissions

class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Allows full access to workspace/project admins, read-only to others.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ['ADMIN', 'PROJECT_MANAGER'] or request.user.is_staff

class IsWorkspaceAdmin(permissions.BasePermission):
    """
    Strictly workspace admin or superuser.
    """
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and (request.user.role == 'ADMIN' or request.user.is_staff)
        )

class IsTaskEditorOrReadOnly(permissions.BasePermission):
    """
    Allows viewing for any authenticated member.
    Allows editing if user is Admin, PM, the task assignee, or the reporter.
    Viewers cannot edit or delete.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Viewers have no mutation rights
        if request.user.role == 'VIEWER':
            return False

        # Admin or Project Manager can edit/delete anything
        if request.user.role in ['ADMIN', 'PROJECT_MANAGER'] or request.user.is_staff:
            return True

        # Assignee or reporter can edit
        return obj.assignee_id == request.user.id or obj.reporter_id == request.user.id
