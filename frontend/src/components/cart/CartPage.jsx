import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [tickets, setTickets] = useState([]); // <-- billets générés
  const [modalOpen, setModalOpen] = useState(false); // <-- état modal
  const navigate = useNavigate();
  const API_URL = "https://projet-bloc3.onrender.com";

  const totalPrice = items.reduce(
    (acc, item) => acc + (item.priceUnit || 0) * (item.quantity || 0),
    0
  );

  const handleValidateOrder = async () => {
    const token = localStorage.getItem('olympics_auth_token');

    if (!token) {
      alert('Veuillez vous connecter pour valider votre commande');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      alert("Votre panier est vide !");
      return;
    }

    if (!email) {
      alert("Veuillez saisir votre email pour recevoir vos billets");
      return;
    }

    setLoading(true);
    try {
      const validatedItems = items.map(item => ({
        eventId: item.eventId,
        offerTypeId: item.offerTypeId,
        quantity: item.quantity || 1
      }));

      const cartBody = { items: validatedItems, totalPrice, email };

      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace('Bearer ', '')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cartBody)
      });

      if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);
      const data = await response.json();

      // redirection Stripe si nécessaire
      if (data.url) {
        window.location.href = data.url;
      } else {
        // billets générés côté backend
        setTickets(data.tickets || []);
        setModalOpen(true); // <-- ouvre le pop-up
        clearCart();
      }
    } catch (error) {
      console.error('Erreur lors de la validation :', error);
      alert(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTicketEmail = async (ticket) => {
    try {
      const res = await fetch(`${API_URL}/api/send-ticket?primaryKey=${ticket.primaryKey}&email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error("Échec de l'envoi du billet");
      alert(`Billet pour ${ticket.eventTitle} envoyé à ${email}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du billet par email.");
    }
  };

  const handleContinueShopping = () => navigate('/public-events');
  const handleClearCart = () => { if (window.confirm("Vider le panier ?")) clearCart(); };
  const handleRemoveItem = (eventId, offerTypeId) => { if (window.confirm("Supprimer cet article ?")) removeItem(eventId, offerTypeId); };

  const styles = {
    container: { padding: 30, maxWidth: 800, margin: "0 auto", backgroundColor: "#f9fafb", borderRadius: 16 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    title: { fontSize: 24, color: "#1e293b" },
    item: { backgroundColor: "#fff", borderRadius: 12, padding: 15, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" },
    totalSection: { marginTop: 20, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: "bold" },
    button: { padding: "10px 18px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 15 },
    validateBtn: { backgroundColor: "#16a34a", color: "#fff" },
    continueBtn: { backgroundColor: "#3b82f6", color: "#fff" },
    clearBtn: { backgroundColor: "#dc2626", color: "#fff" },
    removeBtn: { backgroundColor: "#f87171", color: "#fff", padding: "6px 10px", fontSize: 20, borderRadius: "50%" },
    emailInput: { padding: "8px 12px", fontSize: 16, width: "100%", marginBottom: 10, borderRadius: 6, border: "1px solid #cbd5e1" },
    modalOverlay: { position: "fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center" },
    modalContent: { backgroundColor:"#fff", padding:30, borderRadius:10, maxWidth:500, width:"90%" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Votre panier</h2>
        <span>{items.length} article(s)</span>
      </div>

      {items.map((item, index) => (
        <div key={`${item.eventId}-${item.offerTypeId}-${index}`} style={styles.item}>
          <div>
            <h3>{item.eventTitle}</h3>
            <p>{item.offerName}</p>
            <div>Quantité: {item.quantity} | Prix unitaire: {item.priceUnit?.toFixed(2)} €</div>
            <div style={{ fontWeight: "bold" }}>Sous-total: {(item.priceUnit * item.quantity).toFixed(2)} €</div>
          </div>
          <button onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)} style={styles.removeBtn} disabled={loading}>×</button>
        </div>
      ))}

      <div style={styles.totalSection}>
        <span>Total :</span>
        <span>{totalPrice.toFixed(2)} €</span>
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          type="email"
          placeholder="Entrez votre email pour recevoir les billets"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.emailInput}
        />
        <button onClick={handleValidateOrder} disabled={loading} style={{ ...styles.button, ...styles.validateBtn }}>
          {loading ? "Traitement..." : "✅ Valider la commande"}
        </button>
        <button onClick={handleContinueShopping} style={{ ...styles.button, ...styles.continueBtn, marginTop:8 }}>🛍️ Continuer mes achats</button>
        <button onClick={handleClearCart} style={{ ...styles.button, ...styles.clearBtn, marginTop:8 }}>🗑️ Vider le panier</button>
      </div>

      {/* --- MODAL BILLETS --- */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Vos billets</h3>
            {tickets.map((ticket, idx) => (
              <div key={idx} style={{ marginBottom: 15, padding:10, border:"1px solid #cbd5e1", borderRadius:6 }}>
                <p><strong>Événement:</strong> {ticket.eventTitle}</p>
                <p><strong>Quantité:</strong> {ticket.quantity}</p>
                <p><strong>Clé du billet:</strong> {ticket.primaryKey}</p>
                <button onClick={() => handleSendTicketEmail(ticket)} style={{ ...styles.button, ...styles.validateBtn, marginTop:5 }}>
                  Envoyer par email
                </button>
              </div>
            ))}
            <button onClick={() => setModalOpen(false)} style={{ ...styles.button, ...styles.clearBtn, marginTop:10 }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
