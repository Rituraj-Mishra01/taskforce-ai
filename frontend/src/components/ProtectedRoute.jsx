import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-t-neonBlue border-r-transparent border-b-neonPurple border-l-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm animate-pulse font-medium">Syncing TaskForce session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
