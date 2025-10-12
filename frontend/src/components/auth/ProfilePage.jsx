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
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    console.log("👤 User dans ProfilePage:", user);
    
    // NE PAS recharger automatiquement si on a déjà des données complètes
    if (user?.id && user?.name && user?.email) {
      console.log("✅ Données complètes déjà présentes, pas de rechargement");
      setHasLoaded(true);
      return;
    }
    
    // Charger seulement si nécessaire et pas déjà en cours
    if (user?.id && !hasLoaded && !isLoading) {
      console.log("🔄 Données incomplètes, chargement du profil...");
      loadProfile();
    }
  }, [user, hasLoaded, isLoading]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('🔄 Chargement du profil depuis ProfilePage...');
      
      await refreshProfile();
      setHasLoaded(true);
      console.log('✅ Profil rafraîchi depuis ProfilePage');
      
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

  if (isLoading) {
    return <LoadingSpinner message="Chargement du profil..." />;
  }

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
            <button onClick={loadProfile} className="btn-retry">
              Réessayer
            </button>
          </div>
        )}
        
        {message && <div className="success-message">✅ {message}</div>}

        {/* Debug Info détaillée */}
        <div className="debug-info" style={{background: '#e3f2fd', padding: '10px', borderRadius: '5px', marginBottom: '15px'}}>
          <h4>🔍 Debug Information:</h4>
          <p><strong>User ID:</strong> {user?.id || 'NULL'}</p>
          <p><strong>Nom:</strong> {user?.name ? `"${user.name}" ✅` : 'NULL ❌'}</p>
          <p><strong>Email:</strong> {user?.email ? `"${user.email}" ✅` : 'NULL ❌'}</p>
          <p><strong>Ville:</strong> {user?.city || 'NULL'}</p>
          <p><strong>Rôle:</strong> {user?.role || 'NULL'}</p>
          <p><strong>Has Loaded:</strong> {hasLoaded ? 'OUI' : 'NON'}</p>
        </div>

        {!user?.id ? (
          <div className="no-profile">
            <p>⚠️ Aucun utilisateur connecté</p>
            <button onClick={loadProfile} className="btn-primary">
              🔄 Charger le profil
            </button>
          </div>
        ) : !user.name ? (
          <div className="no-profile">
            <p>⚠️ Données de profil incomplètes</p>
            <p>ID: {user.id} présent mais nom/email manquants</p>
            <button onClick={loadProfile} className="btn-primary">
              🔄 Charger les données complètes
            </button>
          </div>
        ) : (
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
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
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
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "🔄 Modification..." : "✅ Changer le mot de passe"}
                  </button>
                </form>
              )}
            </div>

            <div className="profile-actions">
              <button onClick={loadProfile} className="btn-secondary">
                🔄 Actualiser
              </button>
              <button onClick={logout} className="btn-logout">
                🚪 Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;