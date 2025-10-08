import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Configuration sécurisée de l'URL API
  const getApiUrl = () => {
    try {
      if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
    } catch (error) {
      console.warn("Erreur lors de la lecture des variables d'environnement:", error);
    }
    return "http://localhost:8080";
  };

  const API_URL = getApiUrl();
  const totalPrice = items.reduce(
    (acc, item) => acc + (item.priceUnit || 0) * (item.quantity || 0),
    0
  );

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
      const validatedItems = items.map(item => {
        if (!item.eventId || !item.offerTypeId) {
          throw new Error('Données de produit invalides');
        }
        return {
          eventId: item.eventId,
          eventTitle: item.eventTitle || 'Titre non disponible',
          offerTypeId: item.offerTypeId,
          offerTypeName: item.offerName || 'Offre non disponible',
          quantity: item.quantity || 1,
          unitPrice: item.priceUnit || 0,
          totalPrice: (item.priceUnit || 0) * (item.quantity || 1)
        };
      });

      const cartBody = {
        items: validatedItems,
        totalPrice: totalPrice
      };

      console.log('📦 Données envoyées au serveur:', cartBody);
      console.log('🔗 URL de l\'API:', `${API_URL}/api/cart/validate`);

      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace('Bearer ', '')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cartBody)
      });

      console.log('📨 Statut de la réponse:', response.status);

      if (!response.ok) {
        let errorMessage = `Erreur serveur (${response.status})`;
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (e) {
          console.error('Erreur lors de la lecture de la réponse:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Réponse du serveur:', data);

      if (data.url) {
        console.log('🔗 Redirection vers Stripe');
        window.location.href = data.url;
      } else {
        alert("✅ Commande validée avec succès !");
        clearCart();
        navigate('/public-events');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      let errorMessage = "Une erreur est survenue lors de la validation de votre commande";

      if (error.message.includes('Failed to fetch')) {
        errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
      } else if (error.message.includes('401')) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
        localStorage.removeItem('olympics_auth_token');
        navigate('/login');
      } else if (error.message.includes('403')) {
        errorMessage = "Accès refusé. Vérifiez vos permissions.";
      } else if (error.message.includes('500')) {
        errorMessage = "Erreur interne du serveur. Veuillez réessayer plus tard.";
      } else {
        errorMessage = error.message;
      }

      alert(errorMessage);
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
    if (window.confirm("Voulez-vous vraiment vider tout le panier ?")) {
      clearCart();
    }
  };

  const handleRemoveItem = (eventId, offerTypeId) => {
    if (window.confirm("Voulez-vous retirer cet article du panier ?")) {
      removeItem(eventId, offerTypeId);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h2>Votre panier est vide</h2>
          <p>Explorez nos événements et ajoutez des billets à votre panier.</p>
          <button
            onClick={handleContinueShopping}
            className="continue-shopping-btn"
          >
            Découvrir les événements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Votre panier</h2>
        <span className="cart-count">{items.length} article(s)</span>
      </div>

      <div className="cart-items">
        {items.map((item, index) => (
          <div key={`${item.eventId}-${item.offerTypeId}-${index}`} className="cart-item">
            <div className="item-info">
              <h3 className="item-title">{item.eventTitle}</h3>
              <p className="item-offer">{item.offerName}</p>
              <div className="item-details">
                <span className="item-quantity">Quantité: {item.quantity}</span>
                <span className="item-price">{item.priceUnit?.toFixed(2)} € l'unité</span>
              </div>
              <div className="item-total">
                Sous-total: {(item.priceUnit * item.quantity).toFixed(2)} €
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)}
              className="remove-item-btn"
              disabled={loading}
              aria-label="Supprimer cet article"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="total-section">
          <span className="total-label">Total:</span>
          <span className="total-amount">{totalPrice.toFixed(2)} €</span>
        </div>

        <div className="cart-actions">
          <button
            onClick={handleValidateOrder}
            disabled={loading}
            className="validate-order-btn"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Traitement en cours...
              </>
            ) : (
              'Valider la commande'
            )}
          </button>

          <div className="secondary-actions">
            <button
              onClick={handleContinueShopping}
              disabled={loading}
              className="continue-shopping-btn"
            >
              Continuer mes achats
            </button>

            <button
              onClick={handleClearCart}
              disabled={loading}
              className="clear-cart-btn"
            >
              Vider le panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
