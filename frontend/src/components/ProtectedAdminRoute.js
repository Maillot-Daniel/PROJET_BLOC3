import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('olympics_auth_token');
  const user = JSON.parse(localStorage.getItem('olympics_user') || '{}');
  
  if (!token || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedAdminRoute;