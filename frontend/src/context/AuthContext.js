import { createContext, useContext, useState, useEffect } from "react";
import UsersService from "../components/services/UsersService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Récupérer les données depuis localStorage au démarrage
    const savedUser = localStorage.getItem("olympics_user_profile");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error("Erreur parsing saved user:", error);
      }
    }
    return {
      id: localStorage.getItem("olympics_user_id") || null,
      role: localStorage.getItem("olympics_user_role") || null,
    };
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!UsersService.getToken());
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Met à jour user et auth en fonction du localStorage
  const refreshAuth = () => {
    const token = UsersService.getToken();
    const id = localStorage.getItem("olympics_user_id");
    const role = localStorage.getItem("olympics_user_role");
    const savedProfile = localStorage.getItem("olympics_user_profile");

    setIsAuthenticated(!!token);
    
    if (savedProfile) {
      try {
        setUser(JSON.parse(savedProfile));
      } catch (error) {
        console.error("Erreur parsing saved profile:", error);
        setUser({ id, role });
      }
    } else {
      setUser({ id, role });
    }

    if (token) {
      UsersService.apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete UsersService.apiClient.defaults.headers.common["Authorization"];
    }
  };

  // Fonction de connexion avec chargement du profil
  const login = async ({ token, id, role }) => {
    try {
      localStorage.setItem("olympics_auth_token", token);
      localStorage.setItem("olympics_user_id", id);
      localStorage.setItem("olympics_user_role", role);

      // Récupérer le profil complet après connexion
      const profileResponse = await UsersService.getProfile();
      console.log("📊 Profil reçu dans AuthContext:", profileResponse);

      let userProfile = { id, role };

      if (profileResponse?.ourUsers) {
        userProfile = { ...profileResponse.ourUsers, role };
      } else if (profileResponse?.data?.ourUsers) {
        userProfile = { ...profileResponse.data.ourUsers, role };
      }

      // Stocker le profil complet
      localStorage.setItem("olympics_user_profile", JSON.stringify(userProfile));
      setUser(userProfile);
      setIsAuthenticated(true);

      UsersService.apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      window.dispatchEvent(new CustomEvent("authChanged"));
      
      return userProfile;
    } catch (error) {
      console.error("Erreur lors du chargement du profil après connexion:", error);
      // Fallback: stocker au moins les infos de base
      const basicUser = { id, role };
      localStorage.setItem("olympics_user_profile", JSON.stringify(basicUser));
      setUser(basicUser);
      setIsAuthenticated(true);
      
      UsersService.apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      return basicUser;
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem("olympics_auth_token");
    localStorage.removeItem("olympics_user_id");
    localStorage.removeItem("olympics_user_role");
    localStorage.removeItem("olympics_user_profile");

    setUser({ id: null, role: null });
    setIsAuthenticated(false);

    delete UsersService.apiClient.defaults.headers.common["Authorization"];

    window.dispatchEvent(new CustomEvent("authChanged"));
  };

  // Fonction pour mettre à jour le profil
  const updateProfile = (profileData) => {
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem("olympics_user_profile", JSON.stringify(updatedUser));
  };

  // Fonction pour recharger le profil depuis l'API
  const refreshProfile = async () => {
    try {
      const profileResponse = await UsersService.getProfile();
      console.log("🔄 Profil rafraîchi:", profileResponse);

      let userProfile = user;

      if (profileResponse?.ourUsers) {
        userProfile = { ...profileResponse.ourUsers, role: user.role };
      } else if (profileResponse?.data?.ourUsers) {
        userProfile = { ...profileResponse.data.ourUsers, role: user.role };
      }

      localStorage.setItem("olympics_user_profile", JSON.stringify(userProfile));
      setUser(userProfile);
      
      return userProfile;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du profil:", error);
      throw error;
    }
  };

  // Au montage, initialiser l'authentification
  useEffect(() => {
    const initializeAuth = async () => {
      const token = UsersService.getToken();
      if (token) {
        try {
          // Vérifier si on a déjà un profil stocké
          const savedProfile = localStorage.getItem("olympics_user_profile");
          if (!savedProfile) {
            // Si pas de profil stocké, le charger
            await refreshProfile();
          }
        } catch (error) {
          console.error("Erreur initialisation auth:", error);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

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
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin, 
      isLoading,
      login, 
      logout, 
      updateProfile,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}