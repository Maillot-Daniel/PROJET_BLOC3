// src/pages/cart/CartPage.jsx
import React from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./CartPage.css";

const CartPage = () => {
  const { items, removeItem, clearCart, validateCart, loading } = useCart();
  const navigate = useNavigate();

  const totalPrice = items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  const handleContinueShopping = () => {
    navigate("/public-events");
  };

  const handleRemoveItem = (eventId, offerTypeId) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet article ?")) {
      removeItem(eventId, offerTypeId);
    }
  };

  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider le panier ?")) {
      clearCart();
    }
  };

  const handleValidateOrder = () => {
    if (items.length === 0) {
      alert("Le panier est vide.");
      return;
    }
    validateCart(); // Redirection vers Stripe si tout va bien
  };

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <h2>Votre panier est vide.</h2>
        <button onClick={handleContinueShopping} disabled={loading}>
          Continuer mes achats
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Votre panier</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item, idx) => (
          <li key={item.id || idx} className="cart-item">
            <strong>{item.eventTitle}</strong> - {item.offerTypeName}
            <br />
            Quantité : {item.quantity} x {item.unitPrice.toFixed(2)} €
            <br />
            <button
              onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)}
              style={{ marginTop: "0.5rem", color: "red" }}
              disabled={loading}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      <p>
        <strong>Total : {totalPrice.toFixed(2)} €</strong>
      </p>

      <div className="cart-buttons">
        <button
          onClick={handleValidateOrder}
          disabled={loading}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Validation..." : "Valider la commande"}
        </button>

        <button
          onClick={handleContinueShopping}
          disabled={loading}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
            marginLeft: "1em",
          }}
        >
          Continuer mes achats
        </button>

        <button
          onClick={handleClearCart}
          disabled={loading}
          style={{
            backgroundColor: "orange",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            marginLeft: "1em",
          }}
        >
          Vider le panier
        </button>
      </div>
    </div>
  );
};

export default CartPage;
