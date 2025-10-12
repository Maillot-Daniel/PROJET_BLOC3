import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import UsersService from '../service/UsersService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Veuillez saisir votre adresse email');
      setIsLoading(false);
      return;
    }

    try {
      await UsersService.requestPasswordReset(email);
      setMessage('✅ Lien de réinitialisation généré ! Regardez la console du serveur Spring Boot pour le lien.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Erreur lors de la demande');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Mot de passe oublié</h2>
          <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {isLoading ? (
          <LoadingSpinner message="Envoi en cours..." />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                disabled={isLoading}
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
              {isLoading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;