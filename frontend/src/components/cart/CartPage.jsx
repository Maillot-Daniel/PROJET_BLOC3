import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ URL API FIXE - Plus d'erreur VITE_API_URL
  const API_URL = "https://projet-bloc3.onrender.com";

  // --- Calcul du total ---
  const totalPrice = items.reduce(
    (acc, item) => acc + (item.priceUnit || 0) * (item.quantity || 0),
    0
  );

  // --- Validation commande ---
  const handleValidateOrder = async () => {
    console.log('🛒 Début de la validation de commande');
    const token = localStorage.getItem('olympics_auth_token');

    if (!token) {
      alert('Veuillez vous connecter pour valider votre commande');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      alert("Votre panier est vide !");
      return;
    }

    setLoading(true);

    try {
      const validatedItems = items.map(item => ({
        eventId: item.eventId,
        eventTitle: item.eventTitle || 'Titre non disponible',
        offerTypeId: item.offerTypeId,
        offerTypeName: item.offerName || 'Offre non disponible',
        quantity: item.quantity || 1,
        unitPrice: item.priceUnit || 0,
        totalPrice: (item.priceUnit || 0) * (item.quantity || 1)
      }));

      const cartBody = { items: validatedItems, totalPrice };

      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace('Bearer ', '')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cartBody),
      });

      if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; // redirection Stripe ou autre
      } else {
        alert("✅ Commande validée avec succès !");
        clearCart();
        navigate('/public-events');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      alert(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // --- Autres actions panier ---
  const handleContinueShopping = () => {
    const token = localStorage.getItem('olympics_auth_token');
    if (!token) navigate('/login');
    else navigate('/public-events');
  };

  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider tout le panier ?")) clearCart();
  };

  const handleRemoveItem = (eventId, offerTypeId) => {
    if (window.confirm("Voulez-vous retirer cet article du panier ?")) {
      removeItem(eventId, offerTypeId);
    }
  };

  // --- Styles inline ---
  const buttonStyle = {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    transition: "all 0.3s ease",
  };

  const styles = {
    container: {
      padding: "30px",
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#f9fafb",
      borderRadius: "16px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    title: { fontSize: "24px", color: "#1e293b" },
    item: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "15px",
      marginBottom: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    },
    totalSection: {
      marginTop: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "18px",
      fontWeight: "bold",
    },
    validateBtn: {
      ...buttonStyle,
      backgroundColor: "#16a34a",
      color: "#fff",
    },
    continueBtn: {
      ...buttonStyle,
      backgroundColor: "#3b82f6",
      color: "#fff",
    },
    clearBtn: {
      ...buttonStyle,
      backgroundColor: "#dc2626",
      color: "#fff",
    },
    removeBtn: {
      ...buttonStyle,
      backgroundColor: "#f87171",
      color: "#fff",
      padding: "6px 10px",
      fontSize: "20px",
      borderRadius: "50%",
    },
  };

  // --- Rendu ---
  if (items.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Votre panier est vide</h2>
        <p>Explorez nos événements et ajoutez des billets à votre panier.</p>
        <button onClick={handleContinueShopping} style={styles.continueBtn}>
          Découvrir les événements
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Votre panier</h2>
        <span style={{ color: "#64748b" }}>{items.length} article(s)</span>
      </div>

      <div>
        {items.map((item, index) => (
          <div key={`${item.eventId}-${item.offerTypeId}-${index}`} style={styles.item}>
            <div>
              <h3 style={{ color: "#1e40af" }}>{item.eventTitle}</h3>
              <p style={{ color: "#475569" }}>{item.offerName}</p>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                Quantité: {item.quantity} | Prix unitaire: {item.priceUnit?.toFixed(2)} €
              </div>
              <div style={{ marginTop: "6px", fontWeight: "bold", color: "#334155" }}>
                Sous-total: {(item.priceUnit * item.quantity).toFixed(2)} €
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)}
              style={styles.removeBtn}
              disabled={loading}
              aria-label="Supprimer cet article"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={styles.totalSection}>
        <span>Total :</span>
        <span>{totalPrice.toFixed(2)} €</span>
      </div>

      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={handleValidateOrder} disabled={loading} style={styles.validateBtn}>
          {loading ? "Traitement..." : "✅ Valider la commande"}
        </button>

        <button onClick={handleContinueShopping} disabled={loading} style={styles.continueBtn}>
          🛍️ Continuer mes achats
        </button>

        <button onClick={handleClearCart} disabled={loading} style={styles.clearBtn}>
          🗑️ Vider le panier
        </button>
      </div>
    </div>
  );
}

export default CartPage;