import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GuestOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return isAuthenticated ? <Navigate to="/" /> : children;
}
