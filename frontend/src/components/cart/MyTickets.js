import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fonction loadTickets définie d'abord
  const loadTickets = useCallback(() => {
    try {
      const allTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
      
      // Filtrer les billets pour l'utilisateur actuel
      const userTickets = allTickets.filter(ticket => {
        return ticket.customer?.email === user?.email;
      });
      
      setTickets(userTickets);
      console.log('🎫 Billets chargés pour', user?.email + ':', userTickets.length);
      
    } catch (error) {
      console.error('Erreur chargement billets:', error);
    }
  }, [user]);

  // Fonction checkUserAndLoadTickets qui utilise loadTickets
  const checkUserAndLoadTickets = useCallback(() => {
    try {
      const lastUserEmail = localStorage.getItem('last_user_email');
      const currentUserEmail = user?.email || 'anonymous';
      
      console.log('👤 Utilisateur actuel:', currentUserEmail);
      console.log('👤 Dernier utilisateur:', lastUserEmail);
      
      // Si l'utilisateur a changé, vider les billets
      if (lastUserEmail && lastUserEmail !== currentUserEmail) {
        console.log('🔄 Utilisateur différent - Nettoyage des billets...');
        localStorage.removeItem('olympics_tickets');
      }
      
      // Mettre à jour le dernier utilisateur
      localStorage.setItem('last_user_email', currentUserEmail);
      
      loadTickets();
      
    } catch (error) {
      console.error('❌ Erreur vérification utilisateur:', error);
    }
  }, [user, loadTickets]);

  useEffect(() => {
    checkUserAndLoadTickets();
  }, [checkUserAndLoadTickets]);

  // ✅ Supprimer les billets de l'utilisateur actuel
  const clearUserTickets = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous vos billets ? Cette action est irréversible.')) {
      try {
        const allTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
        
        // Garder uniquement les billets des autres utilisateurs
        const otherUsersTickets = allTickets.filter(ticket => 
          ticket.customer?.email !== user?.email
        );
        
        localStorage.setItem('olympics_tickets', JSON.stringify(otherUsersTickets));
        setTickets([]);
        console.log('🗑️ Billets supprimés pour', user?.email);
        
      } catch (error) {
        console.error('Erreur suppression billets:', error);
      }
    }
  };

  // Formater le prix en toute sécurité
  const formatPrice = (price) => {
    console.log('💰 Formatage prix:', price, 'type:', typeof price);
    
    if (price === null || price === undefined) {
      return "0.00 €";
    }
    
    // Si c'est déjà une string avec €, on la retourne telle quelle
    if (typeof price === 'string') {
      if (price.includes('€')) {
        return price;
      }
      // Si c'est une string numérique, on la convertit
      const numericFromString = Number(price);
      if (!isNaN(numericFromString)) {
        return `${numericFromString.toFixed(2)} €`;
      }
    }
    
    // Conversion en nombre
    const numericPrice = Number(price);
    
    // Vérification que c'est un nombre valide
    if (isNaN(numericPrice)) {
      return "0.00 €";
    }
    
    // Formatage avec 2 décimales
    return `${numericPrice.toFixed(2)} €`;
  };

  // ✅ Formater la date en toute sécurité
  const formatDate = (dateString) => {
    if (!dateString) {
      return "Date non disponible";
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Erreur date";
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
            <p>Date d'achat: ${formatDate(ticket.purchaseDate)}</p>
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
    clearButton: {
      padding: "10px 16px",
      margin: "5px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      backgroundColor: "#ef4444",
      color: "white",
      fontWeight: "bold"
    },
    emptyState: {
      textAlign: "center",
      padding: "40px",
      color: "#64748b"
    },
    userInfo: {
      textAlign: "center",
      marginBottom: "20px",
      color: "#6b7280",
      fontSize: "14px"
    },
    debugInfo: {
      backgroundColor: '#f3f4f6',
      padding: '10px',
      borderRadius: '8px',
      margin: '10px 0',
      fontSize: '12px',
      color: '#6b7280'
    }
  };

  // Vérification des données avant rendu
  const renderTicketContent = (ticket, index) => {
    console.log(`🎫 Rendu billet ${index}:`, ticket);
    
    return (
      <div key={index} style={styles.ticketCard}>
        <h3>Commande: {ticket.orderNumber || 'N/A'}</h3>
        <p><strong>Date d'achat:</strong> {formatDate(ticket.purchaseDate)}</p>
        
        {/* ✅ Section Total sécurisée */}
        <div style={styles.debugInfo}>
          <strong>Debug total:</strong> {JSON.stringify(ticket.total)} (type: {typeof ticket.total})
        </div>
        <p><strong>Total:</strong> {formatPrice(ticket.total)}</p>
        
        <div>
          <strong>Événements:</strong>
          {ticket.items?.map((item, itemIndex) => (
            <div key={itemIndex} style={{margin: '5px 0', padding: '5px', backgroundColor: '#f8fafc', borderRadius: '4px'}}>
              {item.eventTitle || 'Événement'} - {item.offerName || 'Offre'} (x{item.quantity || 1})
            </div>
          )) || (
            <div style={{margin: '5px 0', padding: '5px', backgroundColor: '#f8fafc', borderRadius: '4px'}}>
              Jeux Olympiques Paris 2024
            </div>
          )}
        </div>
        
        {ticket.qrCode && (
          <img 
            src={ticket.qrCode} 
            alt="QR Code" 
            style={styles.qrCodeSmall} 
          />
        )}
        
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
                    <p>Date d'achat: ${formatDate(ticket.purchaseDate)}</p>
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
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎫 Mes Billets</h2>
      
      {user && (
        <div style={styles.userInfo}>
          Connecté en tant que: <strong>{user.email}</strong>
        </div>
      )}
      
      {/* ✅ Section debug pour voir les données */}
      <div style={styles.debugInfo}>
        <strong>Debug localStorage:</strong> {localStorage.getItem('olympics_tickets') ? 'Données présentes' : 'Aucune donnée'}
        <br />
        <strong>Nombre de billets chargés:</strong> {tickets.length}
        <br />
        <strong>Dernier utilisateur:</strong> {localStorage.getItem('last_user_email')}
      </div>
      
      {tickets.length > 0 && (
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <button 
            onClick={clearUserTickets}
            style={styles.clearButton}
          >
            🗑️ Supprimer mes billets
          </button>
        </div>
      )}
      
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
        tickets.map((ticket, index) => renderTicketContent(ticket, index))
      )}
    </div>
  );
}

export default MyTickets;