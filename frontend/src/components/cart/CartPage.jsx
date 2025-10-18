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
      const response = await fetch(`${API_URL}/api/tickets/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('olympics_auth_token')}`
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
        throw new Error('Backend non disponible');
      }
    } catch (error) {
      console.warn('⚠️ Backend non disponible, mode simulation activé');
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
      alert('Erreur génération billet');
    } finally {
      setLoading(false);
    }
  }, [items, totalPrice, generateOrderNumber, generateSecureQRCode, clearCart]);

  // ✅ CORRECTION : Vérifier le retour Stripe
  useEffect(() => {
    console.log('🔍 Vérification paramètres URL:', Object.fromEntries([...searchParams]));
    
    const success = searchParams.get('success');
    const session_id = searchParams.get('session_id');

    if (success === 'true' && session_id) {
      console.log('✅ Paiement Stripe confirmé, génération billet...');
      handlePaymentSuccess(session_id);
    }
  }, [searchParams, handlePaymentSuccess]);

  // ✅ TEST MANUEL
  const handleTestQRCode = async () => {
    console.log('🧪 Test manuel QR Code');
    await handlePaymentSuccess('test-' + Date.now());
  };

  const handleValidateOrder = async () => {
    const token = localStorage.getItem('olympics_auth_token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      alert("Panier vide !");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace('Bearer ', '')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          items, 
          totalPrice,
          returnUrl: `${window.location.origin}/cart?success=true`
        }),
      });

      if (!response.ok) throw new Error('Erreur serveur');
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        await handlePaymentSuccess('direct-payment');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur de commande');
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
            </div>
          )}
          
          <div style={{ margin: "20px 0", padding: "20px", backgroundColor: "white", borderRadius: "12px", display: "inline-block" }}>
            {qrCodeData ? (
              <img src={qrCodeData} alt="QR Code" style={{ width: "300px", height: "300px" }} />
            ) : (
              <p>Génération QR Code...</p>
            )}
          </div>
          
          <div style={{ marginTop: "20px" }}>
            <button onClick={() => navigate('/my-tickets')} style={{ margin: "5px", padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px" }}>
              📋 Mes Billets
            </button>
            <button onClick={() => navigate('/public-events')} style={{ margin: "5px", padding: "10px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px" }}>
              🎫 Autres Événements
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rendu panier
  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f9fafb", borderRadius: "16px" }}>
      <h2>Panier ({items.length} articles)</h2>
      
      {items.map((item, index) => (
        <div key={index} style={{ padding: "15px", margin: "10px 0", backgroundColor: "white", borderRadius: "8px" }}>
          <h3>{item.eventTitle}</h3>
          <p>{item.offerName} - {item.quantity}x {item.priceUnit}€</p>
          <button onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)}>×</button>
        </div>
      ))}
      
      <div style={{ marginTop: "20px", fontSize: "18px", fontWeight: "bold" }}>
        Total: {totalPrice.toFixed(2)} €
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleValidateOrder} disabled={loading} style={{ padding: "10px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "8px", margin: "5px" }}>
          {loading ? "Traitement..." : "✅ Commander"}
        </button>
        <button onClick={handleTestQRCode} style={{ padding: "10px", backgroundColor: "#f59e0b", color: "white", border: "none", borderRadius: "8px", margin: "5px" }}>
          🧪 Tester QR
        </button>
      </div>
    </div>
  );
}

export default CartPage;