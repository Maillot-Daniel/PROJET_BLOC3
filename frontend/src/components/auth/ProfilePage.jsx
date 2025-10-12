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
      console.log("🔄 Chargement du profil...");
      const response = await UsersService.getProfile();
      console.log("✅ RÉPONSE COMPLÈTE PROFIL:", response);
      console.log("📊 DONNÉES UTILISATEUR:", response.ourUsers);
      console.log("🔍 STRUCTURE ourUsers:", JSON.stringify(response.ourUsers, null, 2));
      
      if (response.ourUsers) {
        setProfile(response.ourUsers);
        console.log("🎉 Profil défini avec succès");
        console.log("📝 Champs disponibles:", Object.keys(response.ourUsers));
      } else {
        console.warn("⚠️ Aucune donnée ourUsers dans la réponse");
        setError('Aucune donnée utilisateur trouvée');
      }
    } catch (err) {
      console.error("❌ ERREUR DÉTAILLÉE:", err);
      setError('Erreur lors du chargement du profil: ' + (err.message || 'Erreur inconnue'));
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
      console.log("🔄 Changement de mot de passe...");
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
      console.error("❌ Erreur changement mot de passe:", err);
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    console.log("🚪 Déconnexion...");
    logout();
  };

  if (isLoading) {
    console.log("⏳ Affichage du loading...");
    return <LoadingSpinner message="Chargement du profil..." />;
  }

  console.log("🎨 Rendu du profil:", { 
    profile, 
    hasProfile: !!profile,
    profileKeys: profile ? Object.keys(profile) : [] 
  });

  return (
    <div className="page-wrapper">
      <div className="profile-container">
        <div className="profile-header">
          <h2>Mon Profil</h2>
          <p>Gérez vos informations personnelles</p>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        {message && (
          <div className="success-message">
            ✅ {message}
          </div>
        )}

        {/* AFFICHAGE CONDITIONNEL - VERSION DEBUG */}
        {!profile ? (
          <div className="no-profile">
            <p>❌ Aucune donnée de profil disponible</p>
            <button 
              onClick={loadProfile}
              className="btn-primary"
            >
              🔄 Recharger le profil
            </button>
          </div>
        ) : (
          <div className="profile-info">
            {/* SECTION DEBUG - À SUPPRIMER APRÈS */}
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '12px'
            }}>
              <strong>🔧 DEBUG - Données reçues:</strong>
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            </div>

            <div className="info-section">
              <h3>Informations personnelles</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Nom :</label>
                  <span>{profile.name || profile.nom || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <label>Email :</label>
                  <span>{profile.email || profile.mail || "Non renseigné"}</span>
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
                        {isChangingPassword ? '⏳ Modification...' : '✅ Modifier le mot de passe'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowPasswordForm(false)}
                        disabled={isChangingPassword}
                      >
                        ❌ Annuler
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