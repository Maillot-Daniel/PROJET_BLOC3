import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import UsersService from "../services/UsersService";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import "./ProfilePage.css";

function ProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log("🔄 Chargement du profil...");
      const response = await UsersService.getProfile();
      console.log("✅ Réponse du backend:", response);

      // On récupère directement l'objet utilisateur
      const userData = response?.ourUsers;
      if (userData) {
        setProfile(userData);
        console.log("🎯 Profil utilisateur chargé:", userData);
      } else {
        console.warn("⚠️ Aucune donnée trouvée dans response.ourUsers");
        setError("Aucune donnée de profil trouvée");
      }
    } catch (err) {
      console.error("❌ Erreur lors du chargement du profil:", err);
      setError(err.message || "Erreur inconnue lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
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

        {error && <div className="error-message">❌ {error}</div>}
        {message && <div className="success-message">✅ {message}</div>}

        {!profile ? (
          <div className="no-profile">
            <p>⚠️ Aucun profil trouvé</p>
            <button onClick={loadProfile} className="btn-primary">
              🔄 Recharger le profil
            </button>
          </div>
        ) : (
          <div className="profile-info">
            {/* ✅ DEBUG – affiche les données reçues */}
            <div
              className="debug-box"
              style={{
                backgroundColor: "#fff3cd",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ffeeba",
                marginBottom: "15px",
              }}
            >
              <strong>🧩 Données reçues :</strong>
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            </div>

            <div className="info-section">
              <h3>Informations personnelles</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Nom complet :</label>
                  <span>{profile.name || "Non renseigné"}</span>
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
                  <span
                    className={`role-badge ${
                      (profile.role || "user").toLowerCase()
                    }`}
                  >
                    {profile.role || "USER"}
                  </span>
                </div>
                <div className="info-item">
                  <label>ID utilisateur :</label>
                  <span>{profile.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
