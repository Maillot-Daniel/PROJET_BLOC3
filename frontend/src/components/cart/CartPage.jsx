import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
  const totalPrice = items.reduce((acc, item) => acc + (item.priceUnit || 0) * (item.quantity || 0), 0);

  const buttonStyles = {
    validate: { backgroundColor: '#28a745', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', margin: '0.2rem' },
    continue: { backgroundColor: '#007bff', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', margin: '0.2rem' },
    clear: { backgroundColor: '#dc3545', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', margin: '0.2rem' },
    remove: { backgroundColor: '#ffc107', color: '#000', padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', margin: '0.2rem' },
  };

  const handleValidateOrder = async () => {
    const token = localStorage.getItem('olympics_auth_token');
    if (!token) { alert('Veuillez vous connecter'); navigate('/login'); return; }
    if (items.length === 0) { alert("Votre panier est vide !"); return; }

    setLoading(true);
    try {
      const validatedItems = items.map(item => ({
        eventId: item.eventId,
        eventTitle: item.eventTitle || 'Titre non disponible',
        offerTypeId: item.offerTypeId,
        offerTypeName: item.offerName || 'Offre non disponible',
        quantity: item.quantity || 1,
        unitPrice: item.priceUnit || 0,
        totalPrice: (item.priceUnit || 0) * (item.quantity || 1)
      }));

      const cartBody = { items: validatedItems, totalPrice };
      const response = await fetch(`${API_URL}/api/cart/validate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token.replace('Bearer ', '')}`, "Content-Type": "application/json" },
        body: JSON.stringify(cartBody)
      });

      if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else { alert("✅ Commande validée !"); clearCart(); navigate('/public-events'); }

    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de la validation de la commande");
    } finally { setLoading(false); }
  };

  const handleContinueShopping = () => {
    const token = localStorage.getItem('olympics_auth_token');
    if (!token) navigate('/login'); else navigate('/public-events');
  };

  const handleClearCart = () => { if (window.confirm("Vider tout le panier ?")) clearCart(); };
  const handleRemoveItem = (eventId, offerTypeId) => { if (window.confirm("Supprimer cet article ?")) removeItem(eventId, offerTypeId); };

  if (items.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Votre panier est vide</h2>
        <p>Explorez nos événements et ajoutez des billets.</p>
        <button style={buttonStyles.continue} onClick={handleContinueShopping}>Découvrir les événements</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Votre panier ({items.length} article(s))</h2>

      <div>
        {items.map((item, index) => (
          <div key={`${item.eventId}-${item.offerTypeId}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '6px' }}>
            <div>
              <h3>{item.eventTitle}</h3>
              <p>{item.offerName}</p>
              <span>Quantité: {item.quantity}</span> | <span>{item.priceUnit?.toFixed(2)} € l'unité</span>
              <div>Sous-total: {(item.priceUnit * item.quantity).toFixed(2)} €</div>
            </div>
            <button style={buttonStyles.remove} onClick={() => handleRemoveItem(item.eventId, item.offerTypeId)} disabled={loading}>×</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Total: {totalPrice.toFixed(2)} €</div>
        <button style={buttonStyles.validate} onClick={handleValidateOrder} disabled={loading}>{loading ? 'Traitement...' : 'Valider la commande'}</button>
        <div style={{ marginTop: '1rem' }}>
          <button style={buttonStyles.continue} onClick={handleContinueShopping} disabled={loading}>Continuer mes achats</button>
          <button style={buttonStyles.clear} onClick={handleClearCart} disabled={loading}>Vider le panier</button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
