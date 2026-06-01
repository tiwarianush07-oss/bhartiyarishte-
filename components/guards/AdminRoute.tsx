import React, { FC, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand"></div>
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's no user, or they aren't an admin (and not the specific admin email), kick them out to the homepage.
  const isAdminEmail = user?.email === 'bhartiyarishte03@gmail.com';
  if (!user || (!user.is_admin && !isAdminEmail)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
