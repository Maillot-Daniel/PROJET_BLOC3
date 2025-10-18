import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';

// ✅ URL dynamique selon l'environnement
const API_URL = process.env.REACT_APP_API_URL || "https://projet-bloc3.onrender.com";

// Service temporaire
const ticketService = {
  async purchaseTickets(cartItems, totalAmount) {
    console.log('🛒 Génération de clés sécurisées...');
    
    try {
      // ✅ Essayer d'appeler le backend réel
      const token = localStorage.getItem('olympics_auth_token');
      const response = await fetch(`${API_URL}/api/tickets/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token.replace('Bearer ', '')}` })
        },
        body: JSON.stringify({
          cartItems,
          totalAmount,
          purchaseDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend response:', data);
        return data;
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.warn('⚠️ Backend non disponible, mode simulation activé:', error.message);
      // Fallback simulation
      return {
        ticketId: 'TKT-' + Date.now(),
        firstKey: 'key1-' + Math.random().toString(36).substring(2, 15),
        secondKey: 'key2-' + Math.random().toString(36).substring(2, 15),
        finalKey: 'final-' + Math.random().toString(36).substring(2, 20),
      };
    }
  }
};

function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Calcul du total
  const totalPrice = items.reduce((acc, item) => acc + (item.priceUnit || 0) * (item.quantity || 0), 0);

  const generateOrderNumber = useCallback(() => {
    return `CMD-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }, []);

  const generateSecureQRCode = useCallback(async (ticketData) => {
    try {
      console.log('🎫 Génération QR Code...');
      
      const qrContent = {
        ticketId: ticketData.ticketId,
        finalKey: ticketData.finalKey,
        orderNumber: ticketData.orderNumber,
        events: ticketData.items,
        total: ticketData.total,
        purchaseDate: ticketData.purchaseDate
      };

      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), {
        width: 300,
        margin: 2
      });
      
      return qrCodeImage;
    } catch (error) {
      console.error('❌ Erreur QR Code:', error);
      return null;
    }
  }, []);

  const handlePaymentSuccess = useCallback(async (sessionId) => {
    setLoading(true);
    console.log('🚀 Génération billet pour session:', sessionId);
    
    try {
      const purchaseResponse = await ticketService.purchaseTickets(items, totalPrice);
      const { ticketId, firstKey, secondKey, finalKey } = purchaseResponse;

      const orderData = {
        ticketId,
        orderNumber: generateOrderNumber(),
        items,
        total: totalPrice,
        paymentSessionId: sessionId,
        purchaseDate: new Date().toISOString(),
        firstKey,
        secondKey,
        finalKey
      };

      const qrCode = await generateSecureQRCode(orderData);
      
      if (qrCode) {
        setQrCodeData(qrCode);
        setOrderNumber(orderData.orderNumber);
        setTicketDetails({ ticketId, finalKey });
        setOrderSuccess(true);
        
        // Sauvegarde locale
        const secureTicketData = {
          ...orderData,
          qrCode,
          status: 'active'
        };
        const existingTickets = JSON.parse(localStorage.getItem('olympics_secure_tickets') || '[]');
        existingTickets.push(secureTicketData);
        localStorage.setItem('olympics_secure_tickets', JSON.stringify(existingTickets));
        
        clearCart();
        console.log('✅ Billet généré avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur génération billet: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [items, totalPrice, generateOrderNumber, generateSecureQRCode, clearCart]);

  // Vérifier le retour Stripe
  useEffect(() => {
    console.log('🔍 Vérification paramètres URL:', Object.fromEntries([...searchParams]));
    
    const success = searchParams.get('success');
    const session_id = searchParams.get('session_id');

    if (success === 'true' && session_id) {
      console.log('✅ Paiement Stripe confirmé, génération billet...');
      handlePaymentSuccess(session_id);
    }
  }, [searchParams, handlePaymentSuccess]);

  // Fonction pour supprimer un article
  const handleRemoveItem = (eventId, offerTypeId) => {
    if (window.confirm("Voulez-vous retirer cet article du panier ?")) {
      removeItem(eventId, offerTypeId);
    }
  };

  // Fonction pour vider le panier
  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider tout le panier ?")) {
      clearCart();
    }
  };

  // Continuer les achats
  const handleContinueShopping = () => {
    navigate('/public-events');
  };

  // TEST MANUEL
  const handleTestQRCode = async () => {
    console.log('🧪 Test manuel QR Code');
    await handlePaymentSuccess('test-' + Date.now());
  };

  // ✅ CORRIGÉ : Validation commande avec meilleure gestion d'erreurs
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
      console.log('🛒 Envoi de la commande au backend...');
      
      // Préparer les données pour le backend
      const cartData = {
        items: items.map(item => ({
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          offerTypeId: item.offerTypeId,
          offerName: item.offerName,
          quantity: item.quantity,
          priceUnit: item.priceUnit
        })),
        totalPrice: totalPrice,
        returnUrl: `${window.location.origin}/cart?success=true`
      };

      console.log('📦 Données envoyées:', cartData);

      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace('Bearer ', '')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cartData),
      });

      console.log('📡 Réponse serveur:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Erreur serveur (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Réponse du backend:', data);

      if (data.url) {
        // Redirection vers Stripe
        console.log('🔗 Redirection vers Stripe:', data.url);
        window.location.href = data.url;
      } else {
        // Paiement direct (gratuit)
        console.log('💰 Paiement direct - génération billet');
        await handlePaymentSuccess('direct-payment');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = "Une erreur est survenue lors de la validation de votre commande.";
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
        localStorage.removeItem('olympics_auth_token');
        navigate('/login');
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Rendu succès
  if (orderSuccess) {
    return (
      <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f9fafb", borderRadius: "16px" }}>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <h2 style={{ color: "#16a34a" }}>✅ Paiement Confirmé !</h2>
          <p><strong>Commande:</strong> {orderNumber}</p>
          
          {ticketDetails && (
            <div style={{ margin: '15px 0', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
              <h4>🔐 Billet Sécurisé</h4>
              <p><small>ID: {ticketDetails.ticketId}</small></p>
              <p><small>Clé: {ticketDetails.finalKey?.substring(0, 20)}...</small></p>
            </div>
          )}
          
          <div style={{ margin: "20px 0", padding: "20px", backgroundColor: "white", borderRadius: "12px", display: "inline-block" }}>
            {qrCodeData ? (
              <div>
                <img src={qrCodeData} alt="QR Code" style={{ width: "300px", height: "300px", borderRadius: "8px" }} />
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  📱 Scannez ce QR Code à l'entrée
                </p>
              </div>
            ) : (
              <p>Génération QR Code...</p>
            )}
          </div>

          {/* Détails de la commande */}
          <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "#f1f5f9", borderRadius: "8px", textAlign: "left" }}>
            <h3>Détails de la commande :</h3>
            {items.map((item, index) => (
              <div key={index} style={{ margin: '10px 0', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <strong>{item.eventTitle}</strong>
                <br />
                {item.offerName} - Quantité: {item.quantity}
                <br />
                Prix: {(item.priceUnit * item.quantity).toFixed(2)} €
              </div>
            ))}
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              Total: {totalPrice.toFixed(2)} €
            </div>
          </div>
          
          <div style={{ marginTop: "20px" }}>
            <button onClick={() => window.print()} style={{ margin: "5px", padding: "10px", backgroundColor: "#7c3aed", color: "white", border: "none", borderRadius: "8px" }}>
              🖨️ Imprimer
            </button>
            <button onClick={() => navigate('/my-tickets')} style={{ margin: "5px", padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px" }}>
              📋 Mes Billets
            </button>
            <button onClick={handleContinueShopping} style={{ margin: "5px", padding: "10px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px" }}>
              🎫 Autres Événements
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rendu panier vide
  if (items.length === 0) {
    return (
      <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f9fafb", borderRadius: "16px", textAlign: "center" }}>
        <h2>Votre panier est vide</h2>
        <p>Explorez nos événements et ajoutez des billets à votre panier.</p>
        <button onClick={handleContinueShopping} style={{ padding: "10px 18px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", margin: "10px" }}>
          Découvrir les événements
        </button>
        
        {/* Bouton de test */}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
          <p style={{ marginBottom: '10px' }}>🧪 <strong>Mode test :</strong></p>
          <button onClick={handleTestQRCode} style={{ padding: "8px 15px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px" }}>
            Tester la génération QR Code
          </button>
        </div>
      </div>
    );
  }

  // Rendu panier normal
  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f9fafb", borderRadius: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Votre panier</h2>
        <span style={{ color: "#64748b" }}>{items.length} article(s)</span>
      </div>

      <div>
        {items.map((item, index) => (
          <div key={index} style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "15px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
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
              disabled={loading}
              style={{ padding: "6px 10px", backgroundColor: "#f87171", color: "#fff", border: "none", borderRadius: "50%", fontSize: "20px", cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "18px", fontWeight: "bold" }}>
        <span>Total :</span>
        <span>{totalPrice.toFixed(2)} €</span>
      </div>

      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={handleValidateOrder} disabled={loading} style={{ padding: "10px 18px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          {loading ? "Traitement..." : "✅ Valider la commande"}
        </button>
        
        <button onClick={handleTestQRCode} disabled={loading} style={{ padding: "8px 15px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          🧪 Tester QR Code
        </button>

        <button onClick={handleContinueShopping} disabled={loading} style={{ padding: "10px 18px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          🛍️ Continuer mes achats
        </button>

        <button onClick={handleClearCart} disabled={loading} style={{ padding: "10px 18px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          🗑️ Vider le panier
        </button>
      </div>
    </div>
  );
}

export default CartPage;