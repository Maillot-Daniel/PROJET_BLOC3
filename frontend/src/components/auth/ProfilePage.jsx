import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UsersService from '../services/UsersService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './ProfilePage.css';

function ProfilePage() {
  const { user, logout, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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
    console.log("👤 User dans ProfilePage:", user);
    
    // Si l'utilisateur n'a pas de données complètes, les charger
    if (user?.id && !user.name) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('🔄 Chargement du profil...');
      
      await refreshProfile();
      console.log('✅ Profil chargé avec succès');
      
    } catch (err) {
      console.error('❌ Erreur chargement profil:', err);
      setError(err.message || "Erreur lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsChangingPassword(true);
    try {
      await UsersService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage("✅ Mot de passe changé avec succès !");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      console.error('❌ Erreur changement mot de passe:', err);
      setError(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRetry = () => {
    setError('');
    loadProfile();
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement du profil..." />;
  }

  // Vérifier si l'utilisateur a des données à afficher
  const hasUserData = user && user.id;

  return (
    <div className="page-wrapper">
      <div className="profile-container">
        <div className="profile-header">
          <h2>Mon Profil</h2>
          <p>Bienvenue sur votre espace personnel</p>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
            <button onClick={handleRetry} className="btn-retry">
              Réessayer
            </button>
          </div>
        )}
        
        {message && <div className="success-message">✅ {message}</div>}

        {!hasUserData ? (
          <div className="no-profile">
            <p>⚠️ Aucun profil utilisateur trouvé</p>
            <button onClick={loadProfile} className="btn-primary">
              🔄 Charger le profil
            </button>
          </div>
        ) : (
          <div className="profile-content">
            {/* Informations de débogage */}
            <div className="debug-info">
              <strong>ID:</strong> {user.id} | 
              <strong> Données:</strong> {user.name ? 'COMPLÈTES' : 'INCOMPLÈTES'} |
              <strong> Rôle:</strong> {user.role || 'USER'}
            </div>

            <div className="profile-info">
              <h3>Informations personnelles</h3>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>ID :</label>
                  <span className="info-value">{user.id}</span>
                </div>
                <div className="info-item">
                  <label>Nom :</label>
                  <span className="info-value">{user.name || user.nom || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Email :</label>
                  <span className="info-value">{user.email || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Ville :</label>
                  <span className="info-value">{user.city || user.ville || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Rôle :</label>
                  <span className={`role-badge ${(user.role || 'user').toLowerCase()}`}>
                    {user.role || "USER"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section mot de passe */}
            <div className="password-section">
              <div className="section-header">
                <h4>Sécurité du compte</h4>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="btn-secondary"
                  disabled={isChangingPassword}
                >
                  {showPasswordForm ? "✖ Annuler" : "🔒 Changer le mot de passe"}
                </button>
              </div>

              {showPasswordForm && (
                <form className="password-form" onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label>Mot de passe actuel</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      required
                      disabled={isChangingPassword}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      required
                      disabled={isChangingPassword}
                      minLength={6}
                      placeholder="Au moins 6 caractères"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      disabled={isChangingPassword}
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? "🔄 Modification en cours..." : "✅ Changer le mot de passe"}
                    </button>
                    
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setError('');
                      }}
                      disabled={isChangingPassword}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Actions du profil */}
            <div className="profile-actions">
              <button onClick={loadProfile} className="btn-secondary">
                🔄 Actualiser le profil
              </button>
              <button onClick={logout} className="btn-logout">
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;