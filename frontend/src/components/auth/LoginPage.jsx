import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import UsersService from "../services/UsersService";
import { useAuth } from "../../context/AuthContext";
import logo from '../../assets/logoJO.webp';
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (window.location.pathname !== "/profile") {
        navigate("/profile");
      }
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userData = await UsersService.login(email, password);

      if (userData?.token) {
        login({
          token: userData.token,
          id: userData.userId,
          role: userData.role,
        });

        if (userData.role?.toLowerCase() === "admin") {
          navigate("/admin/user-management");
        } else {
          navigate("/profile");
        }
      } else {
        setError(userData.error || "Échec de l'authentification");
      }
    } catch (error) {
      setError(error.message || "Identifiants incorrects");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <img src={logo} alt="Logo Jeux Olympiques" className="logo-image" />
          <h2>Connexion</h2>
          <p>Accédez à votre espace personnel</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <LoadingSpinner message="Connexion en cours..." />
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>

              <button
                type="button"
                className="forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert("La fonction 'Mot de passe oublié' sera bientôt disponible.");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "blue",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  font: "inherit",
                  marginTop: "0.5rem"
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              Se connecter
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{" "}
            <Link to="/register" className="auth-link">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>

      <div className="presentation-box">
        <h3>Bienvenue aux Jeux Olympiques Paris 2024</h3>
        <div className="image-container">
          <img
            src="/img_jeux_olympic.webp"
            alt="Jeux Olympiques 2024"
            className="olympic-image"
          />
          <div className="image-overlay"></div>
        </div>
        <div className="presentation-content">
          <p>
            Vivez l'expérience unique des Jeux Olympiques dans la ville lumière.
            Accédez à vos billets, suivez vos épreuves favorites et profitez
            d'offres exclusives.
          </p>
          <ul className="features-list">
            <li>✔️ Achat et gestion de vos billets</li>
            <li>✔️ Programme personnalisé des épreuves</li>
            <li>✔️ Actualités et résultats en direct</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
