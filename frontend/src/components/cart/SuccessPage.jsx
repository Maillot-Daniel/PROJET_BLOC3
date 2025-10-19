import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [stripeTotal, setStripeTotal] = useState("0.00");

  const STORAGE_KEY = "oly_tickets";

  // Récupérer la session Stripe pour le montant réel
  const fetchStripeSession = useCallback(async (sessionIdParam) => {
    if (!sessionIdParam) return null;
    try {
      const API_URL = "https://projet-bloc3.onrender.com";
      const response = await fetch(`${API_URL}/api/payments/session/${sessionIdParam}`);
      if (!response.ok) return null;
      const data = await response.json();
      let total = "0.00";
      if (data.amount_total) total = (data.amount_total / 100).toFixed(2);
      else if (data.amount) total = (data.amount / 100).toFixed(2);
      else if (data.total) total = data.total;
      setStripeTotal(total);
      return data;
    } catch (err) {
      console.error("Erreur récupération Stripe:", err);
      return null;
    }
  }, []);

  // Générer QR code pour un billet
  const generateQRCodeForEvent = useCallback(async (orderNumber, event) => {
    const qrContent = {
      orderId: orderNumber,
      eventId: event.eventId || event.id || 0,
      eventTitle: event.eventTitle || event.name || "Événement Olympique",
      eventDate: event.eventDate || event.date || "2024",
      eventLocation: event.eventLocation || event.location || "Paris",
      offerType: event.offerType || event.type || "Standard",
      quantity: event.quantity || 1,
      price: event.price || 50,
      timestamp: Date.now(),
      currency: "EUR"
    };
    try {
      return await QRCode.toDataURL(JSON.stringify(qrContent), {
        width: 200,
        margin: 2,
        color: { dark: "#0055A4", light: "#FFFFFF" }
      });
    } catch (err) {
      console.error("Erreur QR code:", err);
      return null;
    }
  }, []);

  // Sauvegarder billets dans le localStorage
  const saveTicketsToStorage = useCallback((newTickets) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updated = [...existing, ...newTickets];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Erreur sauvegarde billets:", err);
    }
  }, []);

  // Générer billets + envoyer email
  const generateTickets = useCallback(async () => {
    setStatus("Création de vos billets...");
    try {
      const cart = JSON.parse(localStorage.getItem("olympics_cart") || "[]");
      const orderNumber = "OLY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const purchaseDateISO = new Date().toISOString();
      let items = cart.length ? cart : [
        { eventId: 1, eventTitle: "Cérémonie d'Ouverture", eventDate: "26 Juillet 2024", eventLocation: "Stade de France", offerType: "Standard", quantity: 2, price: 150 },
        { eventId: 2, eventTitle: "Finale Athlétisme 100m", eventDate: "3 Août 2024", eventLocation: "Stade de France", offerType: "VIP", quantity: 1, price: 300 }
      ];

      if (sessionId) await fetchStripeSession(sessionId);

      const generatedTickets = [];
      for (const item of items) {
        const qrCode = await generateQRCodeForEvent(orderNumber, item);
        generatedTickets.push({
          id: `${orderNumber}-${item.eventId || item.id || Date.now()}`,
          orderNumber,
          eventId: item.eventId || item.id || 0,
          eventTitle: item.eventTitle || item.name || "Événement Olympique",
          eventDate: item.eventDate || item.date || "2024",
          eventLocation: item.eventLocation || item.location || "Paris",
          offerType: item.offerType || item.type || "Standard",
          quantity: item.quantity || 1,
          price: item.price || 50,
          total: ((item.price || 50) * (item.quantity || 1)).toFixed(2),
          qrCode,
          purchaseDate: purchaseDateISO,
          status: "active"
        });
      }

      setTickets(generatedTickets);
      saveTicketsToStorage(generatedTickets);

      // Envoyer email via backend
      setStatus("Envoi de l'email avec vos billets...");
      const API_URL = "https://projet-bloc3.onrender.com";
      const emailResponse = await fetch(`${API_URL}/api/email/send-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          tickets: generatedTickets,
          total: stripeTotal || generatedTickets.reduce((sum, t) => sum + parseFloat(t.total), 0).toFixed(2)
        })
      });

      if (emailResponse.ok) setStatus("Billets créés et email envoyé !");
      else setStatus("Billets créés, mais l'email a échoué.");

      // Vider le panier après email
      localStorage.removeItem("olympics_cart");
      setLoading(false);
    } catch (err) {
      console.error("Erreur création billets:", err);
      setStatus("Erreur lors de la création des billets");
      setLoading(false);
    }
  }, [sessionId, fetchStripeSession, generateQRCodeForEvent, saveTicketsToStorage, stripeTotal]);

  useEffect(() => { generateTickets(); }, [generateTickets]);

  // Calcul total
  const totalPaid = stripeTotal !== "0.00" ? stripeTotal : tickets.reduce((sum, t) => sum + parseFloat(t.total), 0).toFixed(2);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <h2>{status}</h2>
        <div style={{ margin: 20 }}>
          <div style={{ width: 50, height: 50, border: "5px solid #f3f3f3", borderTop: "5px solid #0055A4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
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
          Vous avez {tickets.length} type{tickets.length > 1 ? 's' : ''}
        </p>
        <p style={{ fontSize: "1.1em", marginTop: 5 }}>
          <strong>💰 Total payé: {totalPaid} €</strong>
        </p>
      </div>

      {tickets.length > 0 && <div style={{ marginBottom: 20 }}><h3>Numéro de commande: <span style={{ color: "#0055A4" }}>{tickets[0].orderNumber}</span></h3></div>}

      {/* Liste billets */}
      {tickets.map(ticket => (
        <div key={ticket.id} id={`ticket-${ticket.id}`} style={{ border: "3px solid #0055A4", padding: 25, background: "white", borderRadius: 12, boxShadow: "0 8px 25px rgba(0,0,0,0.1)", marginBottom: 30, textAlign: "center" }}>
          <h2 style={{ color: "#0055A4" }}>🎫 {ticket.eventTitle}</h2>
          <p>📍 {ticket.eventLocation} | 📅 {ticket.eventDate}</p>
          <p>{ticket.quantity}x {ticket.offerType} - {ticket.total} €</p>
          {ticket.qrCode && <img src={ticket.qrCode} alt="QR Code" style={{ width: 180, height: 180, marginTop: 10 }} />}
        </div>
      ))}

      {status && <p style={{ color: "#0055A4", fontStyle: "italic" }}>{status}</p>}
    </div>
  );
}

export default SuccessPage;
