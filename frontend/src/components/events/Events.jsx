import { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../../context/CartContext'; 
import { useNavigate } from 'react-router-dom';
import "./Events.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addItem } = useCart();
  const navigate = useNavigate();
  
  const API_URL = "https://projet-bloc3.onrender.com";

  useEffect(() => {
    const STATIC_OFFERS = [
      { id: 1, name: 'SOLO', people: 1, multiplier: 1 },
      { id: 2, name: 'DUO', people: 2, multiplier: 1.9 },
      { id: 3, name: 'FAMILLE', people: 4, multiplier: 3.5 }
    ];

    const fetchData = async () => {
      try {
        const eventsRes = await axios.get(`${API_URL}/api/events`);
        const eventsData = Array.isArray(eventsRes.data.content) ? eventsRes.data.content : eventsRes.data;

        const eventsWithTickets = eventsData.map(ev => ({
          ...ev,
          remainingTickets: Number(ev.remainingTickets ?? ev.remaining_tickets ?? ev.tickets_remaining) || 0,
          image: ev.image || '/images/events/default-event.jpg'
        }));

        setEvents(eventsWithTickets);

        try {
          const offersRes = await axios.get(`${API_URL}/api/offer_types`);
          console.log('✅ Offres chargées depuis API:', offersRes.data);
          setOffers(offersRes.data);
        } catch (offersErr) {
          console.error('❌ Erreur chargement offres, utilisation du fallback:', offersErr);
          setOffers(STATIC_OFFERS);
        }

      } catch (err) {
        console.error('Erreur chargement événements:', err);
        setError("Erreur lors du chargement des événements");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

  const handleAddToCart = () => {
    if (!selectedOfferId) return alert("Choisissez une offre");
    if (!selectedEvent) return alert("Aucun événement sélectionné");

    const offer = offers.find(o => o.id === parseInt(selectedOfferId));
    if (!offer) return alert("Offre invalide");

    const maxAllowed = Math.floor(selectedEvent.remainingTickets / offer.people);
    if (quantity > maxAllowed) return alert(`Quantité trop élevée. Maximum possible pour cette offre : ${maxAllowed}`);

    const token = localStorage.getItem('olympics_auth_token');
    if (!token) {
      alert("Veuillez vous connecter");
      navigate('/login');
      return;
    }

    const itemToAdd = {
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      eventImage: selectedEvent.image,
      offerTypeId: offer.id,
      offerName: offer.name,
      quantity,
      priceUnit: selectedEvent.price * offer.multiplier
    };

    addItem(itemToAdd);
    alert("Ajouté au panier !");
    setSelectedEvent(null);
    setSelectedOfferId('');
    setQuantity(1);
    navigate('/cart');
  };

  if (loading) return <div className="loading">Chargement des événements...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="events-page">
      <h2>Événements Olympiques</h2>
      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-image-container">
              <img 
                src={event.image} 
                alt={event.title}
                className="event-image"
                onError={(e) => {
                  e.target.src = '/images/events/default-event.jpg';
                }}
              />
              {event.remainingTickets === 0 && (
                <div className="sold-out-badge">COMPLET</div>
              )}
            </div>
            <div className="event-info">
              <h3>{event.title}</h3>
              <p className="event-description">{event.description}</p>
              <div className="event-details">
                <p><strong>📍 {event.location}</strong></p>
                <p className="event-price">{formatter.format(event.price)}</p>
                <p className={`event-tickets ${event.remainingTickets < 10 ? 'low-tickets' : ''}`}>
                  🎫 {event.remainingTickets} place(s) disponible(s)
                </p>
              </div>
              <button 
                className={`buy-btn ${event.remainingTickets === 0 ? 'disabled' : ''}`}
                onClick={() => { 
                  setSelectedEvent(event); 
                  setSelectedOfferId(''); 
                  setQuantity(1); 
                }}
                disabled={event.remainingTickets === 0}
              >
                {event.remainingTickets === 0 ? 'COMPLET' : 'Réserver'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <div className="purchase-modal">
          <div className="purchase-content">
            <button 
              className="close-modal"
              onClick={() => setSelectedEvent(null)}
            >
              ×
            </button>
            
            <h3>Réserver : {selectedEvent.title}</h3>
            
            <div className="selected-event-info">
              <img 
                src={selectedEvent.image} 
                alt={selectedEvent.title}
                className="selected-event-image"
              />
              <div className="selected-event-details">
                <p><strong>Lieu:</strong> {selectedEvent.location}</p>
                <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p><strong>Places disponibles:</strong> {selectedEvent.remainingTickets}</p>
              </div>
            </div>

            <div className="purchase-form">
              <div className="form-group">
                <label>Type d'offre :</label>
                <select
                  value={selectedOfferId}
                  onChange={e => { setSelectedOfferId(e.target.value); setQuantity(1); }}
                >
                  <option value="">-- Choisir une offre --</option>
                  {offers.map(offer => (
                    <option key={offer.id} value={offer.id}>
                      {offer.name} ({offer.people} personne(s)) - {formatter.format(selectedEvent.price * offer.multiplier)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOfferId && (
                <div className="form-group">
                  <label>
                    Quantité d'offres :
                    <input 
                      type="number" 
                      min="1" 
                      step="1"
                      value={quantity} 
                      onChange={e => {
                        const val = Math.floor(Number(e.target.value));
                        const offer = offers.find(o => o.id === parseInt(selectedOfferId));
                        if (!offer) return;
                        const maxQty = Math.floor(selectedEvent.remainingTickets / offer.people);
                        setQuantity(Math.max(1, Math.min(val, maxQty)));
                      }}
                    />
                  </label>
                  <small>
                    Maximum: {Math.floor(selectedEvent.remainingTickets / offers.find(o => o.id === parseInt(selectedOfferId))?.people || 1)} 
                    offre(s) - Soit {quantity * offers.find(o => o.id === parseInt(selectedOfferId))?.people} place(s)
                  </small>
                </div>
              )}

              {selectedOfferId && (
                <div className="total-price">
                  <strong>
                    Total : {formatter.format(selectedEvent.price * (offers.find(o => o.id === parseInt(selectedOfferId))?.multiplier || 1) * quantity)}
                  </strong>
                </div>
              )}

              <div className="purchase-actions">
                <button 
                  onClick={handleAddToCart} 
                  disabled={!selectedOfferId || quantity < 1}
                  className="add-to-cart-btn"
                >
                  🛒 Ajouter au panier
                </button>
                <button 
                  onClick={() => setSelectedEvent(null)} 
                  className="cancel-button"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;