import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
  const { user, logout, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  console.log("✅✅✅ NEW PROFILE PAGE WORKING ✅✅✅");
  console.log("User data:", user);

  useEffect(() => {
    if (user?.id && !user.name) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      await refreshProfile();
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="profile-container">
          <div className="loading">Chargement du profil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Mon Profil</h1>
          <p>Bienvenue sur votre espace personnel</p>
        </div>

        {user?.name ? (
          <div className="profile-content">
            {/* Bannière succès */}
            <div className="success-banner">
              <h2>✅ Profil chargé avec succès</h2>
            </div>

            {/* Informations */}
            <div className="profile-info">
              <h3>Informations personnelles</h3>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>Nom :</label>
                  <span className="info-value">{user.name}</span>
                </div>
                <div className="info-item">
                  <label>Email :</label>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-item">
                  <label>Ville :</label>
                  <span className="info-value">{user.city || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Rôle :</label>
                  <span className="role-badge">{user.role}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="profile-actions">
              <button onClick={loadProfile} className="btn-secondary">
                🔄 Actualiser
              </button>
              <button onClick={logout} className="btn-logout">
                🚪 Déconnexion
              </button>
            </div>
          </div>
        ) : (
          <div className="no-profile">
            <p>Chargement des données...</p>
            <button onClick={loadProfile} className="btn-primary">
              Charger le profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;