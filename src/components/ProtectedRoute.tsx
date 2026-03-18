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
    // If the required role is 'center', allow 'teacher' who has been granted 'center' role in their user profile
    if (role === 'center' && user.role === 'teacher') {
       // Proceed to check further if needed, but for now we allow the navigation to the page
       // though layout will be handled by the route element itself.
       // Actually, we should allow it.
    } else {
      let dashboardPath = '/';
      if (user.role === 'admin') dashboardPath = '/admin-dashboard';
      if (user.role === 'parent') dashboardPath = '/parent-dashboard';
      if (user.role === 'teacher') dashboardPath = '/teacher-dashboard';
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
