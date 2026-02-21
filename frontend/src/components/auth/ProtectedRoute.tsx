import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermissions?: string[];
}

export function ProtectedRoute({ children, requiredPermissions = [] }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check permissions if required
    if (requiredPermissions.length > 0 && user) {
        // User permissions are stored directly on user object
        const userPermissions = user.permissions || [];
        const hasPermission = requiredPermissions.some((perm) =>
            userPermissions.includes(perm)
        );

        if (!hasPermission) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <>{children}</>;
}

export default ProtectedRoute;
