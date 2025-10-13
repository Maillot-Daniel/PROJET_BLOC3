import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import UsersService from "../services/UsersService";
import "./ProfilePage.css";

function ProfilePage() {
  const { user, logout, loadUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user?.id && !user?.name) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      await loadUserProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Tous les champs sont obligatoires");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Le nouveau mot de passe et la confirmation ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      await UsersService.changePassword({
        oldPassword,
        newPassword
      });
      setMessage("✅ Mot de passe changé avec succès !");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Erreur lors du changement de mot de passe");
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="profile-container">
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="page-wrapper">
        <div className="profile-container">
          <p>Aucun profil disponible. Veuillez vous connecter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="profile-container">
        <h1>Mon Profil</h1>
        <div className="profile-info">
          <p><strong>Nom :</strong> {user.name}</p>
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Ville :</strong> {user.city || "Non renseigné"}</p>
          <p><strong>Rôle :</strong> {user.role}</p>
        </div>

        <div className="profile-actions">
          <button onClick={loadProfile}>🔄 Actualiser le profil</button>
          <button onClick={logout}>🚪 Déconnexion</button>
        </div>

        <hr />

        <div className="change-password">
          <h2>Changer le mot de passe</h2>
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Mot de passe actuel</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              🔐 Changer le mot de passe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
