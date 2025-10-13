import { createContext, useContext, useState, useEffect } from "react";
import UsersService from "../components/services/UsersService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Extraire les données utilisateur depuis l'API
  const extractUserData = (apiResponse) => {
    if (!apiResponse) return null;
    return apiResponse.ourUsers || apiResponse.data?.ourUsers || apiResponse;
  };

  // Charger le profil complet
  const loadUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const profileResponse = await UsersService.getProfile();
      const userData = extractUserData(profileResponse);
      if (!userData) throw new Error("Profil introuvable");

      const completeUserProfile = {
        id: userData.id,
        name: userData.name || "Non spécifié",
        email: userData.email || "Non spécifié",
        city: userData.city || "Non spécifié",
        role: userData.role || "USER",
        ...userData,
      };

      setUser(completeUserProfile);
      localStorage.setItem("olympics_user_profile", JSON.stringify(completeUserProfile));
      return completeUserProfile;
    } catch (error) {
      console.error("Erreur chargement profil:", error);
      setUser(null);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  // Connexion
  const login = async ({ token, userId, role }) => {
    try {
      localStorage.setItem("olympics_auth_token", token);
      localStorage.setItem("olympics_user_id", userId);
      localStorage.setItem("olympics_user_role", role);

      UsersService.apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setIsAuthenticated(true);

      // Charger le profil complet avant d'afficher
      const userProfile = await loadUserProfile();

      window.dispatchEvent(new CustomEvent("authChanged"));
      return userProfile;
    } catch (error) {
      console.error("Erreur lors du login:", error);
      setIsAuthenticated(false);
      setUser(null);
      return null;
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem("olympics_auth_token");
    localStorage.removeItem("olympics_user_id");
    localStorage.removeItem("olympics_user_role");
    localStorage.removeItem("olympics_user_profile");

    delete UsersService.apiClient.defaults.headers.common["Authorization"];
    setUser(null);
    setIsAuthenticated(false);

    window.dispatchEvent(new CustomEvent("authChanged"));
  };

  // Rafraîchir le profil
  const refreshProfile = async () => await loadUserProfile();

  // Initialisation du contexte au montage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = UsersService.getToken();
      if (!token) return;

      const savedProfile = localStorage.getItem("olympics_user_profile");
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUser(profile);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Erreur parsing profil stocké:", error);
          await loadUserProfile();
        }
      } else {
        await loadUserProfile();
        setIsAuthenticated(!!UsersService.getToken());
      }
    };

    initializeAuth();

    const handleAuthChange = () => setIsAuthenticated(!!UsersService.getToken());
    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("authExpired", logout);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("authExpired", logout);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loadingProfile,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be utilisé dans un AuthProvider");
  return context;
}
