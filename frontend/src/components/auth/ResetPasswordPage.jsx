import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import UsersService from '../services/UsersService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './ResetPasswordPage.css';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Lien de réinitialisation invalide');
        setTokenChecked(true);
        return;
      }

      try {
        const response = await UsersService.validateResetToken(token);
        if (response.statusCode === 200) {
          setIsValidToken(true);
        } else {
          setError(response.message || 'Token invalide');
        }
      } catch (err) {
        setError(err.message || 'Token invalide ou expiré');
        setIsValidToken(false);
      } finally {
        setTokenChecked(true);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      await UsersService.resetPassword(token, password);
      setMessage('✅ Mot de passe réinitialisé avec succès ! Redirection...');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenChecked) {
    return <LoadingSpinner message="Vérification du lien..." />;
  }

  if (!isValidToken) {
    return (
      <div className="page-wrapper">
        <div className="auth-container">
          <div className="auth-header">
            <h2>Lien invalide</h2>
            <p className="error-message">{error}</p>
          </div>
          <div className="auth-footer">
            <Link to="/forgot-password" className="auth-link">
              Demander un nouveau lien
            </Link>
            <br />
            <Link to="/login" className="auth-link">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Nouveau mot de passe</h2>
          <p>Créez votre nouveau mot de passe</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {isLoading ? (
          <LoadingSpinner message="Réinitialisation..." />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez votre mot de passe"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#999' : '#007bff',
                color: 'white',
                padding: '0.8rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                width: '100%',
                marginTop: '1rem'
              }}
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;