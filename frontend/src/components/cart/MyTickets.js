import React, { useState, useEffect } from "react";

function MyTickets() {
  const [tickets, setTickets] = useState([]);

  const STORAGE_KEY = "oly_tickets";

  const formatDate = (isoString) => {
    if (!isoString) return "Date non disponible";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const loadTickets = () => {
    try {
      const allTickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setTickets(allTickets);
    } catch (error) {
      console.error("Erreur chargement billets:", error);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>🎫 Mes Billets</h2>
      {tickets.length === 0 ? (
        <p>Aucun billet trouvé.</p>
      ) : (
        tickets.map((ticket, index) => (
          <div key={index} style={{ border: "1px solid #000", padding: 20, marginBottom: 20 }}>
            <h3>Commande: {ticket.orderNumber}</h3>
            <p>Date d'achat: {formatDate(ticket.purchaseDate)}</p>
            <p>Total: {ticket.total} €</p>
            {ticket.qrCode && <img src={ticket.qrCode} alt="QR Code" width={120} />}
          </div>
        ))
      )}
    </div>
  );
}

export default MyTickets;
