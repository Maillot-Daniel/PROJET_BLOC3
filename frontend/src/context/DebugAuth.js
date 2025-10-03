
import { useAuth } from './AuthContext';

export default function DebugAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }
/*
  console.log('DEBUG AUTH - User:', user);
  console.log('DEBUG AUTH - isAuthenticated:', isAuthenticated);
  console.log('DEBUG AUTH - Token:', localStorage.getItem('olympics_auth_token'));*/

  return (
    <div>
      User: {JSON.stringify(user)}<br />
      Authenticated: {isAuthenticated ? 'Oui' : 'Non'}
    </div>
  );
}
