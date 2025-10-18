import axios from 'axios';

const API_URL = "https://projet-bloc3.onrender.com";

// Configuration Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('olympics_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token.replace('Bearer ', '')}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ SERVICE POUR LA GÉNÉRATION DES TICKETS AVEC DOUBLE CLÉ
export const ticketService = {
  
  // Acheter un ticket et générer les clés
  async purchaseTickets(cartItems, totalAmount) {
    try {
      console.log('🛒 Envoi des données d\'achat au backend:', { cartItems, totalAmount });
      
      const response = await api.post('/api/tickets/purchase', {
        cartItems,
        totalAmount,
        purchaseDate: new Date().toISOString()
      });
      
      console.log('✅ Réponse du backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur achat tickets:', error);
      
      // Mode développement - données simulées
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        console.warn('⚠️ Backend non disponible, utilisation mode simulation');
        return {
          ticketId: 'TKT-' + Date.now(),
          firstKey: 'key1-' + Math.random().toString(36).substring(2, 15),
          secondKey: 'key2-' + Math.random().toString(36).substring(2, 15),
          finalKey: 'final-' + Math.random().toString(36).substring(2, 20),
          secureToken: 'token-' + Math.random().toString(36).substring(2, 10)
        };
      }
      
      throw error;
    }
  },

  // Générer la clé finale et QR Code côté backend
  async generateSecureTicket(ticketId, firstKey, secondKey) {
    try {
      const response = await api.post('/api/tickets/generate-secure-ticket', {
        ticketId,
        firstKey,
        secondKey
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur génération ticket sécurisé:', error);
      throw error;
    }
  },

  // Récupérer les tickets d'un utilisateur
  async getUserTickets() {
    try {
      const response = await api.get('/api/tickets/my-tickets');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération tickets:', error);
      throw error;
    }
  },

  // Valider un ticket (pour admin)
  async validateTicket(qrCodeData) {
    try {
      const response = await api.post('/api/tickets/validate', {
        qrCodeData
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur validation ticket:', error);
      throw error;
    }
  }
};

// ✅ SERVICE POUR LES STATISTIQUES ADMIN
export const adminStatsService = {
  
  // Récupérer les ventes par offre
  async getSalesByOffer() {
    try {
      const response = await api.get('/api/admin/sales-by-offer');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error);
      throw error;
    }
  },

  // Récupérer les statistiques générales
  async getDashboardStats() {
    try {
      const response = await api.get('/api/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération dashboard:', error);
      throw error;
    }
  }
};

// ✅ SERVICE POUR LES OFFRES
export const offerService = {
  
  // Récupérer toutes les offres
  async getAllOffers() {
    try {
      const response = await api.get('/api/offers');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération offres:', error);
      throw error;
    }
  },

  // Récupérer une offre par ID
  async getOfferById(offerId) {
    try {
      const response = await api.get(`/api/offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération offre:', error);
      throw error;
    }
  }
};

export default api;