from django.contrib.auth.decorators import user_passes_test
from django.core.exceptions import PermissionDenied

def admin_required(view_func):

    def check(user):
        if not user.is_authenticated:
            return False

        if getattr(user, 'role', None) != 'admin':
            raise PermissionDenied

        return True

    return user_passes_test(
        check,
        login_url='login'
    )(view_func)