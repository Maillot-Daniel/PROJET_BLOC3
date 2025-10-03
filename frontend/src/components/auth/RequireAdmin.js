import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RequireAdmin({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return isAuthenticated && user?.role === 'ADMIN'
    ? children
    : <Navigate to="/" />;
}
