import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UsersService from '../services/UsersService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './ProfilePage.css';

function ProfilePage() {
  const { user, logout, refreshProfile } = useAuth(); // Utiliser refreshProfile du contexte
  const [localProfile, setLocalProfile] = useState(null);
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
    console.log("👤 User from AuthContext:", user);
    
    // Si l'utilisateur a des données complètes dans le contexte, les utiliser
    if (user && user.id && (user.name || user.email)) {
      console.log("✅ Utilisation des données du contexte Auth");
      setLocalProfile(user);
    } else {
      // Sinon, charger depuis l'API
      loadProfileFromAPI();
    }
  }, [user]);

  const loadProfileFromAPI = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('🔄 Chargement du profil depuis API...');
      
      const response = await UsersService.getProfile();
      console.log('📨 Réponse API complète:', response);
      
      let userData = null;
      
      if (response?.ourUsers) {
        userData = response.ourUsers;
        console.log('✅ Données trouvées dans response.ourUsers');
      } else if (response?.data?.ourUsers) {
        userData = response.data.ourUsers;
        console.log('✅ Données trouvées dans response.data.ourUsers');
      } else if (response && typeof response === 'object' && response.id) {
        userData = response;
        console.log('✅ Données trouvées directement dans response');
      }
      
      if (userData) {
        console.log('👤 Données utilisateur API:', userData);
        setLocalProfile(userData);
      } else {
        console.error('❌ Aucune donnée utilisateur trouvée dans la réponse API');
        setError("Aucune donnée de profil trouvée");
      }
    } catch (err) {
      console.error('❌ Erreur API:', err);
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

    setIsChangingPassword(true);
    try {
      await UsersService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage("Mot de passe changé avec succès !");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
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

  // Utiliser les données du contexte ou celles chargées localement
  const displayProfile = localProfile || user;

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
            <button onClick={loadProfileFromAPI} className="btn-retry">
              Réessayer
            </button>
          </div>
        )}
        
        {message && <div className="success-message">✅ {message}</div>}

        {!displayProfile ? (
          <div className="no-profile">
            <p>⚠️ Aucun profil trouvé</p>
            <button onClick={loadProfileFromAPI} className="btn-primary">
              🔄 Recharger le profil
            </button>
          </div>
        ) : (
          <div className="profile-content">
            {/* Debug info */}
            <div className="debug-info">
              <strong>Source:</strong> {localProfile ? 'API' : 'Contexte'} | 
              <strong> ID:</strong> {displayProfile.id} |
              <strong> Données:</strong> {displayProfile.name ? 'COMPLÈTES' : 'INCOMPLÈTES'}
            </div>

            <div className="profile-info">
              <h3>Informations personnelles</h3>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>ID :</label>
                  <span>{displayProfile.id || "Non disponible"}</span>
                </div>
                <div className="info-item">
                  <label>Nom :</label>
                  <span>{displayProfile.name || displayProfile.nom || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Email :</label>
                  <span>{displayProfile.email || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Ville :</label>
                  <span>{displayProfile.city || displayProfile.ville || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Rôle :</label>
                  <span className={`role-badge ${(displayProfile.role || 'user').toLowerCase()}`}>
                    {displayProfile.role || "USER"}
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

            {/* Actions */}
            <div className="profile-actions">
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