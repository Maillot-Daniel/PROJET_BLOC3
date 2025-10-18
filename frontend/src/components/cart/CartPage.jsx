import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

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
        returnUrl: `${window.location.origin}/cart?success=true` // Important pour Stripe
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
        window.location.href = data.url; // redirection Stripe
      } else {
        console.log('💰 [VALIDATION] Paiement direct - Génération QR Code');
        // Paiement direct - Générer QR Code
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
    testBtn: {
      ...buttonStyle,
      backgroundColor: "#f59e0b",
      color: "#fff",
    },
  };

  // ✅ RENDU SUCCÈS AVEC QR CODE
  if (orderSuccess) {
    console.log('🎉 [RENDU] Affichage écran succès - orderNumber:', orderNumber, 'qrCodeData:', !!qrCodeData);
    
    return (
      <div style={styles.container}>
        <div style={styles.successContainer}>
          <div style={styles.successMessage}>
            ✅ Paiement confirmé ! Votre billet est prêt.
          </div>
          
          <p><strong>Numéro de commande :</strong> {orderNumber}</p>
          <p><strong>Date d'achat :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
          
          <p>Présentez ce QR Code à l'entrée :</p>
          
          <div style={styles.qrCodeContainer}>
            {qrCodeData ? (
              <div>
                <img 
                  src={qrCodeData} 
                  alt="QR Code billet" 
                  style={styles.qrCodeImage}
                />
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  📱 Scannez ce QR Code à l'entrée
                </p>
              </div>
            ) : (
              <p>Génération du QR Code...</p>
            )}
          </div>

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <button onClick={() => window.print()} style={styles.testBtn}>
              🖨️ Imprimer le billet
            </button>
            <button onClick={() => navigate('/my-tickets')} style={styles.continueBtn}>
              📋 Voir mes billets
            </button>
            <button onClick={handleContinueShopping} style={styles.continueBtn}>
              🎫 Autres événements
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Rendu panier normal ---
  if (items.length === 0) {
    console.log('🛒 [RENDU] Panier vide');
    
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Votre panier est vide</h2>
        <p>Explorez nos événements et ajoutez des billets à votre panier.</p>
        <button onClick={handleContinueShopping} style={styles.continueBtn}>
          Découvrir les événements
        </button>
        
        {/* Section test même avec panier vide */}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
          <p style={{ marginBottom: '10px' }}>🧪 <strong>Mode debug :</strong></p>
          <button onClick={handleTestQRCode} style={styles.testBtn}>
            Tester génération QR Code
          </button>
        </div>
      </div>
    );
  }

  console.log('🛒 [RENDU] Panier normal -', items.length, 'articles');
  
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

        {/* ✅ BOUTON TEST QR CODE */}
        <button onClick={handleTestQRCode} disabled={loading} style={styles.testBtn}>
          🧪 Tester QR Code (Debug)
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