import { createContext, useContext, useState, useEffect } from "react";
import UsersService from "../components/services/UsersService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: localStorage.getItem("olympics_user_id") || null,
    role: localStorage.getItem("olympics_user_role") || null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!UsersService.getToken());

  const isAdmin = user.role?.toLowerCase() === "admin";

  // Met à jour user et auth en fonction du localStorage (ex: après logout/login ailleurs)
  const refreshAuth = () => {
    const token = UsersService.getToken();
    const id = localStorage.getItem("olympics_user_id");
    const role = localStorage.getItem("olympics_user_role");

    setIsAuthenticated(!!token);
    setUser({ id, role });

    if (token) {
      UsersService.apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete UsersService.apiClient.defaults.headers.common["Authorization"];
    }
  };

  // Fonction de connexion
  const login = ({ token, id, role }) => {
    localStorage.setItem("olympics_auth_token", token);
    localStorage.setItem("olympics_user_id", id);
    localStorage.setItem("olympics_user_role", role);

    setUser({ id, role });
    setIsAuthenticated(true);

    UsersService.apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    window.dispatchEvent(new CustomEvent("authChanged"));
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem("olympics_auth_token");
    localStorage.removeItem("olympics_user_id");
    localStorage.removeItem("olympics_user_role");

    setUser({ id: null, role: null });
    setIsAuthenticated(false);

    delete UsersService.apiClient.defaults.headers.common["Authorization"];

    window.dispatchEvent(new CustomEvent("authChanged"));
  };

  // Au montage, remet le token dans axios + écoute événements globaux authChanged
  useEffect(() => {
    refreshAuth();

    const onAuthChange = () => {
      refreshAuth();
    };

    window.addEventListener("authChanged", onAuthChange);
    window.addEventListener("authExpired", onAuthChange);

    return () => {
      window.removeEventListener("authChanged", onAuthChange);
      window.removeEventListener("authExpired", onAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
