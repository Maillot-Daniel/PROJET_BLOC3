import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UsersService from '../services/UsersService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './ProfilePage.css';

function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // États pour la modification du mot de passe
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
      const response = await UsersService.getProfile();
      console.log("Profil chargé:", response);
      setProfile(response.ourUsers);
    } catch (err) {
      setError('Erreur lors du chargement du profil: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setError('');
    setMessage('');

    // Validations
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
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      
      // Déconnexion automatique après changement de mot de passe
      setTimeout(() => {
        setMessage('Déconnexion dans 3 secondes...');
        setTimeout(() => {
          logout();
        }, 3000);
      }, 2000);

    } catch (err) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) return <LoadingSpinner message="Chargement du profil..." />;

  return (
    <div className="page-wrapper">
      <div className="profile-container">
        <div className="profile-header">
          <h2>Mon Profil</h2>
          <p>Gérez vos informations personnelles</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {profile && (
          <div className="profile-info">
            <div className="info-section">
              <h3>Informations personnelles</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Nom :</label>
                  <span>{profile.name}</span>
                </div>
                <div className="info-item">
                  <label>Email :</label>
                  <span>{profile.email}</span>
                </div>
                <div className="info-item">
                  <label>Ville :</label>
                  <span>{profile.city}</span>
                </div>
                <div className="info-item">
                  <label>Rôle :</label>
                  <span className={`role-badge ${profile.role?.toLowerCase()}`}>
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="actions-section">
              <h3>Sécurité</h3>
              
              {!showPasswordForm ? (
                <div className="action-buttons">
                  <button 
                    className="btn-primary"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    🔒 Changer le mot de passe
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={handleLogout}
                  >
                    🚪 Se déconnecter
                  </button>
                </div>
              ) : (
                <div className="password-form">
                  <h4>Modifier le mot de passe</h4>
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label>Mot de passe actuel</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value
                        })}
                        placeholder="Entrez votre mot de passe actuel"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value
                        })}
                        placeholder="Minimum 6 caractères"
                        minLength={6}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirmer le nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value
                        })}
                        placeholder="Retapez le nouveau mot de passe"
                        minLength={6}
                        required
                      />
                    </div>

                    <div className="form-buttons">
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Modification...' : '✅ Modifier le mot de passe'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowPasswordForm(false)}
                        disabled={isChangingPassword}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;