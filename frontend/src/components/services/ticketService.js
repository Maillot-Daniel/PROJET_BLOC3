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
  (error) => Promise.reject(error)
);

// SERVICE POUR LA GÉNÉRATION DES TICKETS
export const ticketService = {
  
  async purchaseTickets(cartItems, totalAmount) {
    try {
      const response = await api.post('/api/tickets/purchase', {
        cartItems,
        totalAmount,
        purchaseDate: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      // Mode simulation si backend indisponible
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
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

  async generateSecureTicket(ticketId, firstKey, secondKey) {
    const response = await api.post('/api/tickets/generate-secure-ticket', {
      ticketId,
      firstKey,
      secondKey
    });
    return response.data;
  },

  async getUserTickets() {
    const response = await api.get('/api/tickets/my-tickets');
    return response.data;
  },

  async validateTicket(qrCodeData) {
    const response = await api.post('/api/tickets/validate', { qrCodeData });
    return response.data;
  }
};

// SERVICE POUR LES STATISTIQUES ADMIN
export const adminStatsService = {
  
  async getSalesByOffer() {
    const response = await api.get('/api/admin/sales-by-offer');
    return response.data;
  },

  async getDashboardStats() {
    const response = await api.get('/api/admin/dashboard-stats');
    return response.data;
  }
};

// SERVICE POUR LES OFFRES
export const offerService = {
  
  async getAllOffers() {
    const response = await api.get('/api/offers');
    return response.data;
  },

  async getOfferById(offerId) {
    const response = await api.get(`/api/offers/${offerId}`);
    return response.data;
  }
};

export default api;
