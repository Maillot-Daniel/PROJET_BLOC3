import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UsersService from "../services/UsersService"; // ajuste le chemin si nécessaire

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Vérifie si l'utilisateur est connecté
        if (!UsersService.isAuthenticated()) {
          alert("Veuillez vous connecter pour accéder à votre profil");
          navigate("/login");
          return;
        }

        const data = await UsersService.getProfile(); // Méthode correcte
        setProfile(data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div>Chargement du profil...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="profile-page">
      <h1>Mon Profil</h1>
      {profile ? (
        <div className="profile-details">
          <p><strong>Nom :</strong> {profile.firstName} {profile.lastName}</p>
          <p><strong>Email :</strong> {profile.email}</p>
          <p><strong>Rôle :</strong> {profile.role}</p>
          {/* Ajoute ici d'autres champs si nécessaire */}
        </div>
      ) : (
        <p>Aucun profil disponible.</p>
      )}
    </div>
  );
};

export default ProfilePage;
