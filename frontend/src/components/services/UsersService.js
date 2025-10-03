import axios from "axios";

class UsersService {
  static BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
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
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        return response;
      },
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
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token;
  }

  static setAuthData(token, role, userId) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROLE_KEY, role);
    localStorage.setItem(this.USER_ID_KEY, userId || "");
    window.dispatchEvent(new CustomEvent("authChanged"));
  }

  static clearAuth() {
    console.log("[UsersService] clearAuth called");
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    window.dispatchEvent(new CustomEvent("authChanged"));
  }

  static isAuthenticated() {
    const isAuth = !!this.getToken();
    return isAuth;
  }

  static isAdmin() {
    const role = localStorage.getItem(this.ROLE_KEY);
    const isAdmin = role && role.toLowerCase() === "admin";
    console.log("[UsersService] isAdmin:", isAdmin, "(role:", role, ")");
    return isAdmin;
  }

  static getCurrentUserId() {
    const userId = localStorage.getItem(this.USER_ID_KEY);
    return userId;
  }

  // Authentification
  static async login(email, password) {
    try {
      const response = await this.apiClient.post("/auth/login", {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Échec de la connexion");
    }
  }

  // Inscription
  static async register(registrationData) {
    console.log("[UsersService] register called");
    try {
      const response = await this.apiClient.post("/auth/register", registrationData);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error, "Échec de l'inscription");
    }
  }

  // Récupérer le profil utilisateur connecté
  static async getProfile() {
    try {
      const response = await this.apiClient.get("/adminuser/get-profile");
      return response.data;
    } catch (error) {

      throw this.normalizeError(error, "Échec de la récupération du profil");
    }
  }

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

  static async deleteUser(userId) {

    try {
      const response = await this.apiClient.delete(`/admin/delete/${userId}`);

      return response.data;
    } catch (error) {

      throw this.normalizeError(error, "Erreur lors de la suppression de l'utilisateur");
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

  // Mot de passe oublié - envoyer mail réinitialisation
  static async requestPasswordReset(email) {

    try {
      const response = await this.apiClient.post("/auth/password-reset-request", { email });

      return response.data;
    } catch (error) {

      throw this.normalizeError(error, "Erreur lors de la demande de réinitialisation");
    }
  }

  // Normalisation des erreurs pour UI
  static normalizeError(error, customMessage = "") {
    console.log("[UsersService] normalizeError called:", customMessage || error.message);
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

UsersService.init();

export default UsersService;