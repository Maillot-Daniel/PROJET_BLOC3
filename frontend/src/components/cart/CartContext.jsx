// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("olympics_auth_token");

  // 🔹 Récupère le panier depuis le backend au démarrage
  useEffect(() => {
    if (!token) return;

    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
          headers: { Authorization: "Bearer " + token },
        });
        if (!res.ok) throw new Error("Impossible de récupérer le panier");
        const data = await res.json();
        setItems(data.items || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [token]);

  // 🔹 Ajouter un item
  const addItem = async (eventId, offerTypeId, quantity = 1) => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cart/items`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId, offerTypeId, quantity }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const updatedCart = await res.json();
      setItems(updatedCart.items || []);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'ajout au panier : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Supprimer un item
  const removeItem = async (eventId, offerTypeId) => {
    const item = items.find(
      (i) => i.eventId === eventId && i.offerTypeId === offerTypeId
    );
    if (!item || !token) return;

    setLoading(true);
    try {
      // On va appeler le backend pour supprimer cet item
      const res = await fetch(`${API_URL}/api/cart/items/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Impossible de supprimer l'item");
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

  // 🔹 Vider le panier
  const clearCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cart/clear`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Impossible de vider le panier");
      setItems([]);
    } catch (error) {
      console.error(error);
      alert("Erreur lors du vidage du panier : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Valider le panier (Stripe ou autre)
  const validateCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const stripeUrl = await res.text();
      setItems([]);
      window.location.href = stripeUrl; // redirige vers Stripe
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
