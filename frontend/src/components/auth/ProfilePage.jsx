import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
  const { user, refreshProfile, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const data = await refreshProfile();
        setProfileData(data); // stocke tout le backend
      } catch (error) {
        console.error('Erreur chargement profil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [refreshProfile]);

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="profile-container">
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="page-wrapper">
        <div className="profile-container">
          <p>Aucune donnée disponible.</p>
          <button onClick={refreshProfile}>Rafraîchir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="profile-container">
        <h1>Mon Profil</h1>
        <p>Voici toutes les données reçues du backend :</p>

        <pre
          style={{
            background: '#222',
            color: '#0f0',
            padding: '12px',
            borderRadius: '8px',
            overflowX: 'auto',
            fontSize: '12px',
          }}
        >
          {JSON.stringify(profileData, null, 2)}
        </pre>

        <div style={{ marginTop: '16px' }}>
          <button onClick={refreshProfile} className="btn-secondary">
            🔄 Actualiser
          </button>
          <button onClick={logout} className="btn-logout">
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
