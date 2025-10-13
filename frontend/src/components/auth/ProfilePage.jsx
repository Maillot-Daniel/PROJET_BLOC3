import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
  const { user, logout, refreshProfile, loadingProfile } = useAuth();

  if (loadingProfile) {
    return (
      <div className="page-wrapper">
        <div className="profile-container">
          <div className="loading">Chargement du profil...</div>
        </div>
      </div>
    );
  }

  if (!user || !user.id) {
    return (
      <div className="page-wrapper">
        <div className="profile-container">
          <div className="no-profile">
            <p>Aucun profil disponible. Veuillez vous reconnecter.</p>
          </div>
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

        <div className="profile-content">
          <div className="success-banner">
            <h2>✅ Profil chargé avec succès</h2>
          </div>

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

          <div className="profile-actions">
            <button onClick={refreshProfile} className="btn-secondary">
              🔄 Actualiser
            </button>
            <button onClick={logout} className="btn-logout">
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
