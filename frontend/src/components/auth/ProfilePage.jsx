import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UsersService from '../services/UsersService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './ProfilePage.css';

function ProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log("🔄 Chargement du profil...");
      const response = await UsersService.getProfile();
      console.log("✅ Réponse backend:", response);

      if (response?.ourUsers) {
        setProfile(response.ourUsers);
        console.log("🎯 Profil utilisateur chargé:", response.ourUsers);
      } else {
        setError("⚠️ Aucune donnée de profil trouvée");
      }
    } catch (err) {
      console.error("❌ Erreur lors du chargement du profil:", err);
      setError(err.message || "Erreur inconnue lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      setIsChangingPassword(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsChangingPassword(false);
      return;
    }

    try {
      await UsersService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setMessage('✅ Mot de passe modifié avec succès !');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);

      // Déconnexion automatique
      setTimeout(() => {
        setMessage('Déconnexion dans 3 secondes...');
        setTimeout(() => logout(), 3000);
      }, 2000);
    } catch (err) {
      console.error("❌ Erreur changement mot de passe:", err);
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Chargement du profil..." />;

  return (
    <div className="page-wrapper">
      <div className="profile-container">
        <div className="profile-header">
          <h2>Mon Profil</h2>
          <p>Bienvenue sur votre espace personnel</p>
        </div>

        {error && <div className="error-message">❌ {error}</div>}
        {message && <div className="success-message">✅ {message}</div>}

        {!profile ? (
          <div className="no-profile">
            <p>⚠️ Aucun profil trouvé</p>
            <button onClick={loadProfile} className="btn-primary">🔄 Recharger le profil</button>
          </div>
        ) : (
          <>
            <div className="profile-info">
              {showDebug && (
                <div className="debug-box">
                  <strong>🧩 Données reçues :</strong>
                  <pre>{JSON.stringify(profile, null, 2)}</pre>
                  <button className="btn-secondary" onClick={() => setShowDebug(false)}>🔒 Cacher debug</button>
                </div>
              )}
              {!showDebug && (
                <button className="btn-secondary" onClick={() => setShowDebug(true)}>🛠️ Afficher debug</button>
              )}

              <div className="info-section">
                <h3>Informations personnelles</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nom :</label>
                    <span>{profile.name || profile.nom || "Non renseigné"}</span>
                  </div>
                  <div className="info-item">
                    <label>Email :</label>
                    <span>{profile.email || "Non renseigné"}</span>
                  </div>
                  <div className="info-item">
                    <label>Ville :</label>
                    <span>{profile.city || profile.ville || "Non renseigné"}</span>
                  </div>
                  <div className="info-item">
                    <label>Rôle :</label>
                    <span className={`role-badge ${(profile.role || 'user').toLowerCase()}`}>
                      {profile.role || "USER"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="actions-section">
                <h3>Sécurité</h3>

                {!showPasswordForm ? (
                  <div className="action-buttons">
                    <button className="btn-primary" onClick={() => setShowPasswordForm(true)}>
                      🔒 Changer le mot de passe
                    </button>
                    <button className="btn-secondary" onClick={logout}>
                      🚪 Se déconnecter
                    </button>
                  </div>
                ) : (
                  <form className="password-form" onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label>Mot de passe actuel</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirmer le nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="form-buttons">
                      <button type="submit" className="btn-primary" disabled={isChangingPassword}>
                        {isChangingPassword ? '⏳ Modification...' : '✅ Modifier le mot de passe'}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setShowPasswordForm(false)} disabled={isChangingPassword}>
                        ❌ Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
