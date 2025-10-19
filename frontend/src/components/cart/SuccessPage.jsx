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
  const [stripeTotal, setStripeTotal] = useState("0.00");

  const STORAGE_KEY = "oly_tickets";

  const debugLocalStorage = useCallback(() => {
    console.log("🔍 DEBUG localStorage:");
    console.log("🛒 olympics_cart:", localStorage.getItem("olympics_cart"));
    console.log("🎫 oly_tickets:", localStorage.getItem(STORAGE_KEY));
    console.log("🔗 sessionId:", sessionId);
  }, [sessionId, STORAGE_KEY]);

  const fetchStripeSession = useCallback(async (sessionId) => {
    if (!sessionId) return null;
    try {
      const API_URL = "https://projet-bloc3.onrender.com";
      const response = await fetch(`${API_URL}/api/payments/session/${sessionId}`);
      if (response.ok) {
        const sessionData = await response.json();
        let realTotal = "0.00";
        if (sessionData.amount_total) realTotal = (sessionData.amount_total / 100).toFixed(2);
        else if (sessionData.amount) realTotal = (sessionData.amount / 100).toFixed(2);
        else if (sessionData.total) realTotal = sessionData.total;
        setStripeTotal(realTotal);
        return sessionData;
      }
    } catch (error) {
      console.error("❌ Erreur récupération session Stripe:", error);
    }
    return null;
  }, []);

  const generateQRCodeForEvent = useCallback(async (orderNumber, event) => {
    try {
      const qrContent = {
        orderId: orderNumber,
        eventId: event.eventId || event.id || 0,
        eventTitle: event.eventTitle || event.name || "Événement Olympique",
        eventDate: event.eventDate || event.date || "2024",
        eventLocation: event.eventLocation || event.location || "Paris",
        offerType: event.offerType || event.type || "Standard",
        quantity: event.quantity || 1,
        price: event.price || event.priceUnit || 50.0,
        timestamp: Date.now(),
        currency: "EUR",
      };
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), {
        width: 200,
        margin: 2,
        color: { dark: "#0055A4", light: "#FFFFFF" },
      });
      return qrCodeImage;
    } catch (error) {
      console.error("Erreur génération QR Code:", error);
      return null;
    }
  }, []);

  const saveTicketsToStorage = useCallback((newTickets) => {
    try {
      const existingTickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updatedTickets = [...existingTickets, ...newTickets];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTickets));
    } catch (error) {
      console.error("Erreur sauvegarde billets:", error);
    }
  }, []);

  const createTestTickets = useCallback(async (orderNumber) => {
    const testEvents = [
      { eventId: 1, eventTitle: "Cérémonie d'Ouverture", eventDate: "26 Juillet 2024", eventLocation: "Stade de France", offerType: "Standard", quantity: 2, price: 150.0 },
      { eventId: 2, eventTitle: "Finale Athlétisme 100m", eventDate: "3 Août 2024", eventLocation: "Stade de France", offerType: "VIP", quantity: 1, price: 300.0 },
    ];
    const generatedTickets = [];
    const purchaseDateISO = new Date().toISOString();

    for (const event of testEvents) {
      const qrCode = await generateQRCodeForEvent(orderNumber, event);
      const ticket = {
        id: `${orderNumber}-${event.eventId}`,
        orderNumber,
        eventId: event.eventId,
        eventTitle: event.eventTitle,
        eventDate: event.eventDate,
        eventLocation: event.eventLocation,
        offerType: event.offerType,
        quantity: event.quantity,
        price: event.price,
        total: (event.price * event.quantity).toFixed(2),
        qrCode,
        purchaseDate: purchaseDateISO,
        status: "active",
      };
      generatedTickets.push(ticket);
    }
    return generatedTickets;
  }, [generateQRCodeForEvent]);

  const generateTickets = useCallback(async () => {
    setStatus("Création de vos billets...");
    debugLocalStorage();
    try {
      const cart = JSON.parse(localStorage.getItem("olympics_cart") || "[]");
      let generatedTickets = [];
      const orderNumber = "OLY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const purchaseDateISO = new Date().toISOString();

      if (sessionId) await fetchStripeSession(sessionId);

      if (cart.length === 0) {
        generatedTickets = await createTestTickets(orderNumber);
        setStripeTotal("600.00");
      } else {
        for (const item of cart) {
          const qrCode = await generateQRCodeForEvent(orderNumber, item);
          const ticket = {
            id: `${orderNumber}-${item.eventId || item.id || Date.now()}`,
            orderNumber,
            eventId: item.eventId || item.id || 0,
            eventTitle: item.eventTitle || item.name || "Événement Olympique",
            eventDate: item.eventDate || item.date || "2024",
            eventLocation: item.eventLocation || item.location || "Paris",
            offerType: item.offerType || item.type || "Standard",
            quantity: item.quantity || 1,
            price: item.price || item.priceUnit || 50.0,
            total: ((item.price || item.priceUnit || 50.0) * (item.quantity || 1)).toFixed(2),
            qrCode,
            purchaseDate: purchaseDateISO,
            status: "active",
          };
          generatedTickets.push(ticket);
        }
      }

      setTickets(generatedTickets);
      saveTicketsToStorage(generatedTickets);
      localStorage.removeItem("olympics_cart");
      setLoading(false);
      setStatus("Billets créés avec succès !");
    } catch (error) {
      console.error("❌ Erreur création billets:", error);
      setStatus("Erreur lors de la création des billets");
      setLoading(false);
    }
  }, [sessionId, fetchStripeSession, generateQRCodeForEvent, createTestTickets, saveTicketsToStorage, debugLocalStorage]);

  const downloadTicketPDF = async (ticket) => {
    const ticketElement = document.getElementById(`ticket-${ticket.id}`);
    if (!ticketElement) return;
    try {
      setStatus(`Génération PDF pour ${ticket.eventTitle}...`);
      const canvas = await html2canvas(ticketElement, { scale: 2, useCORS: true, logging: false });
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

  const printTicket = (ticket) => {
    try {
      setStatus(`Préparation impression pour ${ticket.eventTitle}...`);
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`<html><head><title>Billet - ${ticket.eventTitle}</title></head><body>${ticket.eventTitle}</body></html>`);
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

  const formatDate = (isoString) => {
    if (!isoString) return "Date non disponible";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
          <div
            style={{
              width: 50,
              height: 50,
              border: "5px solid #f3f3f3",
              borderTop: "5px solid #0055A4",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          ></div>
        </div>
        <p>⏳ Préparation de vos billets...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #0055A4 0%, #EF4135 100%)", color: "white", padding: 30, borderRadius: 15, marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: "2.5em" }}>🎉 Paiement Réussi !</h1>
        <p style={{ fontSize: "1.2em", marginTop: 10, opacity: 0.9 }}>
          Vous avez {tickets.length} type{tickets.length > 1 ? "s" : ""} de billet{tickets.length > 1 ? "s" : ""}
        </p>
        <p style={{ fontSize: "1.1em", marginTop: 5 }}>
          <strong>
            💰 Total payé: {stripeTotal !== "0.00" ? stripeTotal : tickets.reduce((sum, t) => sum + parseFloat(t.total), 0).toFixed(2)} €
          </strong>
        </p>
      </div>

      {tickets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3>
            Numéro de commande: <span style={{ color: "#0055A4" }}>{tickets[0].orderNumber}</span>
          </h3>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 30, flexWrap: "wrap" }}>
        <button
          onClick={() => tickets.forEach(downloadTicketPDF)}
          style={{
            padding: "12px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "0.9em",
          }}
        >
          🖨️ Imprimer tous ({tickets.length})
        </button>
      </div>

      {tickets.map((ticket) => (
        <div key={ticket.id} style={{ marginBottom: 30 }}>
          <div id={`ticket-${ticket.id}`} style={{ border: "3px solid #0055A4", padding: 25, background: "white", borderRadius: 12, boxShadow: "0 8px 25px rgba(0,0,0,0.1)", textAlign: "center" }}>
            <div style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: 15, marginBottom: 15 }}>
              <h2 style={{ color: "#0055A4", margin: "0 0 5px 0", fontSize: "1.5em" }}>🎫 {ticket.eventTitle}</h2>
              <p style={{ color: "#666", margin: "5px 0", fontSize: "0.9em" }}>
                📍 {ticket.eventLocation} | 📅 {ticket.eventDate}
              </p>
              <p style={{ color: "#EF4135", margin: "5px 0", fontWeight: "bold" }}>
                {ticket.quantity}x {ticket.offerType} - {ticket.total} €
              </p>
            </div>

            {ticket.qrCode && <img src={ticket.qrCode} alt={`QR Code - ${ticket.eventTitle}`} style={{ width: 180, height: 180, border: "1px solid #ddd", borderRadius: 8, margin: "0 auto" }} />}

            <div style={{ marginTop: 20 }}>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>🎯 Type:</strong> {ticket.offerType}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>🎟️ Quantité:</strong> {ticket.quantity} billet{ticket.quantity > 1 ? "s" : ""}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>💰 Prix unitaire:</strong> {ticket.price} €
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>💵 Total:</strong> {ticket.total} €
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>📅 Date d'achat:</strong> {formatDate(ticket.purchaseDate)}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>📋 Commande:</strong> {ticket.orderNumber}
              </p>
            </div>
          </div>
        </div>
      ))}

      {status && (
        <div style={{ marginTop: 15 }}>
          <p style={{ color: "#0055A4", fontStyle: "italic" }}>{status}</p>
        </div>
      )}
    </div>
  );
}

export default SuccessPage;
