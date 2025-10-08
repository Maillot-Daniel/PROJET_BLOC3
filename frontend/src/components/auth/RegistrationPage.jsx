import React, { useState } from "react";
import UsersService from "../services/UsersService";
import { useNavigate } from "react-router-dom";

function RegistrationPage() {
  const navigate = useNavigate();

  // Données initiales pour le formulaire
  const initialFormData = {
    name: '',
    email: '',
    password: '',
    city: '',
    role: 'USER'
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  // Mise à jour des champs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await UsersService.register(formData);

      // Réinitialiser les champs
      setFormData(initialFormData);

      alert('Utilisateur créé avec succès !');

      // Petit délai pour que React applique le reset avant navigation
      setTimeout(() => navigate('/admin/user-management'), 200);
    } catch (error) {
      console.error('Erreur lors de la création de l’utilisateur', error);
      alert('Une erreur est survenue lors de la création de l’utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Créer un utilisateur</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom :</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            autoComplete="off"
            required
          />
        </div>

        <div className="form-group">
          <label>Email :</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            autoComplete="off"
            required
          />
        </div>

        <div className="form-group">
          <label>Mot de passe :</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="form-group">
          <label>Ville :</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            autoComplete="off"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Création en cours...' : 'Créer'}
        </button>
      </form>
    </div>
  );
}

export default RegistrationPage;
