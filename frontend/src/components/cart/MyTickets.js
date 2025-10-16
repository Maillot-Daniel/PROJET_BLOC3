import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = () => {
    try {
      const userTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
      setTickets(userTickets);
    } catch (error) {
      console.error('Erreur chargement billets:', error);
    }
  };

  const openTicketPopup = (ticket) => {
    const newWindow = window.open('', '_blank', 'width=400,height=600');
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billet ${ticket.orderNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .ticket {
              background: white;
              color: #333;
              border-radius: 15px;
              padding: 30px;
              margin: 20px auto;
              max-width: 350px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .qr-code {
              width: 250px;
              height: 250px;
              margin: 20px 0;
              border: 2px solid #ddd;
              border-radius: 10px;
            }
            .print-btn {
              background: #4CAF50;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h1>🎫 Votre Billet</h1>
            <h3>${ticket.orderNumber}</h3>
            <img src="${ticket.qrCode}" class="qr-code" alt="QR Code" />
            <p><strong>Présentez ce QR Code à l'entrée</strong></p>
            <p>Date d'achat: ${new Date(ticket.purchaseDate).toLocaleDateString('fr-FR')}</p>
            <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
          </div>
        </body>
      </html>
    `);
  };

  const styles = {
    container: {
      padding: "30px",
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#f9fafb",
      borderRadius: "16px",
      minHeight: "80vh"
    },
    title: {
      fontSize: "28px",
      color: "#1e293b",
      marginBottom: "30px",
      textAlign: "center"
    },
    ticketCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0"
    },
    qrCodeSmall: {
      width: "120px",
      height: "120px",
      margin: "10px 0",
      border: "2px solid #e2e8f0",
      borderRadius: "8px"
    },
    button: {
      padding: "10px 16px",
      margin: "5px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      backgroundColor: "#3b82f6",
      color: "white",
      fontWeight: "bold"
    },
    emptyState: {
      textAlign: "center",
      padding: "40px",
      color: "#64748b"
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎫 Mes Billets</h2>
      
      {tickets.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>Aucun billet trouvé</h3>
          <p>Vous n'avez pas encore acheté de billets.</p>
          <button 
            onClick={() => navigate('/public-events')} 
            style={styles.button}
          >
            Découvrir les événements
          </button>
        </div>
      ) : (
        tickets.map((ticket, index) => (
          <div key={index} style={styles.ticketCard}>
            <h3>Commande: {ticket.orderNumber}</h3>
            <p><strong>Date d'achat:</strong> {new Date(ticket.purchaseDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Total:</strong> {ticket.total?.toFixed(2)} €</p>
            
            <div>
              <strong>Événements:</strong>
              {ticket.items?.map((item, itemIndex) => (
                <div key={itemIndex} style={{margin: '5px 0', padding: '5px', backgroundColor: '#f8fafc', borderRadius: '4px'}}>
                  {item.eventTitle} - {item.offerName} (x{item.quantity})
                </div>
              ))}
            </div>
            
            <img 
              src={ticket.qrCode} 
              alt="QR Code" 
              style={styles.qrCodeSmall} 
            />
            
            <div style={{marginTop: '15px'}}>
              <button 
                onClick={() => openTicketPopup(ticket)}
                style={styles.button}
              >
                👁️ Voir le billet
              </button>
              
              <button 
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head><title>Billet ${ticket.orderNumber}</title></head>
                      <body style="text-align: center; padding: 40px;">
                        <h1>🎫 Votre Billet</h1>
                        <h2>${ticket.orderNumber}</h2>
                        <img src="${ticket.qrCode}" style="width: 300px; height: 300px; border: 2px solid #000;" />
                        <p><strong>Présentez ce QR Code à l'entrée</strong></p>
                        <p>Date d'achat: ${new Date(ticket.purchaseDate).toLocaleDateString('fr-FR')}</p>
                        <script>
                          window.onload = function() { window.print(); }
                        </script>
                      </body>
                    </html>
                  `);
                }}
                style={{...styles.button, backgroundColor: '#10b981'}}
              >
                🖨️ Imprimer
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyTickets;