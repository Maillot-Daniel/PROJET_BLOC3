import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import OlympicLogo from "../../assets/images/logo-jo.png";
import { Power } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Logique d'effet si nécessaire
  }, [user, isAuthenticated]);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  const handleLogout = async () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      await logout();
      setIsMobileMenuOpen(false);
      navigate("/login");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <nav className="navbar loading" aria-label="Menu principal en chargement">
        <div className="olympic-logo-container">
          <Link to="/" aria-label="Accueil">
            <img src={OlympicLogo} alt="Olympic Logo" className="olympic-logo" />
          </Link>
        </div>
        <div className="nav-loading">Chargement...</div>
      </nav>
    );
  }

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Menu principal">
        <div className="olympic-logo-container">
          <Link to="/" onClick={closeMobileMenu} aria-label="Accueil">
            <img src={OlympicLogo} alt="Olympic Logo" className="olympic-logo" />
          </Link>

          {isAuthenticated && user && (
            <div className="user-badge" aria-label="Informations utilisateur">
              <span className="user-email">{user.email || "Utilisateur"}</span>
              {isAdmin && <span className="user-role">(Admin)</span>}
            </div>
          )}
        </div>

        <button
          className={`mobile-menu-button ${isMobileMenuOpen ? "open" : ""}`}
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="nav-menu"
        >
          <span className="menu-icon-bar"></span>
          <span className="menu-icon-bar"></span>
          <span className="menu-icon-bar"></span>
        </button>

        <div id="nav-menu" className={`nav-container ${isMobileMenuOpen ? "open" : ""}`}>
          <ul className="nav-list">
            {/* Liens publics */}
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={closeMobileMenu}>
                Accueil
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/public-events" className="nav-link" onClick={closeMobileMenu}>
                Événements
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/offers" className="nav-link" onClick={closeMobileMenu}>
                Offres
              </Link>
            </li>

            {isAuthenticated ? (
              <>
                {/* Liens utilisateur connecté */}
                <li className="nav-item">
                  <Link to="/cart" className="nav-link" onClick={closeMobileMenu}>
                    Panier
                  </Link>
                </li>

                {/* Section administration */}
                {isAdmin && (
                  <>
                    <li className="nav-item admin-divider" aria-hidden="true">
                      <span className="admin-label">Administration</span>
                    </li>
                    {/* DASHBOARD ADMIN */}
                    <li className="nav-item">
                      <Link to="/admin-dashboard" className="nav-link admin-link" onClick={closeMobileMenu}>
                        📊 Dashboard
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/admin/events" className="nav-link admin-link" onClick={closeMobileMenu}>
                        Gestion Événements
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/admin/user-management" className="nav-link admin-link" onClick={closeMobileMenu}>
                        Gestion Utilisateurs
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/admin/create-event" className="nav-link admin-link" onClick={closeMobileMenu}>
                        Créer un Événement
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/admin/offers-gestion" className="nav-link admin-link" onClick={closeMobileMenu}>
                        Gestion Offres
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/admin/validate-tickets" className="nav-link admin-link" onClick={closeMobileMenu}>
                        🎫 Valider Tickets
                      </Link>
                    </li>
                  </>
                )}

                {/* Déconnexion */}
                <li className="nav-item">
                  <button
                    className="nav-link logout-link"
                    onClick={handleLogout}
                    aria-label="Se déconnecter"
                  >
                    <Power size={16} className="logout-icon" />
                    Déconnexion
                  </button>
                </li>
              </>
            ) : (
              /* Liens visiteurs non connectés */
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link auth-link" onClick={closeMobileMenu}>
                    Connexion
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link auth-link register" onClick={closeMobileMenu}>
                    Inscription
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      <div className="navbar-spacer"></div>
    </>
  );
}

export default Navbar;