import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RequireUser({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return isAuthenticated ? children : <Navigate to="/login" />;
}
