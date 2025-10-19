import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Cart.css"; 

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Récupérer le panier depuis localStorage
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      // Récupérer depuis localStorage (solution frontend)
      const cartData = localStorage.getItem("olympics_cart");
      if (cartData) {
        const parsedCart = JSON.parse(cartData);
        setCart(parsedCart);
      } else {
        setCart([]);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du panier :", err);
      setError("Impossible de charger le panier.");
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour la quantité d'un article
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    localStorage.setItem("olympics_cart", JSON.stringify(updatedCart));
  };

  // Supprimer un article du panier
  const removeItem = (itemId) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem("olympics_cart", JSON.stringify(updatedCart));
    setSuccessMessage("Article supprimé du panier");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Vider tout le panier
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("olympics_cart");
    setSuccessMessage("Panier vidé");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Calculer le total du panier
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  // Calculer le nombre total d'articles
  const calculateTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Procéder au paiement
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Votre panier est vide");
      return;
    }

    setLoading(true);
    try {
      // Sauvegarder le panier avant la redirection
      localStorage.setItem("olympics_cart", JSON.stringify(cart));
      
      const API_URL = "https://projet-bloc3.onrender.com";
      const response = await axios.post(`${API_URL}/api/payments/create-checkout-session`, {
        cartItems: cart,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/cart`
      });

      // Redirection vers Stripe
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Erreur lors du paiement :", err);
      setError("Erreur lors de la procédure de paiement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement du panier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <div className="error-message">
          <span>❌</span>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <h2>Votre panier est vide</h2>
          <p>Ajoutez des billets pour les Jeux Olympiques Paris 2024</p>
          <a href="/events" className="browse-events-btn">
            🏃‍♂️ Parcourir les événements
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>🎫 Mon Panier</h1>
        <div className="cart-summary">
          <span>{calculateTotalItems()} article{calculateTotalItems() > 1 ? 's' : ''}</span>
          <span className="total-amount">{calculateTotal()} €</span>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <span>✅</span>
          <p>{successMessage}</p>
        </div>
      )}

      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="item-image">
              <img 
                src={item.image || "/images/events/default-event.jpg"} 
                alt={item.eventTitle}
                onError={(e) => {
                  e.target.src = "/images/events/default-event.jpg";
                }}
              />
            </div>
            
            <div className="item-details">
              <h3 className="event-title">{item.eventTitle}</h3>
              <p className="event-date">📅 {item.eventDate}</p>
              <p className="event-location">📍 {item.eventLocation}</p>
              <p className="offer-type">🎯 {item.offerType}</p>
              <p className="item-price">{item.price} €</p>
            </div>

            <div className="item-controls">
              <div className="quantity-controls">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="quantity-btn"
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
              
              <div className="item-total">
                {(item.price * item.quantity).toFixed(2)} €
              </div>
              
              <button 
                onClick={() => removeItem(item.id)}
                className="remove-btn"
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-actions">
          <button onClick={clearCart} className="clear-cart-btn">
            🗑️ Vider le panier
          </button>
          
          <div className="checkout-section">
            <div className="final-total">
              <span>Total :</span>
              <span className="total-amount">{calculateTotal()} €</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="checkout-btn"
            >
              {loading ? "⏳ Traitement..." : "💰 Procéder au paiement"}
            </button>
            
            <p className="security-notice">
              🔒 Paiement sécurisé par Stripe
            </p>
          </div>
        </div>
      </div>

      <div className="cart-info">
        <h3>ℹ️ Informations importantes</h3>
        <ul>
          <li>✅ Paiement 100% sécurisé</li>
          <li>✅ Billets immédiatement disponibles après paiement</li>
          <li>✅ Support client 24h/24</li>
          <li>✅ Annulation possible sous conditions</li>
        </ul>
      </div>
    </div>
  );
}

export default Cart;