import React, { useState } from 'react';
import UsersService from '../services/UsersService';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await UsersService.requestPasswordReset(email);
      setMessage('Un email de réinitialisation a été envoyé.');
    } catch (err) {
      setError(err.message || 'Erreur lors de la demande.');
    }
  };

  return (
    <div>
      <h2>Mot de passe oublié</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Votre email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit">Envoyer le lien</button>
      </form>
      {message && <p style={{color: 'green'}}>{message}</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}

export default ForgotPasswordPage;
