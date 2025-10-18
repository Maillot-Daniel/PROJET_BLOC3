import React, { useState, useEffect } from "react";

function MyTickets() {
  const [tickets, setTickets] = useState([]);

  const loadTickets = () => {
    const allTickets = JSON.parse(localStorage.getItem("oly_tickets") || "[]");
    setTickets(allTickets);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>🎫 Mes Billets</h2>
      {tickets.length === 0 && <p>Aucun billet trouvé.</p>}
      {tickets.map((ticket, idx) => (
        <div key={idx} style={{ border: "1px solid #ddd", padding: 20, marginBottom: 20 }}>
          <h3>Commande: {ticket.orderNumber}</h3>
          <p>Date: {ticket.purchaseDate}</p>
          <p>Total: {ticket.total} €</p>
          <img src={ticket.qrCode} alt="QR Code" style={{ width: 150, height: 150 }} />
        </div>
      ))}
    </div>
  );
}

export default MyTickets;
