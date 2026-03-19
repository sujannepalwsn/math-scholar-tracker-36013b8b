import React from "react";
import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'center' | 'parent' | 'teacher';
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    let loginPath = '/login';
    if (role === 'admin') loginPath = '/login-admin';
    if (role === 'parent') loginPath = '/login-parent';
    return <Navigate to={loginPath} replace />;
  }

  if (role && user.role !== role) {
    // Special case: teachers can access center (admin) routes if they have the right permissions
    if (role === 'center' && user.role === 'teacher') {
      return <>{children}</>;
    }

    let dashboardPath = '/';
    if (user.role === 'admin') dashboardPath = '/admin-dashboard';
    if (user.role === 'parent') dashboardPath = '/parent-dashboard';
    if (user.role === 'teacher') dashboardPath = '/teacher-dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
