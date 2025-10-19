import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [stripeTotal, setStripeTotal] = useState("0.00");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");

  const STORAGE_KEY = "oly_tickets";

  // ✅ Récupérer le montant réel depuis Stripe
  const fetchStripeSession = useCallback(async (sessionId) => {
    if (!sessionId) return null;
    
    try {
      const API_URL = "https://projet-bloc3.onrender.com";
      const response = await fetch(`${API_URL}/api/payments/session/${sessionId}`);
      
      if (response.ok) {
        const sessionData = await response.json();
        console.log("💰 Données Stripe réelles:", sessionData);
        
        // Mettre à jour le montant total
        if (sessionData.amount_total) {
          const realTotal = (sessionData.amount_total / 100).toFixed(2);
          setStripeTotal(realTotal);
          console.log("💰 Montant Stripe utilisé:", realTotal);
        }
        
        return sessionData;
      }
    } catch (error) {
      console.error("Erreur récupération session Stripe:", error);
    }
    return null;
  }, []);

  // ✅ Générer un QR code unique par événement
  const generateQRCodeForEvent = useCallback(async (orderNumber, event, amount) => {
    try {
      const qrContent = {
        orderId: orderNumber,
        eventId: event.eventId,
        eventTitle: event.eventTitle,
        eventDate: event.eventDate,
        eventLocation: event.eventLocation,
        offerType: event.offerType,
        amount: amount,
        timestamp: Date.now(),
        currency: "EUR"
      };
      
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), { 
        width: 200,
        margin: 2,
        color: {
          dark: "#0055A4",
          light: "#FFFFFF"
        }
      });
      return qrCodeImage;
    } catch (error) {
      console.error("Erreur génération QR Code:", error);
      return null;
    }
  }, []);

  // ✅ Sauvegarde de tous les billets
  const saveTicketsToStorage = useCallback((newTickets) => {
    try {
      const existingTickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updatedTickets = [...existingTickets, ...newTickets];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTickets));
      console.log("💾 Billets sauvegardés:", newTickets.length);
    } catch (error) {
      console.error("Erreur sauvegarde billets:", error);
    }
  }, []);

  // ✅ Envoi email avec tous les billets
  const sendEmail = useCallback(async (orderNumber, tickets, email, totalAmount) => {
    try {
      const API_URL = "https://projet-bloc3.onrender.com";
      
      const emailData = {
        toEmail: email,
        orderNumber: orderNumber,
        tickets: tickets,
        totalAmount: totalAmount
      };
      
      console.log("📤 Envoi email à:", email);
      
      const response = await fetch(`${API_URL}/api/email/send-ticket`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(emailData)
      });

      const data = await response.json();
      console.log("📩 Réponse serveur email:", data);

      return response.ok && data.success;
    } catch (error) {
      console.error("❌ Erreur envoi email:", error);
      return false;
    }
  }, []);

  // ✅ Créer un billet par événement avec regroupement par type
  const generateTickets = useCallback(async () => {
    setStatus("Création de vos billets...");

    try {
      // Récupérer le panier
      const cart = JSON.parse(localStorage.getItem("olympics_cart") || "[]");
      console.log("🛒 Panier récupéré:", cart);

      if (cart.length === 0) {
        console.log("❌ Panier vide - impossible de créer des billets");
        setStatus("Erreur: Panier vide");
        setLoading(false);
        return;
      }

      // Récupérer le montant Stripe si session disponible
      let finalTotal = stripeTotal;
      if (sessionId) {
        const stripeSession = await fetchStripeSession(sessionId);
        if (stripeSession?.amount_total) {
          finalTotal = (stripeSession.amount_total / 100).toFixed(2);
          setStripeTotal(finalTotal);
        }
      }

      const orderNumber = "OLY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const purchaseDateISO = new Date().toISOString();
      
      const generatedTickets = [];

      // Regrouper les articles par type d'événement
      const groupedItems = {};
      cart.forEach(item => {
        const key = `${item.eventId}-${item.offerType}`;
        if (!groupedItems[key]) {
          groupedItems[key] = { ...item, quantity: 0 };
        }
        groupedItems[key].quantity += item.quantity;
      });

      // Créer un billet pour chaque groupe
      for (const key in groupedItems) {
        const item = groupedItems[key];
        const qrCode = await generateQRCodeForEvent(orderNumber, item, item.price);
        
        const ticket = {
          id: `${orderNumber}-${item.eventId}-${item.offerType}`,
          orderNumber: orderNumber,
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          eventDate: item.eventDate,
          eventLocation: item.eventLocation,
          offerType: item.offerType,
          quantity: item.quantity,
          price: item.price,
          total: (item.price * item.quantity).toFixed(2),
          qrCode: qrCode,
          purchaseDate: purchaseDateISO,
          status: "active"
        };

        generatedTickets.push(ticket);
        console.log(`🎫 Billet créé pour: ${item.eventTitle} (${item.offerType}) x${item.quantity}`);
      }

      setTickets(generatedTickets);
      
      // Sauvegarder tous les billets
      saveTicketsToStorage(generatedTickets);

      // VIDER le panier après création des billets
      localStorage.removeItem("olympics_cart");
      console.log("🛒 Panier vidé après création des billets");
      
      setLoading(false);
      setStatus("Billets créés avec succès !");

    } catch (error) {
      console.error("❌ Erreur création billets:", error);
      setStatus("Erreur lors de la création des billets");
      setLoading(false);
    }
  }, [sessionId, fetchStripeSession, generateQRCodeForEvent, saveTicketsToStorage, stripeTotal]);

  // ✅ Télécharger un billet spécifique en PDF
  const downloadTicketPDF = async (ticket) => {
    const ticketElement = document.getElementById(`ticket-${ticket.id}`);
    if (!ticketElement) return;

    try {
      setStatus(`Génération PDF pour ${ticket.eventTitle}...`);
      
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
      pdf.save(`billet-${ticket.eventTitle}-${ticket.orderNumber}.pdf`);
      
      setStatus("PDF téléchargé !");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      setStatus("Erreur lors du téléchargement");
    }
  };

  // ✅ IMPRIMER un billet spécifique
  const printTicket = (ticket) => {
    try {
      setStatus(`Préparation impression pour ${ticket.eventTitle}...`);
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Billet - ${ticket.eventTitle}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              text-align: center;
            }
            .ticket { 
              border: 3px solid #0055A4; 
              padding: 25px; 
              max-width: 600px;
              margin: 0 auto;
              border-radius: 12px;
            }
            .event-title { 
              color: #0055A4; 
              font-size: 24px;
              margin-bottom: 10px;
            }
            .event-info { 
              color: #666; 
              margin-bottom: 20px;
            }
            .qr-code { 
              width: 180px; 
              height: 180px;
              border: 1px solid #ddd;
              border-radius: 8px;
              margin: 20px auto;
            }
            .ticket-details { 
              margin: 20px 0;
              text-align: left;
              display: inline-block;
            }
            .important-info {
              background: #f8f9fa;
              padding: 12px;
              border-radius: 6px;
              border-left: 4px solid #28a745;
              margin-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .ticket { border: 2px solid #0055A4; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 15px;">
              <h2 class="event-title">🎫 ${ticket.eventTitle}</h2>
              <p class="event-info">📍 ${ticket.eventLocation} | 📅 ${ticket.eventDate}</p>
            </div>
            
            <img src="${ticket.qrCode}" alt="QR Code" class="qr-code" />
            
            <div class="ticket-details">
              <p><strong>🎯 Type:</strong> ${ticket.offerType}</p>
              <p><strong>📅 Date d'achat:</strong> ${formatDate(ticket.purchaseDate)}</p>
              <p><strong>💰 Prix:</strong> <span style="color: #EF4135; font-weight: bold;">${ticket.total} €</span></p>
              <p><strong>📋 Commande:</strong> ${ticket.orderNumber}</p>
              <p><strong>🎟️ Quantité:</strong> ${ticket.quantity} billet${ticket.quantity > 1 ? 's' : ''}</p>
            </div>
            
            <div class="important-info">
              <p><strong>✅ Présentez ce QR code à l'entrée du ${ticket.eventLocation}</strong></p>
            </div>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          setStatus("Impression terminée !");
          setTimeout(() => setStatus(""), 2000);
        };
      };
      
    } catch (error) {
      console.error("Erreur impression:", error);
      setStatus("Erreur lors de l'impression");
    }
  };

  // ✅ IMPRIMER TOUS les billets
  const printAllTickets = () => {
    try {
      setStatus("Préparation impression de tous les billets...");
      
      const printWindow = window.open('', '_blank');
      let ticketsHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tous mes billets - ${tickets[0]?.orderNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
            }
            .ticket { 
              border: 3px solid #0055A4; 
              padding: 25px; 
              margin-bottom: 30px;
              border-radius: 12px;
              page-break-inside: avoid;
            }
            .event-title { 
              color: #0055A4; 
              font-size: 24px;
              margin-bottom: 10px;
            }
            .qr-code { 
              width: 150px; 
              height: 150px;
              border: 1px solid #ddd;
              border-radius: 8px;
              margin: 15px auto;
            }
            @media print {
              body { margin: 10px; }
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; color: #0055A4;">🎫 Mes Billets Olympiques</h1>
          <p style="text-align: center;"><strong>Commande:</strong> ${tickets[0]?.orderNumber}</p>
          <p style="text-align: center;"><strong>Total payé:</strong> <span style="color: #EF4135;">${stripeTotal} €</span></p>
      `;

      tickets.forEach((ticket, index) => {
        ticketsHTML += `
          <div class="ticket">
            <h2 class="event-title">${ticket.eventTitle}</h2>
            <p><strong>📍 Lieu:</strong> ${ticket.eventLocation}</p>
            <p><strong>📅 Date:</strong> ${ticket.eventDate}</p>
            <p><strong>🎯 Type:</strong> ${ticket.offerType}</p>
            <p><strong>🎟️ Quantité:</strong> ${ticket.quantity}</p>
            <img src="${ticket.qrCode}" alt="QR Code" class="qr-code" />
            <p><em>Présentez ce QR code à l'entrée</em></p>
          </div>
          ${index < tickets.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
        `;
      });

      ticketsHTML += `</body></html>`;
      
      printWindow.document.write(ticketsHTML);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          setStatus("Tous les billets imprimés !");
          setTimeout(() => setStatus(""), 2000);
        };
      };
      
    } catch (error) {
      console.error("Erreur impression multiple:", error);
      setStatus("Erreur lors de l'impression");
    }
  };

  // ✅ Envoyer l'email après validation
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!customerEmail) {
      setStatus("Veuillez entrer une adresse email");
      return;
    }

    setLoading(true);
    setStatus("Envoi de l'email en cours...");
    
    const emailSuccess = await sendEmail(
      tickets[0]?.orderNumber, 
      tickets, 
      customerEmail, 
      stripeTotal
    );
    
    setEmailSent(emailSuccess);
    setLoading(false);
    
    if (emailSuccess) {
      setStatus("Email envoyé avec succès !");
      setShowEmailForm(false);
    } else {
      setStatus("Échec de l'envoi de l'email");
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
    generateTickets();
  }, [generateTickets]);

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
        <p>⏳ Préparation de vos billets...</p>
        <style>
          {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #0055A4 0%, #EF4135 100%)", color: "white", padding: 30, borderRadius: 15, marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: "2.5em" }}>🎉 Paiement Réussi !</h1>
        <p style={{ fontSize: "1.2em", marginTop: 10, opacity: 0.9 }}>
          Vous avez acheté {tickets.length} type{tickets.length > 1 ? 's' : ''} de billet{tickets.length > 1 ? 's' : ''}
        </p>
        <p style={{ fontSize: "1.1em", marginTop: 5 }}>
          <strong>💰 Total payé: {stripeTotal} €</strong>
        </p>
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
          <strong>📧 Email envoyé !</strong> Vos billets ont été envoyés à {customerEmail}
        </div>
      )}

      {tickets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3>Numéro de commande: <span style={{ color: "#0055A4" }}>{tickets[0].orderNumber}</span></h3>
        </div>
      )}

      {/* Boutons d'action globaux */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 30, flexWrap: "wrap" }}>
        <button 
          onClick={printAllTickets}
          style={{ 
            padding: "12px 20px", 
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "0.9em",
            display: "flex",
            alignItems: "center",
            gap: 5
          }}
        >
          🖨️ Imprimer tous
        </button>
        
        {!emailSent && (
          <button 
            onClick={() => setShowEmailForm(!showEmailForm)}
            style={{ 
              padding: "12px 20px", 
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: "0.9em",
              display: "flex",
              alignItems: "center",
              gap: 5
            }}
          >
            📧 Recevoir par email
          </button>
        )}
      </div>

      {/* Formulaire email */}
      {showEmailForm && (
        <div style={{ 
          background: "#e7f3ff", 
          padding: 20, 
          borderRadius: 8, 
          marginBottom: 20,
          border: "1px solid #b3d9ff"
        }}>
          <h3 style={{ color: "#0055A4", marginBottom: 15 }}>📧 Envoyer les billets par email</h3>
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="votre@email.com"
              style={{
                padding: "10px 15px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: "1em",
                minWidth: "250px"
              }}
              required
            />
            <button 
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: loading ? "#6c757d" : "#0055A4",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "⏳ Envoi..." : "📤 Envoyer"}
            </button>
            <button 
              type="button"
              onClick={() => setShowEmailForm(false)}
              style={{
                padding: "10px 15px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Annuler
            </button>
          </form>
        </div>
      )}

      {/* Affichage de tous les billets GROUPÉS */}
      {tickets.map((ticket, index) => (
        <div key={ticket.id} style={{ marginBottom: 30 }}>
          <div 
            id={`ticket-${ticket.id}`}
            style={{ 
              border: "3px solid #0055A4", 
              padding: 25, 
              background: "white",
              borderRadius: 12,
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
              textAlign: "center"
            }}
          >
            <div style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: 15, marginBottom: 15 }}>
              <h2 style={{ color: "#0055A4", margin: "0 0 5px 0", fontSize: "1.5em" }}>
                🎫 {ticket.eventTitle}
              </h2>
              <p style={{ color: "#666", margin: "5px 0", fontSize: "0.9em" }}>
                📍 {ticket.eventLocation} | 📅 {ticket.eventDate}
              </p>
              <p style={{ color: "#EF4135", margin: "5px 0", fontWeight: "bold" }}>
                {ticket.quantity}x {ticket.offerType} - {ticket.total} €
              </p>
            </div>
            
            {ticket.qrCode && (
              <img 
                src={ticket.qrCode} 
                alt={`QR Code - ${ticket.eventTitle}`} 
                style={{ 
                  width: 180, 
                  height: 180,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  margin: "0 auto"
                }} 
              />
            )}
            
            <div style={{ marginTop: 20 }}>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>🎯 Type:</strong> {ticket.offerType}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>📅 Date d'achat:</strong> {formatDate(ticket.purchaseDate)}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>💰 Prix unitaire:</strong> {ticket.price} €
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>📋 Commande:</strong> {ticket.orderNumber}
              </p>
            </div>
            
            <div style={{ 
              background: "#f8f9fa", 
              padding: 12, 
              borderRadius: 6, 
              marginTop: 15,
              borderLeft: "4px solid #28a745"
            }}>
              <p style={{ margin: 0, color: "#155724", fontSize: "0.9em" }}>
                <strong>✅ Présentez ce QR code à l'entrée du {ticket.eventLocation}</strong>
              </p>
            </div>
          </div>

          {/* Boutons d'action par billet */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={() => downloadTicketPDF(ticket)}
              style={{ 
                padding: "10px 20px", 
                backgroundColor: "#0055A4",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "0.9em",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              📥 Télécharger PDF
            </button>
            
            <button 
              onClick={() => printTicket(ticket)}
              style={{ 
                padding: "10px 20px", 
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "0.9em",
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              🖨️ Imprimer
            </button>
          </div>
        </div>
      ))}

      {status && (
        <div style={{ marginTop: 15 }}>
          <p style={{ color: "#0055A4", fontStyle: "italic" }}>{status}</p>
        </div>
      )}

      <div style={{ marginTop: 40, padding: 20, background: "#f8f9fa", borderRadius: 8 }}>
        <h3>📱 Informations importantes</h3>
        <ul style={{ textAlign: "left", maxWidth: 500, margin: "0 auto" }}>
          <li>Chaque billet est valable uniquement pour l'événement indiqué</li>
          <li>Présentez le QR code correspondant à chaque événement</li>
          <li>Une pièce d'identité peut être demandée</li>
          <li>Arrivez 1 heure avant le début de l'événement</li>
          <li>🖨️ Vous pouvez imprimer tous vos billets en une fois</li>
          <li>📧 Recevez vos billets par email si besoin</li>
        </ul>
      </div>
    </div>
  );
}

export default SuccessPage;