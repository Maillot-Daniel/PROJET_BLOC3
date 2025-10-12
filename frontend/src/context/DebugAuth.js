import { useAuth } from './AuthContext';

export default function DebugAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Ne rien afficher pendant le chargement
  }

  return (
    <div style={{
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0, 0, 0, 0.85)', 
      color: 'white', 
      padding: '8px 12px', 
      fontSize: '11px',
      borderRadius: '6px',
      border: '1px solid #333',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '200px',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      opacity: '0.9',
      transition: 'opacity 0.3s ease'
    }}
    onMouseEnter={e => e.target.style.opacity = '1'}
    onMouseLeave={e => e.target.style.opacity = '0.9'}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#00ff88' }}>
        🔐 AUTH DEBUG
      </div>
      <div>UserID: <span style={{ color: '#ffa500' }}>{user?.id || 'null'}</span></div>
      <div>Role: <span style={{ color: '#ffa500' }}>{user?.role || 'null'}</span></div>
      <div>Status: <span style={{ color: isAuthenticated ? '#00ff88' : '#ff4444' }}>
        {isAuthenticated ? '✅ Connecté' : '❌ Déconnecté'}
      </span></div>
    </div>
  );
}