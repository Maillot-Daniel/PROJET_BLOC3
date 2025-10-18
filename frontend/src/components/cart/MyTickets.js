import React, { useState, useEffect } from "react";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = "oly_tickets";

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

  const loadTickets = () => {
    try {
      const allTickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      console.log("🎫 Billets chargés:", allTickets.length);
      setTickets(allTickets);
    } catch (error) {
      console.error("Erreur chargement billets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les billets si le storage change (dans un autre onglet par exemple)
  useEffect(() => {
    const handleStorageChange = () => {
      loadTickets();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    loadTickets();
  }, []);

  // Télécharger le QR Code
  const downloadQRCode = (ticket) => {
    if (!ticket.qrCode) return;
    
    const link = document.createElement('a');
    link.href = ticket.qrCode;
    link.download = `qrcode-${ticket.orderNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h2>🎫 Mes Billets</h2>
        <p>Chargement de vos billets...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ 
        color: "#0055A4", 
        textAlign: "center", 
        marginBottom: 30,
        fontSize: "2em"
      }}>
        🎫 Mes Billets
      </h2>
      
      {tickets.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: 40, 
          background: "#f8f9fa", 
          borderRadius: 10,
          border: "2px dashed #dee2e6"
        }}>
          <p style={{ fontSize: "1.2em", marginBottom: 20 }}>Aucun billet trouvé.</p>
          <p style={{ color: "#6c757d" }}>
            Vos billets apparaîtront ici après un achat réussi.
          </p>
        </div>
      ) : (
        <div>
          <p style={{ 
            textAlign: "center", 
            color: "#495057", 
            marginBottom: 20,
            fontSize: "1.1em"
          }}>
            Vous avez {tickets.length} billet{tickets.length > 1 ? 's' : ''}
          </p>
          
          {tickets.map((ticket, index) => (
            <div 
              key={ticket.orderNumber || index} 
              style={{ 
                border: "2px solid #0055A4",
                padding: 25, 
                marginBottom: 25, 
                borderRadius: 12,
                background: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 15
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    color: "#0055A4", 
                    margin: "0 0 10px 0",
                    fontSize: "1.3em"
                  }}>
                    Commande: {ticket.orderNumber}
                  </h3>
                  
                  <div style={{ marginBottom: 15 }}>
                    <p style={{ margin: "5px 0" }}>
                      <strong>📅 Date d'achat:</strong> {formatDate(ticket.purchaseDate)}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>💰 Total:</strong> <span style={{ color: "#EF4135", fontWeight: "bold" }}>{ticket.total || "0.00"} €</span>
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>✅ Statut:</strong> <span style={{ color: "#28a745" }}>{ticket.status || "Confirmé"}</span>
                    </p>
                    
                    {/* Détails des items si disponibles */}
                    {ticket.items && ticket.items.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <p style={{ margin: "5px 0", fontWeight: "bold" }}>Détails:</p>
                        {ticket.items.map((item, itemIndex) => (
                          <p key={itemIndex} style={{ margin: "2px 0", fontSize: "0.9em", color: "#495057" }}>
                            • {item.quantity}x {item.offerName || item.eventTitle} 
                            {item.priceUnit && ` - ${item.priceUnit}€`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {ticket.qrCode && (
                  <div style={{ textAlign: "center" }}>
                    <img 
                      src={ticket.qrCode} 
                      alt={`QR Code - ${ticket.orderNumber}`} 
                      style={{ 
                        width: 120, 
                        height: 120,
                        border: "1px solid #dee2e6",
                        borderRadius: 8
                      }} 
                    />
                    <button 
                      onClick={() => downloadQRCode(ticket)}
                      style={{
                        marginTop: 10,
                        padding: "5px 10px",
                        backgroundColor: "#0055A4",
                        color: "white",
                        border: "none",
                        borderRadius: 5,
                        cursor: "pointer",
                        fontSize: "0.8em"
                      }}
                    >
                      📥 Télécharger QR
                    </button>
                  </div>
                )}
              </div>
              
              {/* Message d'information */}
              <div style={{ 
                marginTop: 15, 
                padding: 10, 
                background: "#e7f3ff", 
                borderRadius: 6,
                borderLeft: "4px solid #0055A4"
              }}>
                <p style={{ margin: 0, fontSize: "0.9em", color: "#0055A4" }}>
                  <strong>💡 Présentez ce QR code à l'entrée avec une pièce d'identité.</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTickets;