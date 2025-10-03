import { useState, useEffect, useCallback } from "react";
import UsersService from "../services/UsersService";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

function ProfilePage() {
  const [profileInfo, setProfileInfo] = useState({
    name: '',
    email: '',
    city: '',
    role: '',
    id: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfileInfo = useCallback(async () => {
    try {
      // Pas besoin de récupérer explicitement le token ici,
      // UsersService utilise axios interceptors qui gèrent ça
      const response = await UsersService.getYourProfile();

      // Récupération des données utilisateur, sécurisée avec fallback
      const userData = response.ourUsers || {};

      setProfileInfo(userData);

      // Toujours synchroniser le userId dans localStorage
      if (userData.id) {
        localStorage.setItem('userId', userData.id.toString());
      }
    } catch (error) {
      console.error('Profile fetch error:', error);

      // En cas d'erreur (token invalide, user pas connecté, etc), nettoyage et redirection
      UsersService.clearAuth();
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfileInfo();
  }, [fetchProfileInfo]);

  // Vérifie si l'utilisateur connecté est le propriétaire du profil
  const canEditProfile = () => {
    const currentUserId = localStorage.getItem('userId');
    // Compare en string, sécurise avec optional chaining
    return currentUserId && currentUserId === profileInfo.id?.toString();
  };

  const handleEditClick = () => {
    navigate(`/update-user/${profileInfo.id}`);
  };

  if (isLoading) {
    return <div className="loading-message">Chargement du profil...</div>;
  }

  return (
    <div className="profile-page-container">
      <div className="welcome-banner">
        <h2>Bienvenue, {profileInfo.name || 'cher utilisateur'} !</h2>
        <div className="connection-status">
          <span className="status-dot connected"></span>
          <span>Vous êtes connecté en tant que {profileInfo.role?.toUpperCase() || 'utilisateur'}</span>
        </div>
      </div>

      <div className="profile-section">
        <h3>Vos informations personnelles</h3>
        <div className="profile-details">
          <p><strong>Email :</strong> {profileInfo.email || 'Non renseigné'}</p>
          <p><strong>Ville :</strong> {profileInfo.city || 'Non renseignée'}</p>
        </div>
      </div>

      {(canEditProfile() || profileInfo.role?.toUpperCase() === "ADMIN") && (
        <div className="edit-section">
          <p className="edit-info">
            {canEditProfile()
              ? "Vous pouvez modifier vos informations personnelles ci-dessous :"
              : "En tant qu'administrateur, vous pouvez modifier ce profil :"}
          </p>
          <button
            className="update-profile-btn"
            onClick={handleEditClick}
          >
            {profileInfo.role?.toUpperCase() === "ADMIN"
              ? "Modifier ce profil"
              : "Modifier mon profil"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
