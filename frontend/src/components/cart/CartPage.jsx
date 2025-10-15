import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import TicketEmailForm from './TicketEmailForm'; // <-- Nouveau composant pour l'envoi mail

function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [primaryKey, setPrimaryKey] = useState(null); // clé pour le billet
  const navigate = useNavigate();

  const API_URL = "https://projet-bloc3.onrender.com";

  const totalPrice = items.reduce(
    (acc, item) => acc + (item.priceUnit || 0) * (item.quantity || 0),
    0
  );

  const handleValidateOrder = async () => {
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
        offerTypeId: item.offerTypeId,
        quantity: item.quantity || 1,
      }));

      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace('Bearer ', '')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: validatedItems, totalPrice }),
      });

      if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; // redirection Stripe
      } else if (data.primaryKey) {
        // paiement simulé ou paiement immédiat
        setPrimaryKey(data.primaryKey);
        clearCart();
      } else {
        alert("✅ Commande validée !");
        clearCart();
        navigate('/public-events');
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

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

  // --- rendu panier ou formulaire mail ---
  if (items.length === 0 && !primaryKey) {
    return (
      <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Votre panier est vide</h2>
        <button onClick={handleContinueShopping}>Découvrir les événements</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      {items.length > 0 && (
        <>
          <h2>Votre panier</h2>
          {items.map((item, idx) => (
            <div key={`${item.eventId}-${item.offerTypeId}-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <div>
                <p>{item.eventTitle} - {item.offerName}</p>
                <p>Quantité: {item.quantity} | Prix unitaire: {item.priceUnit?.toFixed(2)} €</p>
              </div>
              <button onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)}>×</button>
            </div>
          ))}
          <h3>Total : {totalPrice.toFixed(2)} €</h3>
          <button onClick={handleValidateOrder} disabled={loading}>
            {loading ? "Traitement..." : "✅ Valider la commande"}
          </button>
          <button onClick={handleClearCart} disabled={loading}>🗑️ Vider le panier</button>
        </>
      )}

      {/* --- Affichage formulaire mail si paiement validé --- */}
      {primaryKey && <TicketEmailForm primaryKey={primaryKey} />}
    </div>
  );
}

export default CartPage;
