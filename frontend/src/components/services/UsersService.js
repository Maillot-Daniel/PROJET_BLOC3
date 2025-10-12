import axios from "axios";

class UsersService {
  static BASE_URL = process.env.REACT_APP_API_URL || "https://projet-bloc3.onrender.com";
  static TOKEN_KEY = "olympics_auth_token";
  static ROLE_KEY = "olympics_user_role";
  static USER_ID_KEY = "olympics_user_id";

  static apiClient = axios.create({
    baseURL: UsersService.BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  static init() {
    // Interceptor pour ajouter le token à chaque requête
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor pour gérer l'expiration du token
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuth();
          window.dispatchEvent(new CustomEvent("authExpired"));
        }
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setAuthData(token, role, userId) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROLE_KEY, role);
    localStorage.setItem(this.USER_ID_KEY, userId || "");
    window.dispatchEvent(new CustomEvent("authChanged"));
  }

  static clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    window.dispatchEvent(new CustomEvent("authChanged"));
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static isAdmin() {
    const role = localStorage.getItem(this.ROLE_KEY);
    return role?.toLowerCase() === "admin";
  }

  static getCurrentUserId() {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  // Auth
  static async login(email, password) {
    try {
      const response = await this.apiClient.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Échec de la connexion");
    }
  }

  static async register(registrationData) {
    try {
      const response = await this.apiClient.post("/auth/register", registrationData);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Échec de l'inscription");
    }
  }

  static async getProfile() {
    try {
      const response = await this.apiClient.get("/adminuser/get-profile");
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Échec de la récupération du profil");
    }
  }

  // Utilisateurs
  static async getAllUsers() {
    try {
      const response = await this.apiClient.get("/admin/get-all-users");
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Erreur lors de la récupération des utilisateurs");
    }
  }

  static async getUserById(userId) {
    try {
      const response = await this.apiClient.get(`/admin/get-users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Erreur lors de la récupération de l'utilisateur");
    }
  }

  static async updateUser(userId, userData) {
    try {
      const response = await this.apiClient.put(`/admin/update/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Erreur lors de la mise à jour de l'utilisateur");
    }
  }

  static async deleteUser(userId) {
    try {
      const response = await this.apiClient.delete(`/admin/delete/${userId}`);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Erreur lors de la suppression de l'utilisateur");
    }
  }

  // ============ NOUVELLES MÉTHODES RÉINITIALISATION MOT DE PASSE ============

  static async requestPasswordReset(email) {
    try {
      const response = await this.apiClient.post("/auth/password-reset-request", { email });
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Erreur lors de la demande de réinitialisation");
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      const response = await this.apiClient.post("/auth/reset-password", {
        token,
        password: newPassword
      });
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Erreur lors de la réinitialisation");
    }
  }

  static async validateResetToken(token) {
    try {
      const response = await this.apiClient.get(`/auth/validate-reset-token?token=${token}`);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Token invalide");
    }
  }

  // ============ FIN DES NOUVELLES MÉTHODES ============

  // Normalisation des erreurs
  static normalizeError(error, customMessage = "") {
    const normalizedError = new Error(customMessage || error.message);
    if (error.response) {
      normalizedError.status = error.response.status;
      normalizedError.data = error.response.data;
      normalizedError.message = error.response.data?.message || error.message;
    } else if (error.request) {
      normalizedError.status = 503;
      normalizedError.message = "Service indisponible";
    }
    return normalizedError;
  }
}

// Initialisation
UsersService.init();

export default UsersService;