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

  // Redirige si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile");
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
      console.log("🚀 Tentative de connexion pour:", email);
      
      // 1. Appel de connexion
      const userData = await UsersService.login(email, password);
      console.log("✅ Réponse backend:", userData); 

      if (userData?.token) {
        console.log("🔐 Token reçu, connexion au contexte...");
        
        // 2. Utiliser la fonction login du contexte qui gère le profil
        const userProfile = await login({
          token: userData.token,
          userId: userData.userId || userData.id, 
          role: userData.role,
        });

        console.log("🎉 Connexion réussie, profil:", userProfile);

        // Réinitialiser les champs
        setEmail("");
        setPassword("");
        setError("");

        // Redirection avec un petit délai pour laisser le temps à l'état de se mettre à jour
        setTimeout(() => {
          if (userData.role?.toLowerCase() === "admin") {
            console.log("➡️ Redirection vers admin");
            navigate("/admin/user-management");
          } else {
            console.log("➡️ Redirection vers profile");
            navigate("/profile");
          }
        }, 100);

      } else {
        setError(userData.message || "Échec de l'authentification");
      }
    } catch (err) {
      console.error("❌ Erreur de connexion:", err);
      setError(err.message || "Identifiants incorrects");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="page-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <img src={logo} alt="Logo Jeux Olympiques" className="logo-image" />
          <h2>Connexion</h2>
          <p>Accédez à votre espace personnel</p>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner message="Connexion en cours..." />
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
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
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="form-input password-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <div className="forgot-password-link">
                <Link to="/forgot-password">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
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
            <li>✔️ Profil utilisateur avec historique</li>
            <li>✔️ Support dédié 24/7</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;