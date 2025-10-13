import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
  const { user, logout, loadingProfile } = useAuth();

  console.log("User data from backend:", user);

  if (loadingProfile) {
    return <div className="page-wrapper">Chargement du profil...</div>;
  }

  if (!user) {
    return (
      <div className="page-wrapper">
        <div>Aucun profil disponible</div>
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
                <span className="info-value">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
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
