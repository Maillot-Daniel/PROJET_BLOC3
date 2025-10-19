import React, { useState, useEffect, useCallback } from "react";
// Supprimé: import { useSearchParams } from "react-router-dom"; // Non utilisé
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function SuccessPage() {
  // Supprimé: const [searchParams] = useSearchParams(); // Variable inutilisée
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const STORAGE_KEY = "oly_tickets";
  const MAILTRAP_EMAIL = "d0c004224e85f3@inbox.mailtrap.io";

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
        customer: MAILTRAP_EMAIL,
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
  }, [MAILTRAP_EMAIL]);

  // ✅ Sauvegarde de tous les billets
  const saveTicketsToStorage = useCallback((newTickets) => {
    try {
      const existingTickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updatedTickets = [...existingTickets, ...newTickets];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTickets));
      console.log("💾 Billets sauvegardés:", newTickets.length);
      console.log("📋 Total billets en stockage:", updatedTickets.length);
    } catch (error) {
      console.error("Erreur sauvegarde billets:", error);
    }
  }, []);

  // ✅ Envoi email avec tous les billets
  const sendEmail = useCallback(async (orderNumber, tickets) => {
    try {
      const API_URL = "https://projet-bloc3.onrender.com";
      
      const emailData = {
        toEmail: MAILTRAP_EMAIL,
        orderNumber: orderNumber,
        tickets: tickets,
        totalAmount: tickets.reduce((sum, ticket) => sum + parseFloat(ticket.total), 0).toFixed(2)
      };
      
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

  // ✅ Créer un billet par événement
  const generateTickets = useCallback(async () => {
    setStatus("Création de vos billets...");

    try {
      // Récupérer le panier
      const cart = JSON.parse(localStorage.getItem("olympics_cart") || "[]");
      console.log("🛒 Panier récupéré:", cart);

      if (cart.length === 0) {
        console.log("⚠️ Panier vide, création d'un billet par défaut");
        // Fallback - un billet générique
        cart.push({
          eventId: 0,
          eventTitle: "Jeux Olympiques Paris 2024",
          eventDate: "2024-07-26",
          eventLocation: "Multiple sites",
          offerType: "Standard",
          price: 50.00,
          quantity: 1
        });
      }

      const orderNumber = "OLY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const purchaseDateISO = new Date().toISOString();
      
      const generatedTickets = [];

      // Créer un billet pour chaque événement
      for (const item of cart) {
        const qrCode = await generateQRCodeForEvent(orderNumber, item, item.price);
        
        const ticket = {
          id: `${orderNumber}-${item.eventId}`,
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
        console.log(`🎫 Billet créé pour: ${item.eventTitle}`);
      }

      setTickets(generatedTickets);
      
      // Sauvegarder tous les billets
      saveTicketsToStorage(generatedTickets);

      // Envoyer l'email avec tous les billets
      const emailSuccess = await sendEmail(orderNumber, generatedTickets);
      setEmailSent(emailSuccess);

      // Vider le panier
      localStorage.removeItem("olympics_cart");
      
      setLoading(false);
      setStatus("Billets créés avec succès !");

    } catch (error) {
      console.error("❌ Erreur création billets:", error);
      setStatus("Erreur lors de la création des billets");
      setLoading(false);
    }
  }, [generateQRCodeForEvent, saveTicketsToStorage, sendEmail]);

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
          Vous avez acheté {tickets.length} billet{tickets.length > 1 ? 's' : ''}
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
          <strong>📧 Email envoyé !</strong> Vos billets ont été envoyés à {MAILTRAP_EMAIL}
        </div>
      )}

      {tickets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3>Numéro de commande: <span style={{ color: "#0055A4" }}>{tickets[0].orderNumber}</span></h3>
        </div>
      )}

      {/* Affichage de tous les billets */}
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
                <strong>💰 Prix:</strong> <span style={{ color: "#EF4135", fontWeight: "bold" }}>{ticket.total} €</span>
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

          <button 
            onClick={() => downloadTicketPDF(ticket)}
            style={{ 
              padding: "10px 20px", 
              margin: "10px 5px", 
              backgroundColor: "#0055A4",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: "0.9em"
            }}
          >
            🖨️ Télécharger ce billet
          </button>
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
        </ul>
      </div>
    </div>
  );
}

export default SuccessPage;