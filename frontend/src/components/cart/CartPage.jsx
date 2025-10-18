import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { ticketService } from '../services/ticketService';



function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const API_URL = "https://projet-bloc3.onrender.com";

  // Calcul du total
  const totalPrice = items.reduce(
    (acc, item) => acc + (item.priceUnit || 0) * (item.quantity || 0),
    0
  );

  // Générer un numéro de commande unique
  const generateOrderNumber = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `CMD-${timestamp}-${random}`;
  }, []);

  // Générer le QR Code avec la clé finale sécurisée
  const generateSecureQRCode = useCallback(async (ticketData) => {
    try {
      const qrContent = {
        ticketId: ticketData.ticketId,
        finalKey: ticketData.finalKey,
        orderNumber: ticketData.orderNumber,
        events: ticketData.items.map(item => ({
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          offerType: item.offerName,
          quantity: item.quantity,
          price: item.priceUnit
        })),
        total: ticketData.total,
        purchaseDate: ticketData.purchaseDate,
        securityHash: btoa(`${ticketData.finalKey}-${ticketData.purchaseDate}`).slice(0, 16)
      };

      const qrText = JSON.stringify(qrContent);
      const qrCodeImage = await QRCode.toDataURL(qrText, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeImage;
    } catch (error) {
      console.error('❌ Erreur génération QR Code sécurisé:', error);
      return null;
    }
  }, []);

  // Sauvegarder les billets avec les clés sécurisées
  const saveTicketsToLocalStorage = useCallback((ticketData, qrCode) => {
    try {
      const secureTicketData = {
        id: ticketData.ticketId,
        ticketId: ticketData.ticketId,
        orderNumber: ticketData.orderNumber,
        purchaseDate: ticketData.purchaseDate,
        items: ticketData.items,
        total: ticketData.total,
        firstKey: ticketData.firstKey,
        secondKey: ticketData.secondKey,
        finalKey: ticketData.finalKey,
        qrCode: qrCode,
        sessionId: ticketData.paymentSessionId,
        status: 'active',
        securityLevel: 'high'
      };

      const existingTickets = JSON.parse(localStorage.getItem('olympics_secure_tickets') || '[]');
      existingTickets.push(secureTicketData);
      localStorage.setItem('olympics_secure_tickets', JSON.stringify(existingTickets));
      
      console.log('💾 Billet sécurisé sauvegardé localement');
    } catch (error) {
      console.error('❌ Erreur sauvegarde billet sécurisé:', error);
    }
  }, []);

  // Fonction de succès de paiement avec double clé
  const handlePaymentSuccess = useCallback(async (sessionId) => {
    setLoading(true);
    
    try {
      console.log('🔄 Création du ticket sécurisé avec double clé...');
      
      const purchaseResponse = await ticketService.purchaseTickets(items, totalPrice);
      
      const { 
        ticketId, 
        firstKey, 
        secondKey, 
        finalKey
      } = purchaseResponse;

      console.log('🔑 Clés générées:', { firstKey, secondKey, finalKey });

      const orderData = {
        ticketId: ticketId || generateOrderNumber(),
        orderNumber: generateOrderNumber(),
        items: items,
        total: totalPrice,
        paymentSessionId: sessionId,
        purchaseDate: new Date().toISOString(),
        firstKey: firstKey || 'key1-' + Math.random().toString(36).substring(2, 10),
        secondKey: secondKey || 'key2-' + Math.random().toString(36).substring(2, 10),
        finalKey: finalKey || 'final-' + Math.random().toString(36).substring(2, 20)
      };

      const qrCode = await generateSecureQRCode(orderData);
      
      if (qrCode) {
        setQrCodeData(qrCode);
        setOrderNumber(orderData.orderNumber);
        setTicketDetails({
          ticketId: orderData.ticketId,
          firstKey: orderData.firstKey,
          secondKey: orderData.secondKey,
          finalKey: orderData.finalKey
        });
        setOrderSuccess(true);
        saveTicketsToLocalStorage(orderData, qrCode);
        clearCart();
        
        console.log('✅ Billet sécurisé généré avec succès');
      } else {
        throw new Error('Erreur génération QR Code sécurisé');
      }
    } catch (error) {
      console.error('❌ Erreur génération ticket sécurisé:', error);
      alert('Paiement confirmé mais erreur lors de la génération du billet sécurisé');
    } finally {
      setLoading(false);
    }
  }, [items, totalPrice, generateOrderNumber, generateSecureQRCode, saveTicketsToLocalStorage, clearCart]);

  // Vérifier le retour de Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      handlePaymentSuccess(sessionId);
    }
  }, [searchParams, handlePaymentSuccess]);

  // Validation commande
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

      if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Cas paiement direct
        handlePaymentSuccess('direct-payment');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      alert(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // Autres fonctions
  const handleContinueShopping = () => {
    navigate('/public-events');
  };

  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider tout le panier ?")) clearCart();
  };

  const handleRemoveItem = (eventId, offerTypeId) => {
    if (window.confirm("Voulez-vous retirer cet article du panier ?")) {
      removeItem(eventId, offerTypeId);
    }
  };

  // Styles
  const buttonStyle = {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    transition: "all 0.3s ease",
    margin: "5px"
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
    successContainer: {
      textAlign: "center",
      padding: "40px 20px",
    },
    successMessage: {
      color: "#16a34a",
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "20px",
    },
    qrCodeContainer: {
      margin: "20px 0",
      padding: "20px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      display: "inline-block",
    },
    qrCodeImage: {
      width: "300px",
      height: "300px",
      borderRadius: "8px",
    },
    ticketInfo: {
      margin: "20px 0",
      padding: "15px",
      backgroundColor: "#f1f5f9",
      borderRadius: "8px",
      textAlign: "left",
    },
    securityDetails: {
      margin: '15px 0',
      padding: '15px',
      backgroundColor: '#f0f9ff',
      border: '2px solid #0ea5e9',
      borderRadius: '8px',
      textAlign: 'left'
    },
    actions: {
      marginTop: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      alignItems: "center",
    }
  };

  // Rendu succès commande
  if (orderSuccess) {
    return (
      <div style={styles.container}>
        <div style={styles.successContainer}>
          <div style={styles.successMessage}>
            ✅ Paiement confirmé ! Votre billet sécurisé est généré.
          </div>
          
          <p><strong>Numéro de commande :</strong> {orderNumber}</p>
          <p><strong>Date d'achat :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
          
          {ticketDetails && (
            <div style={styles.securityDetails}>
              <h4 style={{ color: '#0369a1', marginBottom: '10px' }}>🔐 Détails de Sécurité</h4>
              <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                <div><strong>Ticket ID:</strong> {ticketDetails.ticketId}</div>
                <div><strong>Clé Finale:</strong> {ticketDetails.finalKey?.substring(0, 16)}...</div>
              </div>
            </div>
          )}
          
          <p>Présentez ce QR Code sécurisé à l'entrée :</p>
          
          <div style={styles.qrCodeContainer}>
            {qrCodeData ? (
              <img src={qrCodeData} alt="QR Code sécurisé" style={styles.qrCodeImage} />
            ) : (
              <p>Génération du QR Code...</p>
            )}
          </div>
          
          <div style={styles.ticketInfo}>
            <h3>Détails de votre commande :</h3>
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

          <div style={styles.actions}>
            <button onClick={() => window.print()} style={buttonStyle}>
              🖨️ Imprimer le billet
            </button>
            <button onClick={() => navigate('/my-tickets')} style={buttonStyle}>
              📋 Voir mes billets
            </button>
            <button onClick={handleContinueShopping} style={buttonStyle}>
              🎫 Autres événements
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rendu panier vide
  if (items.length === 0) {
    return (
      <div style={styles.container}>
        <h2>Votre panier est vide</h2>
        <p>Explorez nos événements et ajoutez des billets à votre panier.</p>
        <button onClick={handleContinueShopping} style={buttonStyle}>
          Découvrir les événements
        </button>
      </div>
    );
  }

  // Rendu panier normal
  return (
    <div style={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Votre panier</h2>
        <span>{items.length} article(s)</span>
      </div>

      <div>
        {items.map((item, index) => (
          <div key={index} style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "15px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3>{item.eventTitle}</h3>
              <p>{item.offerName}</p>
              <div>
                Quantité: {item.quantity} | Prix unitaire: {item.priceUnit?.toFixed(2)} €
              </div>
              <div>
                Sous-total: {(item.priceUnit * item.quantity).toFixed(2)} €
              </div>
            </div>
            <button
              onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)}
              disabled={loading}
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
        <button onClick={handleValidateOrder} disabled={loading} style={buttonStyle}>
          {loading ? "Traitement..." : "✅ Valider la commande"}
        </button>
        <button onClick={handleContinueShopping} disabled={loading} style={buttonStyle}>
          🛍️ Continuer mes achats
        </button>
        <button onClick={handleClearCart} disabled={loading} style={buttonStyle}>
          🗑️ Vider le panier
        </button>
      </div>
    </div>
  );
}

export default CartPage;