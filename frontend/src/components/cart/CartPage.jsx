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

  console.log('🔍 [RENDU] CartPage - items:', items, 'orderSuccess:', orderSuccess, 'qrCodeData:', !!qrCodeData);

  // ✅ NOUVELLE FONCTION: Sauvegarder le panier avant paiement
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
    console.log('💾 Panier sauvegardé pour commande:', cartData);
  };

  // ✅ FONCTION POUR GÉNÉRER QR CODE AVEC LOGS
  const generateQRCodeForTicket = async (orderData) => {
    console.log('🎫 [QRCODE] Début génération QR Code', orderData);
    
    try {
      // Générer deux clés simples
      const firstKey = 'key1-' + Math.random().toString(36).substring(2, 10);
      const secondKey = 'key2-' + Math.random().toString(36).substring(2, 10);
      const finalKey = firstKey + secondKey; // Concaténation

      console.log('🔑 [QRCODE] Clés générées:', { firstKey, secondKey, finalKey });

      const qrContent = {
        orderId: orderData.orderNumber,
        finalKey: finalKey,
        events: orderData.items,
        total: orderData.total,
        purchaseDate: orderData.purchaseDate
      };

      console.log('📝 [QRCODE] Contenu pour QR:', qrContent);

      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), {
        width: 300,
        margin: 2
      });
      
      console.log('✅ [QRCODE] QR Code généré avec succès');
      return { qrCodeImage, finalKey };
    } catch (error) {
      console.error('❌ [QRCODE] Erreur génération QR:', error);
      return null;
    }
  };

  // ✅ FONCTION SUCCÈS AVEC QR CODE
  const handleOrderSuccess = async (orderData) => {
    console.log('🚀 [SUCCES] Début handleOrderSuccess', orderData);
    
    const qrResult = await generateQRCodeForTicket(orderData);
    
    if (qrResult) {
      console.log('💾 [SUCCES] QR généré, sauvegarde...');
      
      setQrCodeData(qrResult.qrCodeImage);
      setOrderNumber(orderData.orderNumber);
      setOrderSuccess(true);
      
      // Sauvegarder le billet
      const ticketData = {
        ...orderData,
        qrCode: qrResult.qrCodeImage,
        finalKey: qrResult.finalKey,
        status: 'active'
      };
      
      const existingTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
      existingTickets.push(ticketData);
      localStorage.setItem('olympics_tickets', JSON.stringify(existingTickets));
      
      console.log('💾 [SUCCES] Billet sauvegardé dans localStorage');
      clearCart();
    } else {
      console.error('❌ [SUCCES] Échec génération QR Code');
    }
  };

  // --- Validation commande ---
  const handleValidateOrder = async () => {
    console.log('🛒 [VALIDATION] Début handleValidateOrder');
    const token = localStorage.getItem('olympics_auth_token');

    if (!token) {
      console.log('🔐 [VALIDATION] Pas de token, redirection login');
      alert('Veuillez vous connecter pour valider votre commande');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      console.log('🛒 [VALIDATION] Panier vide');
      alert("Votre panier est vide !");
      return;
    }

    setLoading(true);
    console.log('⏳ [VALIDATION] Loading activé');

    // ✅ SAUVEGARDE DU PANIER AVANT PAIEMENT
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

      console.log('📦 [VALIDATION] Données envoyées:', cartBody);

      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace('Bearer ', '')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cartBody),
      });

      console.log('📡 [VALIDATION] Réponse serveur:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [VALIDATION] Erreur serveur:', response.status, errorText);
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ [VALIDATION] Réponse backend:', data);

      if (data.url) {
        console.log('🔗 [VALIDATION] Redirection vers Stripe:', data.url);
        window.location.href = data.url;
      } else {
        console.log('💰 [VALIDATION] Paiement direct - Génération QR Code');
        const orderData = {
          orderNumber: 'CMD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          items: items,
          total: totalPrice,
          purchaseDate: new Date().toISOString()
        };
        
        await handleOrderSuccess(orderData);
      }
    } catch (error) {
      console.error('❌ [VALIDATION] Erreur lors de la validation:', error);
      alert(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
      console.log('⏳ [VALIDATION] Loading désactivé');
    }
  };

  // --- Autres actions panier ---
  const handleContinueShopping = () => {
    console.log('🛍️ [ACTION] Continuer les achats');
    navigate('/public-events');
  };

  const handleClearCart = () => {
    console.log('🗑️ [ACTION] Vider le panier');
    if (window.confirm("Voulez-vous vraiment vider tout le panier ?")) clearCart();
  };

  const handleRemoveItem = (eventId, offerTypeId) => {
    console.log('❌ [ACTION] Supprimer article:', eventId, offerTypeId);
    if (window.confirm("Voulez-vous retirer cet article du panier ?")) {
      removeItem(eventId, offerTypeId);
    }
  };

  // ✅ TEST MANUEL DU QR CODE
  const handleTestQRCode = async () => {
    console.log('🧪 [TEST] Début test QR Code manuel');
    setLoading(true);
    
    try {
      const orderData = {
        orderNumber: 'TEST-' + Date.now(),
        items: items,
        total: totalPrice,
        purchaseDate: new Date().toISOString()
      };
      console.log('🧪 [TEST] Données de test:', orderData);
      await handleOrderSuccess(orderData);
    } catch (error) {
      console.error('❌ [TEST] Erreur test QR:', error);
    } finally {
      setLoading(false);
      console.log('🧪 [TEST] Test terminé');
    }
  };

  // ✅ RENDU SUCCÈS AVEC QR CODE
  if (orderSuccess) {
    console.log('🎉 [RENDU] Affichage écran succès - orderNumber:', orderNumber, 'qrCodeData:', !!qrCodeData);
    
    return (
      <div className="cart-page">
        <div className="success-modal">
          <div className="purchase-content">
            <div className="success-message">
              ✅ Paiement confirmé ! Votre billet est prêt.
            </div>
            
            <div className="order-info">
              <p><strong>Numéro de commande :</strong> {orderNumber}</p>
              <p><strong>Date d'achat :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <p>Présentez ce QR Code à l'entrée :</p>
            
            <div className="qr-code-container">
              {qrCodeData ? (
                <div>
                  <img 
                    src={qrCodeData} 
                    alt="QR Code billet" 
                    className="qr-code-image"
                  />
                  <p className="qr-code-caption">
                    📱 Scannez ce QR Code à l'entrée
                  </p>
                </div>
              ) : (
                <p>Génération du QR Code...</p>
              )}
            </div>

            <div className="purchase-actions">
              <button onClick={() => window.print()} className="add-to-cart-btn">
                🖨️ Imprimer le billet
              </button>
              <button onClick={() => navigate('/my-tickets')} className="add-to-cart-btn">
                📋 Voir mes billets
              </button>
              <button onClick={handleContinueShopping} className="add-to-cart-btn">
                🎫 Autres événements
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Rendu panier normal ---
  if (items.length === 0) {
    console.log('🛒 [RENDU] Panier vide');
    
    return (
      <div className="cart-page">
        <h2>Votre panier est vide</h2>
        <p>Explorez nos événements et ajoutez des billets à votre panier.</p>
        <button onClick={handleContinueShopping} className="buy-btn">
          Découvrir les événements
        </button>
        
        {/* Section test même avec panier vide */}
        <div className="debug-section">
          <p>🧪 <strong>Mode debug :</strong></p>
          <button onClick={handleTestQRCode} className="test-btn">
            Tester génération QR Code
          </button>
        </div>
      </div>
    );
  }

  console.log('🛒 [RENDU] Panier normal -', items.length, 'articles');
  
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
              <div className="total-price">
                Sous-total: {(item.priceUnit * item.quantity).toFixed(2)} €
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)}
              className="remove-btn"
              disabled={loading}
              aria-label="Supprimer cet article"
            >
              ×
            </button>
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

        <button onClick={handleTestQRCode} disabled={loading} className="test-btn">
          🧪 Tester QR Code (Debug)
        </button>

        <button onClick={handleContinueShopping} disabled={loading} className="buy-btn">
          🛍️ Continuer mes achats
        </button>

        <button onClick={handleClearCart} disabled={loading} className="cancel-button">
          🗑️ Vider le panier
        </button>
      </div>
    </div>
  );
}

export default CartPage;