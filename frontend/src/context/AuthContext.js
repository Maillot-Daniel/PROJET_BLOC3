import { createContext, useContext, useState, useEffect } from "react";
import UsersService from "../components/services/UsersService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Récupérer les données depuis localStorage au démarrage
    const savedUser = localStorage.getItem("olympics_user_profile");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log("🔑 Utilisateur chargé depuis localStorage:", parsedUser);
        return parsedUser;
      } catch (error) {
        console.error("❌ Erreur parsing saved user:", error);
      }
    }
    const basicUser = {
      id: localStorage.getItem("olympics_user_id") || null,
      role: localStorage.getItem("olympics_user_role") || null,
    };
    console.log("🔑 Utilisateur basique créé:", basicUser);
    return basicUser;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!UsersService.getToken());
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Fonction de connexion avec stockage IMMÉDIAT du token
  const login = async (loginData) => {
    try {
      const { token, userId: id, role } = loginData;
      
      console.log("🔐 Stockage des données d'authentification...");
      
      // Stocker IMMÉDIATEMENT le token avant toute autre requête
      UsersService.setAuthData(token, role, id);
      
      // Maintenant récupérer le profil
      console.log("📡 Récupération du profil...");
      const profileResponse = await UsersService.getProfile();
      console.log("📊 Profil reçu dans AuthContext:", profileResponse);

      let userProfile = { id, role };

      // Extraire les données du profil
      if (profileResponse?.ourUsers) {
        userProfile = { 
          ...profileResponse.ourUsers, 
          role: profileResponse.ourUsers.role || role 
        };
        console.log("✅ Profil complet chargé:", userProfile);
      } else {
        console.warn("⚠️ Structure de profil inattendue:", profileResponse);
        userProfile = { id, role, name: "Utilisateur", email: "" };
      }

      // Stocker le profil complet
      localStorage.setItem("olympics_user_profile", JSON.stringify(userProfile));
      setUser(userProfile);
      setIsAuthenticated(true);

      window.dispatchEvent(new CustomEvent("authChanged"));
      
      return userProfile;
    } catch (error) {
      console.error("❌ Erreur lors du chargement du profil:", error);
      // Fallback: stocker au moins les infos de base
      const basicUser = { id: loginData.userId, role: loginData.role };
      localStorage.setItem("olympics_user_profile", JSON.stringify(basicUser));
      setUser(basicUser);
      setIsAuthenticated(true);
      
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

    UsersService.clearAuth();

    window.dispatchEvent(new CustomEvent("authChanged"));
  };

  // Fonction pour recharger le profil - CORRIGÉE
  const refreshProfile = async () => {
    try {
      console.log("🔄 Raffraîchissement du profil dans AuthContext...");
      const profileResponse = await UsersService.getProfile();
      console.log("📊 Réponse profil reçue:", profileResponse);
      
      let userProfile = { ...user }; // Commencer avec l'utilisateur actuel

      if (profileResponse?.ourUsers) {
        userProfile = { 
          ...profileResponse.ourUsers, 
          role: profileResponse.ourUsers.role || user.role 
        };
        console.log("✅ Profil complet extrait:", userProfile);
      } else if (profileResponse) {
        console.warn("⚠️ Structure de réponse inattendue:", profileResponse);
        // Essayer d'extraire les données d'une autre manière
        if (profileResponse.id || profileResponse.email) {
          userProfile = { ...profileResponse, role: user.role };
        }
      }

      console.log("💾 Stockage du profil:", userProfile);
      
      // Stocker et mettre à jour le state
      localStorage.setItem("olympics_user_profile", JSON.stringify(userProfile));
      setUser(userProfile);
      
      console.log("✅ Profil rafraîchi et state mis à jour");
      
      return userProfile;
    } catch (error) {
      console.error("❌ Erreur rafraîchissement profil:", error);
      throw error;
    }
  };

  // Au montage, initialiser l'authentification
  useEffect(() => {
    const initializeAuth = () => {
      const token = UsersService.getToken();
      const savedProfile = localStorage.getItem("olympics_user_profile");
      
      console.log("🔍 Initialisation auth - Token:", !!token, "Profil:", !!savedProfile);
      
      if (token && savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          console.log("👤 Profil chargé depuis localStorage:", profile);
          setUser(profile);
          setIsAuthenticated(true);
          console.log("🔑 Auth initialisée depuis localStorage");
        } catch (error) {
          console.error("❌ Erreur initialisation auth:", error);
        }
      } else if (token) {
        // Si token mais pas de profil, charger le profil
        console.log("🔑 Token présent mais pas de profil, chargement...");
        refreshProfile();
      }
    };

    initializeAuth();

    const onAuthChange = () => {
      const token = UsersService.getToken();
      console.log("🔄 Auth changed - Token présent:", !!token);
      setIsAuthenticated(!!token);
      
      if (!token) {
        setUser({ id: null, role: null });
      }
    };

    window.addEventListener("authChanged", onAuthChange);
    window.addEventListener("authExpired", logout);

    return () => {
      window.removeEventListener("authChanged", onAuthChange);
      window.removeEventListener("authExpired", logout);
    };
  }, []);

  // Debug: log quand user change
  useEffect(() => {
    console.log("🔄 State 'user' mis à jour dans AuthContext:", user);
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin, 
      isLoading,
      login, 
      logout, 
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