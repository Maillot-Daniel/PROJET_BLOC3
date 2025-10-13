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
      marginTop: '30px', // un peu plus haut
      width: '90%',
      maxWidth: '400px',
      background: 'rgba(0,0,0,0.50)',
      color: 'white',
      padding: '15px',
      borderRadius: '10px',
      fontFamily: 'monospace',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      alignSelf: 'center'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
        👋 Bonjour {user.name.split(" ")[0]} !
      </div>

      <div style={{
        fontSize: '12px',
        color: '#ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Rôle : {user.role}</span>
        <button
          onClick={() => setShowChangePwd(!showChangePwd)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔑 Changer mot de passe
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#0f0' }}>✅ Connecté</div>

      {showChangePwd && (
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input
            type="password"
            placeholder="Ancien mot de passe"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Confirmer nouveau mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#00cc88',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? "⏳ ..." : "Modifier"}
          </button>
        </form>
      )}

      {message && <div style={{ color: '#00ff88', fontSize: '12px' }}>{message}</div>}
      {error && <div style={{ color: '#ff4444', fontSize: '12px' }}>{error}</div>}
    </div>
  );
}
