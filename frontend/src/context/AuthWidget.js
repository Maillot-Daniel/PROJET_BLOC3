import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import UsersService from "../components/services/UsersService";

export default function AuthWidget() {
  const { user } = useAuth();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topPosition, setTopPosition] = useState(60);

  useEffect(() => {
    const handleResize = () => {
      setTopPosition(window.innerWidth < 768 ? 100 : 60);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!user) return null;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setIsLoading(true);
      await UsersService.changePassword({ oldPassword, newPassword });
      setMessage("✅ Mot de passe modifié avec succès !");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePwd(false);
    } catch (err) {
      setError(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: `${topPosition}px`,
      right: '10px',
      background: 'rgba(0,0,0,0.6)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      zIndex: 9999,
      fontFamily: 'monospace',
      width: '90%',
      maxWidth: '250px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
        👋 Bonjour {user.name.split(" ")[0]} !
      </div>

      <div style={{
        fontSize: '11px',
        color: '#ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Rôle : {user.role}</span>
        <button
          onClick={() => setShowChangePwd(!showChangePwd)}
          style={{
            padding: '2px 6px',
            fontSize: '10px',
            backgroundColor: 'rgba(0,123,255,0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔑 Changer Mot de passe
        </button>
      </div>

      <div style={{ fontSize: '11px', color: '#0f0' }}>✅ Connecté</div>

      {showChangePwd && (
        <form onSubmit={handleChangePassword} style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input
            type="password"
            placeholder="Ancien mot de passe"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Confirmer nouveau mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#00cc88',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? "⏳ ..." : "Modifier"}
          </button>
        </form>
      )}

      {message && <div style={{ marginTop: '4px', color: '#00ff88', fontSize: '11px' }}>{message}</div>}
      {error && <div style={{ marginTop: '4px', color: '#ff4444', fontSize: '11px' }}>{error}</div>}
    </div>
  );
}
