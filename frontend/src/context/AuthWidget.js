import React, { useState } from "react";
import { useAuth } from "./AuthContext";

export default function AuthWidget() {
  const { user, logout } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{
      marginTop: '15px',
      width: '45%',
      maxWidth: '200px',
      background: 'rgba(0,0,0,0.50)',
      color: 'white',
      padding: '8px',
      borderRadius: '10px',
      fontFamily: 'monospace',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      alignSelf: 'center',
      position: 'relative'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
        👋 {user.name.split(" ")[0]}
      </div>

      <div style={{ fontSize: '11px', color: '#ccc' }}>
        Rôle : {user.role}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <span style={{ fontSize: '11px', color: '#0f0' }}>
          ✅ Connecté
        </span>
        
        {/* Bouton déconnexion avec tooltip */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleLogout}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🚪
          </button>
          
          {showTooltip && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              marginTop: '5px',
              zIndex: 1000
            }}>
              Se déconnecter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}