import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, Role } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // In a real app, you might want a loading state while fetching the user
  // For now, we assume if we have a user, they are authenticated.
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is not allowed, redirect to a default page or dashboard
  if (allowedRoles && user) {
    const userRole = user.role.toUpperCase();
    const upperAllowedRoles = allowedRoles?.map(r => r.toUpperCase());
    
    if (!upperAllowedRoles?.includes(userRole)) {
      // Redirect to their own dashboard based on role
      const defaultPath = {
        STUDENT: '/dashboard',
        PARENT: '/parent',
        COUNSELOR: '/counselor',
        ADMIN: '/admin/settings',
      }[userRole as Role] || '/login';
      
      return <Navigate to={defaultPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
