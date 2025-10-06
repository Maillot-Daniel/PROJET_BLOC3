import React, { useEffect, useState } from "react";
import axios from "axios";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/cart");
      setCart(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération du panier :", err);
      setError("Impossible de charger le panier.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement du panier...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!cart || !cart.items?.length) return <div>Votre panier est vide.</div>;

  return (
    <div>
      <ul>
        {cart.items.map((item) => (
          <li key={item.id}>
            {item.name} — {item.quantity}
          </li>
        ))}
      </ul>
      <p>Total : {cart.total} €</p>
    </div>
  );
}

export default Cart;
