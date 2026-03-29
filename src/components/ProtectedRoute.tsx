import React from "react";
import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { UserRole, RoleString } from "@/types/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: RoleString;
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
    // SECURITY: Removed the teacher bypass to ensure strict role-based frontend routing.
    // Teachers requiring admin-level features should be managed via granular permissions within their own layout.

    let dashboardPath = '/';
    if (user.role === UserRole.ADMIN) dashboardPath = '/admin-dashboard';
    if (user.role === UserRole.PARENT) dashboardPath = '/parent-dashboard';
    if (user.role === UserRole.TEACHER) dashboardPath = '/teacher-dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
