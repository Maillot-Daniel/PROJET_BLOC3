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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log("🔄 Chargement du profil...");
      const response = await UsersService.getProfile();
      console.log("✅ Réponse du backend:", response);

      if (response?.ourUsers) {
        setProfile(response.ourUsers);
        console.log("🎉 Profil défini:", response.ourUsers);
      } else {
        setError("Aucune donnée de profil trouvée");
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
      console.log("🔄 Envoi du changement de mot de passe...");
      await UsersService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setMessage('✅ Mot de passe modifié avec succès !');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);

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
          <p>Gérez vos informations personnelles</p>
        </div>

        {error && <div className="error-message">❌ {error}</div>}
        {message && <div className="success-message">✅ {message}</div>}

        {!profile ? (
          <div className="no-profile">
            <p>❌ Aucune donnée de profil disponible</p>
            <button onClick={loadProfile} className="btn-primary">🔄 Recharger</button>
          </div>
        ) : (
          <div className="profile-info">
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
                  <span>{profile.city || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Rôle :</label>
                  <span className={`role-badge ${(profile.role || 'user').toLowerCase()}`}>
                    {profile.role || "USER"}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="btn-secondary"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? "Annuler" : "Changer mon mot de passe"}
            </button>

            {showPasswordForm && (
              <form className="password-form" onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label>Mot de passe actuel :</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nouveau mot de passe :</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirmer le mot de passe :</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <button className="btn-primary" type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? "Enregistrement..." : "Changer le mot de passe"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
