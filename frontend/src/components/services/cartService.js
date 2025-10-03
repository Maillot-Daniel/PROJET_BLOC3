import axios from "axios";

export async function fetchCart(userId) {
  try {
    const response = await axios.get(`/api/cart/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error('Erreur récupération panier');
  }
}

export async function addItemToCart(userId, item) {
  try {
    const response = await axios.post(`/api/cart/${userId}/addItem`, item);
    return response.data;
  } catch (error) {
    throw new Error('Erreur ajout item');
  }
}