import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';

function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
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

  // Générer le QR Code
  const generateQRCode = useCallback(async (orderData) => {
    try {
      const qrContent = {
        orderId: orderData.orderNumber,
        events: orderData.items.map(item => ({
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          offerType: item.offerName,
          quantity: item.quantity,
          price: item.priceUnit
        })),
        total: orderData.total,
        purchaseDate: orderData.purchaseDate,
        verification: btoa(`${orderData.orderNumber}-${orderData.purchaseDate}`).slice(0, 12)
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
      console.error('❌ Erreur génération QR Code:', error);
      return null;
    }
  }, []);

  // Sauvegarder les billets dans le localStorage
  const saveTicketsToLocalStorage = useCallback((orderData, qrCode) => {
    try {
      const ticketData = {
        id: orderData.orderNumber,
        orderNumber: orderData.orderNumber,
        purchaseDate: orderData.purchaseDate,
        items: orderData.items,
        total: orderData.total,
        qrCode: qrCode,
        sessionId: orderData.paymentSessionId,
        status: 'active'
      };

      const existingTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
      existingTickets.push(ticketData);
      localStorage.setItem('olympics_tickets', JSON.stringify(existingTickets));
      
      console.log('💾 Billet sauvegardé localement');
    } catch (error) {
      console.error('❌ Erreur sauvegarde billet:', error);
    }
  }, []);

  // Fonction de succès de paiement
  const handlePaymentSuccess = useCallback(async (sessionId) => {
    setLoading(true);
    
    try {
      const orderData = {
        orderNumber: generateOrderNumber(),
        items: items,
        total: totalPrice,
        paymentSessionId: sessionId,
        purchaseDate: new Date().toISOString()
      };

      const qrCode = await generateQRCode(orderData);
      
      if (qrCode) {
        setQrCodeData(qrCode);
        setOrderNumber(orderData.orderNumber);
        setOrderSuccess(true);
        saveTicketsToLocalStorage(orderData, qrCode);
        clearCart();
        
        console.log('✅ Billet généré avec succès:', orderData.orderNumber);
      } else {
        throw new Error('Erreur génération QR Code');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Paiement confirmé mais erreur lors de la génération du billet');
    } finally {
      setLoading(false);
    }
  }, [items, totalPrice, generateOrderNumber, generateQRCode, saveTicketsToLocalStorage, clearCart]);

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
        // Redirection vers Stripe
        window.location.href = data.url;
      } else {
        // Cas paiement direct (gratuit)
        const orderData = {
          orderNumber: generateOrderNumber(),
          items: items,
          total: totalPrice,
          purchaseDate: new Date().toISOString()
        };

        const qrCode = await generateQRCode(orderData);
        if (qrCode) {
          setQrCodeData(qrCode);
          setOrderNumber(orderData.orderNumber);
          setOrderSuccess(true);
          saveTicketsToLocalStorage(orderData, qrCode);
          clearCart();
        }
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
    ticketItem: {
      margin: "10px 0",
      padding: "10px",
      backgroundColor: "white",
      borderRadius: "6px",
    },
    actions: {
      marginTop: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      alignItems: "center",
    },
    printBtn: {
      ...buttonStyle,
      backgroundColor: "#7c3aed",
      color: "white",
    },
    ticketsBtn: {
      ...buttonStyle,
      backgroundColor: "#f59e0b",
      color: "white",
    },
    continueBtn: {
      ...buttonStyle,
      backgroundColor: "#3b82f6",
      color: "white",
    },
    validateBtn: {
      ...buttonStyle,
      backgroundColor: "#16a34a",
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
  };

  // Rendu succès commande
  if (orderSuccess) {
    return (
      <div style={styles.container}>
        <div style={styles.successContainer}>
          <div style={styles.successMessage}>
            ✅ Paiement confirmé ! Votre commande est validée.
          </div>
          
          <p><strong>Numéro de commande :</strong> {orderNumber}</p>
          <p><strong>Date d'achat :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
          
          <p>Présentez ce QR Code à l'entrée de l'événement :</p>
          
          <div style={styles.qrCodeContainer}>
            {qrCodeData ? (
              <img 
                src={qrCodeData} 
                alt="QR Code pour l'entrée" 
                style={styles.qrCodeImage}
              />
            ) : (
              <p>Génération du QR Code...</p>
            )}
          </div>
          
          <div style={styles.ticketInfo}>
            <h3>Détails de votre commande :</h3>
            {items.map((item, index) => (
              <div key={index} style={styles.ticketItem}>
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
            <button onClick={() => window.print()} style={styles.printBtn}>
              🖨️ Imprimer le billet
            </button>
            <button 
              onClick={() => navigate('/my-tickets')} 
              style={styles.ticketsBtn}
            >
              📋 Voir tous mes billets
            </button>
            <button onClick={handleContinueShopping} style={styles.continueBtn}>
              🎫 Découvrir d'autres événements
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
        <h2 style={styles.title}>Votre panier est vide</h2>
        <p>Explorez nos événements et ajoutez des billets à votre panier.</p>
        <button onClick={handleContinueShopping} style={styles.continueBtn}>
          Découvrir les événements
        </button>
      </div>
    );
  }

  // Rendu panier normal
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