import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [totalAmount, setTotalAmount] = useState("0.00");
  // Supprimé: const [ticketDetails, setTicketDetails] = useState(null);

  const STORAGE_KEY = "oly_tickets";

  // 🔹 FORCER l'email Mailtrap pour tous les envois
  const MAILTRAP_EMAIL = "d0c004224e85f3@inbox.mailtrap.io";

  // ✅ TOUJOURS utiliser Mailtrap comme destinataire
  const getCurrentUser = useCallback(() => {
    return { 
      email: MAILTRAP_EMAIL, 
      name: "Client Jeux Olympiques 2024" 
    };
  }, [MAILTRAP_EMAIL]);

  const currentUser = getCurrentUser();
  const customerEmail = MAILTRAP_EMAIL;

  // ✅ Récupérer les détails de la session Stripe pour avoir le vrai montant
  const fetchStripeSession = useCallback(async (sessionId) => {
    if (!sessionId) return null;
    
    try {
      const API_URL = "https://projet-bloc3.onrender.com";
      const response = await fetch(`${API_URL}/api/payments/session/${sessionId}`);
      
      if (response.ok) {
        const sessionData = await response.json();
        console.log("💰 Données Stripe:", sessionData);
        return sessionData;
      }
    } catch (error) {
      console.error("Erreur récupération session Stripe:", error);
    }
    return null;
  }, []);

  // ✅ Récupérer le panier depuis localStorage pour avoir les détails
  const getCartDetails = useCallback(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("olympics_cart") || "[]");
      console.log("🛒 Panier récupéré:", cart);
      return cart;
    } catch (error) {
      console.error("Erreur lecture panier:", error);
      return [];
    }
  }, []);

  // ✅ Calculer le total réel depuis le panier
  const calculateTotalFromCart = useCallback((cart) => {
    if (!cart || cart.length === 0) return "50.00"; // Fallback
    
    const total = cart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    
    return total.toFixed(2);
  }, []);

  // ✅ Correction de la sauvegarde - AJOUTE aux billets existants
  const saveTicketToStorage = useCallback((ticketData) => {
    try {
      const existingTickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updatedTickets = [...existingTickets, ticketData];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTickets));
      localStorage.setItem("last_user_email", customerEmail);
      console.log("💾 Billet sauvegardé:", ticketData.orderNumber);
      console.log("📋 Total billets:", updatedTickets.length);
    } catch (error) {
      console.error("Erreur sauvegarde billet:", error);
    }
  }, [customerEmail]);

  // ✅ Génération QR code
  const generateQRCodeForTicket = useCallback(async (orderNumber, amount) => {
    try {
      const qrContent = {
        orderId: orderNumber,
        timestamp: Date.now(),
        customer: customerEmail,
        event: "Jeux Olympiques Paris 2024",
        amount: amount,
        currency: "EUR"
      };
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), { 
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });
      return qrCodeImage;
    } catch (error) {
      console.error("Erreur génération QR Code:", error);
      return null;
    }
  }, [customerEmail]);

  // ✅ Télécharger en PDF
  const downloadPDF = async () => {
    const ticketElement = document.getElementById("ticket-pdf");
    if (!ticketElement) {
      console.error("Élément ticket non trouvé");
      return;
    }

    try {
      setStatus("Génération du PDF...");
      
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`billet-olympiques-${orderNumber}.pdf`);
      
      setStatus("PDF téléchargé !");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      setStatus("Erreur lors du téléchargement");
    }
  };

  // ✅ Partage du billet
  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mon billet Olympiques - ${orderNumber}`,
          text: `Voici mon billet pour les Jeux Olympiques Paris 2024! Montant: ${totalAmount}€`,
          url: window.location.href,
        });
        console.log("Billet partagé avec succès");
      } catch (error) {
        console.log("Partage annulé:", error);
      }
    } else {
      console.log("Web Share API non supportée");
      // Fallback: copier le lien
      navigator.clipboard.writeText(window.location.href);
      alert("Lien copié dans le presse-papier !");
    }
  };

  // ✅ Formater la date
  const formatDate = (isoString) => {
    if (!isoString) return "Date non disponible";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleString("fr-FR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  useEffect(() => {
    const generateTicket = async () => {
      setStatus("Création de votre billet...");

      try {
        // Récupérer les détails du paiement
        const cart = getCartDetails();
        const calculatedTotal = calculateTotalFromCart(cart);
        
        let stripeSession = null;
        if (sessionId) {
          stripeSession = await fetchStripeSession(sessionId);
        }

        // Utiliser le montant de Stripe ou du panier
        const finalAmount = stripeSession?.amount_total 
          ? (stripeSession.amount_total / 100).toFixed(2) 
          : calculatedTotal;

        setTotalAmount(finalAmount);
        console.log("💰 Montant final:", finalAmount);

        // Génération numéro de commande unique
        const newOrderNumber = "OLY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        setOrderNumber(newOrderNumber);

        // Génération QR Code avec le vrai montant
        const qrResult = await generateQRCodeForTicket(newOrderNumber, finalAmount);
        setQrCodeData(qrResult);

        const purchaseDateISO = new Date().toISOString();

        // Détails des billets depuis le panier
        const ticketItems = cart.length > 0 ? cart : [
          { 
            eventTitle: "Jeux Olympiques Paris 2024", 
            offerName: "Billet Standard", 
            quantity: 1, 
            priceUnit: finalAmount,
            category: "Sports",
            venue: "Stade de France"
          }
        ];

        // Données du billet
        const ticketData = {
          id: newOrderNumber,
          orderNumber: newOrderNumber,
          sessionId: sessionId || "direct-" + Date.now(),
          qrCode: qrResult,
          status: "active",
          customer: { 
            email: customerEmail, 
            name: currentUser.name 
          },
          purchaseDate: purchaseDateISO,
          total: finalAmount,
          items: ticketItems,
          stripeSession: stripeSession
        };

        // Supprimé: setTicketDetails(ticketData);

        // Sauvegarde dans localStorage
        saveTicketToStorage(ticketData);

        // ✅ Envoi email VIA MAILTRAP
        try {
          const API_URL = "https://projet-bloc3.onrender.com";
          console.log("📧 Envoi email à Mailtrap...");
          
          const response = await fetch(`${API_URL}/api/email/send-ticket`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              toEmail: customerEmail,
              orderNumber: newOrderNumber,
              qrCodeData: qrResult,
              total: finalAmount,
              purchaseDate: purchaseDateISO,
            }),
          });

          const data = await response.json();
          console.log("📩 Réponse serveur email:", data);

          if (response.ok && data.success) {
            setEmailSent(true);
            console.log("✅ Email envoyé avec succès à Mailtrap");
          } else {
            console.warn("⚠️ Problème envoi email:", data.message);
          }
        } catch (error) {
          console.error("❌ Erreur envoi email:", error);
        }

        // Vider le panier après paiement réussi
        localStorage.removeItem("olympics_cart");
        console.log("🛒 Panier vidé après paiement");

        setLoading(false);
        setStatus("Billet créé avec succès !");

      } catch (error) {
        console.error("❌ Erreur génération billet:", error);
        setStatus("Erreur lors de la création du billet");
        setLoading(false);
      }
    };

    generateTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Les autres dépendances sont gérées via useCallback

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <h2>{status}</h2>
        <div style={{ margin: 20 }}>
          <div style={{ 
            width: 50, 
            height: 50, 
            border: "5px solid #f3f3f3", 
            borderTop: "5px solid #0055A4", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite",
            margin: "0 auto"
          }}></div>
        </div>
        <p>⏳ Préparation de votre billet...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #0055A4 0%, #EF4135 100%)", color: "white", padding: 30, borderRadius: 15, marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: "2.5em" }}>🎉 Paiement Réussi !</h1>
        <p style={{ fontSize: "1.2em", marginTop: 10, opacity: 0.9 }}>Votre billet pour les Jeux Olympiques Paris 2024</p>
      </div>

      {emailSent && (
        <div style={{ 
          background: "#d4edda", 
          color: "#155724", 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 20,
          border: "1px solid #c3e6cb"
        }}>
          <strong>📧 Email envoyé !</strong> Votre billet a été envoyé à {customerEmail}
        </div>
      )}

      {orderNumber && (
        <div style={{ marginBottom: 20 }}>
          <h3>Numéro de commande: <span style={{ color: "#0055A4" }}>{orderNumber}</span></h3>
        </div>
      )}

      {qrCodeData && (
        <div>
          <div 
            id="ticket-pdf" 
            style={{ 
              border: "3px solid #0055A4", 
              padding: 30, 
              display: "inline-block",
              background: "white",
              borderRadius: 12,
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
              textAlign: "center",
              marginBottom: 20
            }}
          >
            <div style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: 20, marginBottom: 20 }}>
              <h2 style={{ color: "#0055A4", margin: "0 0 10px 0" }}>🎫 Votre Billet Numérique</h2>
              <p style={{ color: "#666", margin: 0 }}>Jeux Olympiques Paris 2024</p>
            </div>
            
            <img 
              src={qrCodeData} 
              alt="QR Code" 
              style={{ 
                width: 250, 
                height: 250,
                border: "1px solid #ddd",
                borderRadius: 8
              }} 
            />
            
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: "1.1em", margin: "10px 0" }}>
                <strong>📅 Date d'achat:</strong> {formatDate(new Date().toISOString())}
              </p>
              <p style={{ fontSize: "1.1em", margin: "10px 0" }}>
                <strong>💰 Total payé:</strong> <span style={{ color: "#EF4135", fontWeight: "bold" }}>{totalAmount} €</span>
              </p>
              <p style={{ fontSize: "1.1em", margin: "10px 0" }}>
                <strong>📋 Commande:</strong> {orderNumber}
              </p>
            </div>
            
            <div style={{ 
              background: "#f8f9fa", 
              padding: 15, 
              borderRadius: 8, 
              marginTop: 20,
              borderLeft: "4px solid #28a745"
            }}>
              <p style={{ margin: 0, color: "#155724" }}>
                <strong>✅ Présentez ce QR code à l'entrée</strong>
              </p>
            </div>
          </div>

          <div style={{ marginTop: 30 }}>
            <button 
              onClick={downloadPDF} 
              style={{ 
                padding: "12px 25px", 
                margin: 5, 
                backgroundColor: "#0055A4",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "1em",
                fontWeight: "bold"
              }}
            >
              🖨️ Télécharger PDF
            </button>
            
            <button 
              onClick={shareTicket} 
              style={{ 
                padding: "12px 25px", 
                margin: 5, 
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "1em",
                fontWeight: "bold"
              }}
            >
              📤 Partager
            </button>
          </div>

          {status && (
            <div style={{ marginTop: 15 }}>
              <p style={{ color: "#0055A4", fontStyle: "italic" }}>{status}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 40, padding: 20, background: "#f8f9fa", borderRadius: 8 }}>
        <h3>📱 Prochaines étapes</h3>
        <ul style={{ textAlign: "left", maxWidth: 500, margin: "0 auto" }}>
          <li>Conservez ce billet en sécurité</li>
          <li>Le QR code sera scanné à l'entrée</li>
          <li>Présentez une pièce d'identité avec le billet</li>
          <li>Vérifiez vos emails pour le reçu</li>
        </ul>
      </div>
    </div>
  );
}

export default SuccessPage;