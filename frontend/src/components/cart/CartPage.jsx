import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./CartPage.css";

const CartPage = () => {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const totalPrice = items.reduce(
    (acc, item) => acc + item.priceUnit * item.quantity,
    0
  );

  /** Valide le panier et redirige vers Stripe */
  const handleValidateOrder = async () => {
    const token = localStorage.getItem("olympics_auth_token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur lors de la validation: ${errorText}`);
      }

      const checkoutUrl = await response.text(); // backend retourne l'URL Stripe
      clearCart();
      setCheckoutComplete(true);

      // Redirection vers Stripe
      window.location.href = checkoutUrl;
    } catch (error) {
      alert(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => navigate("/public-events");

  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider le panier ?")) {
      clearCart();
    }
  };

  if (items.length === 0 && !checkoutComplete) {
    return (
      <div className="cart-container">
        <h2>Votre panier est vide.</h2>
        <button onClick={handleContinueShopping}>Continuer mes achats</button>
      </div>
    );
  }

  if (checkoutComplete) {
    return (
      <div className="cart-container">
        <h2>Merci pour votre commande ! 🎉</h2>
        <p>Vous allez être redirigé vers Stripe pour finaliser le paiement.</p>
        <button onClick={handleContinueShopping}>Retour à la boutique</button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Votre panier</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item, idx) => (
          <li key={item.id || idx} className="cart-item">
            <strong>{item.eventTitle}</strong> - {item.offerName}
            <br />
            Quantité : {item.quantity} x {item.priceUnit.toFixed(2)} €
            <br />
            <button
              onClick={() => removeItem(item.eventId, item.offerTypeId)}
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
