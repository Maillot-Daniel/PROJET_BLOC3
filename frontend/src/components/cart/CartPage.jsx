import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import './CartPage.css';

function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const navigate = useNavigate();

  const API_URL = "https://projet-bloc3.onrender.com";

  // Calcul du total
  const totalPrice = items.reduce(
    (acc, item) => acc + (item.priceUnit || 0) * (item.quantity || 0),
    0
  );

  // ✅ Sauvegarde du panier avant paiement
  const saveCartForOrder = () => {
    const cartData = {
      items: items.map(item => ({
        eventId: item.eventId,
        eventTitle: item.eventTitle,
        offerTypeId: item.offerTypeId,
        offerTypeName: item.offerName,
        quantity: item.quantity,
        priceUnit: item.priceUnit
      })),
      total: totalPrice,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('olympics_pending_order', JSON.stringify(cartData));
  };

  // ✅ Génération QR Code
  const generateQRCodeForTicket = async (orderData) => {
    try {
      const firstKey = 'key1-' + Math.random().toString(36).substring(2, 10);
      const secondKey = 'key2-' + Math.random().toString(36).substring(2, 10);
      const finalKey = firstKey + secondKey;

      const qrContent = {
        orderId: orderData.orderNumber,
        finalKey: finalKey,
        events: orderData.items,
        total: orderData.total,
        purchaseDate: orderData.purchaseDate
      };

      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), {
        width: 300,
        margin: 2
      });

      return { qrCodeImage, finalKey };
    } catch (error) {
      console.error('Erreur génération QR:', error);
      return null;
    }
  };

  // ✅ Succès commande
  const handleOrderSuccess = async (orderData) => {
    const qrResult = await generateQRCodeForTicket(orderData);

    if (qrResult) {
      setQrCodeData(qrResult.qrCodeImage);
      setOrderNumber(orderData.orderNumber);
      setOrderSuccess(true);

      const ticketData = {
        ...orderData,
        qrCode: qrResult.qrCodeImage,
        finalKey: qrResult.finalKey,
        status: 'active'
      };

      const existingTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
      existingTickets.push(ticketData);
      localStorage.setItem('olympics_tickets', JSON.stringify(existingTickets));

      clearCart();
    } else {
      console.error('Échec génération QR Code');
      alert('Erreur lors de la génération du billet');
    }
  };

  // --- Validation commande ---
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
    saveCartForOrder();

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

      const cartBody = { 
        items: validatedItems, 
        totalPrice,
        returnUrl: `${window.location.origin}/cart?success=true`
      };

      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace('Bearer ', '')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cartBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; // Redirection Stripe
      } else {
        const orderData = {
          orderNumber: 'CMD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          items: items,
          total: totalPrice,
          purchaseDate: new Date().toISOString()
        };

        await handleOrderSuccess(orderData);
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // --- Autres actions panier ---
  const handleContinueShopping = () => navigate('/public-events');
  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider tout le panier ?")) clearCart();
  };
  const handleRemoveItem = (eventId, offerTypeId) => {
    if (window.confirm("Voulez-vous retirer cet article du panier ?")) removeItem(eventId, offerTypeId);
  };

  // ✅ Rendu succès avec QR Code
  if (orderSuccess) {
    return (
      <div className="cart-page">
        <div className="success-modal">
          <div className="purchase-content">
            <div className="success-message">✅ Paiement confirmé ! Votre billet est prêt.</div>
            
            <div className="order-info">
              <p><strong>Numéro de commande :</strong> {orderNumber}</p>
              <p><strong>Date d'achat :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <p>Présentez ce QR Code à l'entrée :</p>
            
            <div className="qr-code-container">
              {qrCodeData ? (
                <>
                  <img src={qrCodeData} alt="QR Code billet" className="qr-code-image" />
                  <p className="qr-code-caption">📱 Scannez ce QR Code à l'entrée</p>
                </>
              ) : (
                <p>Génération du QR Code...</p>
              )}
            </div>

            <div className="purchase-actions">
              <button onClick={() => window.print()} className="add-to-cart-btn">🖨️ Imprimer le billet</button>
              <button onClick={() => navigate('/my-tickets')} className="add-to-cart-btn">📋 Voir mes billets</button>
              <button onClick={handleContinueShopping} className="add-to-cart-btn">🎫 Autres événements</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Panier vide ---
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h2>Votre panier est vide</h2>
        <p>Explorez nos événements et ajoutez des billets à votre panier.</p>
        <button onClick={handleContinueShopping} className="buy-btn">Découvrir les événements</button>
      </div>
    );
  }

  // --- Panier normal ---
  return (
    <div className="cart-page">
      <div className="cart-header">
        <h2>Votre panier</h2>
        <span className="cart-count">{items.length} article(s)</span>
      </div>

      <div className="cart-items">
        {items.map((item, index) => (
          <div key={`${item.eventId}-${item.offerTypeId}-${index}`} className="cart-item">
            <div className="item-details">
              <h3>{item.eventTitle}</h3>
              <p className="item-offer">{item.offerName}</p>
              <div className="item-info">
                <span className="event-price">Prix unitaire: {item.priceUnit?.toFixed(2)} €</span>
                <span className="event-tickets">Quantité: {item.quantity}</span>
              </div>
              <div className="total-price">Sous-total: {(item.priceUnit * item.quantity).toFixed(2)} €</div>
            </div>
            <button
              onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)}
              className="remove-btn"
              disabled={loading}
              aria-label="Supprimer cet article"
            >×</button>
          </div>
        ))}
      </div>

      <div className="total-section">
        <span>Total :</span>
        <span className="event-price">{totalPrice.toFixed(2)} €</span>
      </div>

      <div className="purchase-actions">
        <button onClick={handleValidateOrder} disabled={loading} className="add-to-cart-btn">
          {loading ? "Traitement..." : "✅ Valider la commande"}
        </button>
        <button onClick={handleContinueShopping} disabled={loading} className="buy-btn">🛍️ Continuer mes achats</button>
        <button onClick={handleClearCart} disabled={loading} className="cancel-button">🗑️ Vider le panier</button>
      </div>
    </div>
  );
}

export default CartPage;
