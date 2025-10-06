// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api"; // instance Axios avec baseURL et withCredentials

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("olympics_auth_token");

  //  Récupère le panier depuis le backend au démarrage
  useEffect(() => {
    if (!token) return;

    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data.items || []);
      } catch (error) {
        console.error("Erreur lors de la récupération du panier :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [token]);

  //  Ajouter un item
  const addItem = async (eventId, offerTypeId, quantity = 1) => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await api.post(
        "/api/cart/items",
        { eventId, offerTypeId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems(res.data.items || []);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'ajout au panier : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  //  Supprimer un item
  const removeItem = async (eventId, offerTypeId) => {
    const item = items.find(
      (i) => i.eventId === eventId && i.offerTypeId === offerTypeId
    );
    if (!item || !token) return;

    setLoading(true);
    try {
      await api.delete(`/api/cart/items/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) =>
        prev.filter(
          (i) => !(i.eventId === eventId && i.offerTypeId === offerTypeId)
        )
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  //  Vider le panier
  const clearCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await api.delete("/api/cart/clear", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems([]);
    } catch (error) {
      console.error(error);
      alert("Erreur lors du vidage du panier : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  //  Valider le panier (Stripe ou autre)
  const validateCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.post(
        "/api/cart/validate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const stripeUrl = res.data; // si le backend renvoie l'URL en JSON
      setItems([]);
      window.location.href = stripeUrl;
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la validation : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        validateCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
