import { createContext, useContext, useState, useEffect } from "react";
import UsersService from "../components/services/UsersService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Charger le profil complet depuis localStorage
    const savedProfile = localStorage.getItem("olympics_user_profile");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        console.log("🔑 Profil chargé depuis localStorage:", profile);
        return profile;
      } catch (error) {
        console.error("❌ Erreur parsing saved profile:", error);
      }
    }
    // Fallback aux données basiques
    return {
      id: localStorage.getItem("olympics_user_id") || null,
      role: localStorage.getItem("olympics_user_role") || null,
    };
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!UsersService.getToken());

  const isAdmin = user?.role?.toLowerCase() === "admin";

  console.log("🔄 AUTH CONTEXT - User state:", user);

  // Fonction pour extraire les données utilisateur de la réponse API
  const extractUserData = (apiResponse) => {
    console.log("🔍 Extraction données depuis:", apiResponse);
    
    // Plusieurs façons possibles d'accéder aux données
    let userData = null;
    
    if (apiResponse?.ourUsers) {
      userData = apiResponse.ourUsers;
      console.log("✅ Données trouvées dans 'ourUsers'");
    } else if (apiResponse?.data?.ourUsers) {
      userData = apiResponse.data.ourUsers;
      console.log("✅ Données trouvées dans 'data.ourUsers'");
    } else if (apiResponse?.id) {
      userData = apiResponse;
      console.log("✅ Données trouvées directement dans la réponse");
    } else if (apiResponse) {
      console.warn("⚠️ Structure inattendue, utilisation directe:", apiResponse);
      userData = apiResponse;
    }
    
    if (userData) {
      console.log("👤 Données utilisateur extraites:", userData);
      console.log("📝 Détails:");
      console.log("  - ID:", userData.id);
      console.log("  - Name:", userData.name);
      console.log("  - Email:", userData.email);
      console.log("  - City:", userData.city);
      console.log("  - Role:", userData.role);
    }
    
    return userData;
  };

  // Fonction pour charger le profil complet
  const loadUserProfile = async () => {
    try {
      console.log("📡 Chargement du profil utilisateur...");
      
      const profileResponse = await UsersService.getProfile();
      console.log("📊 Réponse API complète:", profileResponse);

      const userData = extractUserData(profileResponse);
      
      if (userData) {
        // S'assurer que toutes les propriétés nécessaires sont présentes
        const completeUserProfile = {
          id: userData.id,
          name: userData.name || userData.nom || "Non spécifié",
          email: userData.email || "Non spécifié",
          city: userData.city || userData.ville || "Non spécifié",
          role: userData.role || "USER",
          // Autres champs possibles
          password: userData.password, // Normalement pas affiché
          ...userData // Inclure tous les autres champs
        };
        
        console.log("✅ Profil complet construit:", completeUserProfile);
        
        // Stocker le profil complet
        localStorage.setItem("olympics_user_profile", JSON.stringify(completeUserProfile));
        setUser(completeUserProfile);
        
        return completeUserProfile;
      } else {
        throw new Error("Aucune donnée utilisateur trouvée dans la réponse");
      }
    } catch (error) {
      console.error("❌ Erreur chargement profil:", error);
      throw error;
    }
  };

  // Fonction de connexion
  const login = async (loginData) => {
    try {
      const { token, userId: id, role } = loginData;
      
      console.log("🔐 Stockage des données d'authentification...");
      
      // Stocker les données de base IMMÉDIATEMENT
      localStorage.setItem("olympics_auth_token", token);
      localStorage.setItem("olympics_user_id", id);
      localStorage.setItem("olympics_user_role", role);

      // Mettre à jour le state avec les données basiques
      const basicUser = { id, role };
      setUser(basicUser);
      setIsAuthenticated(true);
      
      // Configurer le token dans axios
      UsersService.apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Maintenant charger le profil complet
      console.log("📡 Chargement du profil après connexion...");
      const userProfile = await loadUserProfile();
      
      window.dispatchEvent(new CustomEvent("authChanged"));
      
      console.log("🎉 Connexion réussie avec profil complet:", userProfile);
      return userProfile;
      
    } catch (error) {
      console.error("❌ Erreur lors de la connexion:", error);
      // En cas d'erreur, garder au moins les données basiques
      const basicUser = { id: loginData.userId, role: loginData.role };
      setUser(basicUser);
      setIsAuthenticated(true);
      return basicUser;
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    console.log("🚪 Déconnexion...");
    
    localStorage.removeItem("olympics_auth_token");
    localStorage.removeItem("olympics_user_id");
    localStorage.removeItem("olympics_user_role");
    localStorage.removeItem("olympics_user_profile");

    setUser({ id: null, role: null });
    setIsAuthenticated(false);
    delete UsersService.apiClient.defaults.headers.common["Authorization"];

    window.dispatchEvent(new CustomEvent("authChanged"));
  };

  // Fonction pour rafraîchir le profil
  const refreshProfile = async () => {
    return await loadUserProfile();
  };

  // Au montage, initialiser l'authentification
  useEffect(() => {
    const initializeAuth = () => {
      const token = UsersService.getToken();
      const savedProfile = localStorage.getItem("olympics_user_profile");
      
      console.log("🔍 Initialisation auth - Token:", !!token, "Profil sauvegardé:", !!savedProfile);
      
      if (token && savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUser(profile);
          setIsAuthenticated(true);
          console.log("✅ Profil chargé depuis le stockage local");
        } catch (error) {
          console.error("❌ Erreur chargement profil stocké:", error);
        }
      } else if (token) {
        // Si token mais pas de profil, charger le profil
        console.log("🔄 Token présent mais pas de profil, chargement...");
        loadUserProfile();
      }
    };

    initializeAuth();

    const onAuthChange = () => {
      const token = UsersService.getToken();
      console.log("🔄 Événement authChanged - Token présent:", !!token);
      setIsAuthenticated(!!token);
    };

    window.addEventListener("authChanged", onAuthChange);
    window.addEventListener("authExpired", logout);

    return () => {
      window.removeEventListener("authChanged", onAuthChange);
      window.removeEventListener("authExpired", logout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin, 
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