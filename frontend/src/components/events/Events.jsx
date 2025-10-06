import { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../../context/CartContext'; 
import { useNavigate } from 'react-router-dom';
import "./Events.css";

const OFFERS = [
  { id: 1, name: 'Solo', people: 1, multiplier: 1 },
  { id: 2, name: 'Duo', people: 2, multiplier: 1.9 },
  { id: 3, name: 'Famille', people: 4, multiplier: 3.5 }
];

function Events() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addItem } = useCart();
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/events`);
        const data = Array.isArray(res.data.content) ? res.data.content : res.data;

        // Assurer que remainingTickets est un nombre
        const eventsWithTickets = data.map(ev => ({
          ...ev,
          remainingTickets: Number(ev.remainingTickets ?? ev.remaining_tickets ?? ev.tickets_remaining) || 0
        }));

        setEvents(eventsWithTickets);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des événements");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [API_URL]);

  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

  const handleAddToCart = () => {
    if (!selectedOfferId) return alert("Choisissez une offre");
    if (!selectedEvent) return alert("Aucun événement sélectionné");

    const offer = OFFERS.find(o => o.id === parseInt(selectedOfferId));
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

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Liste des événements</h2>
      <ul className="events-list">
        {events.map(event => (
          <li key={event.id}>
            <img src={event.image_url} alt={event.title} loading="lazy" />
            <strong>{event.title}</strong> - {formatter.format(event.price)}
            <p>Places disponibles : {event.remainingTickets}</p>
            <button onClick={() => { setSelectedEvent(event); setSelectedOfferId(''); setQuantity(1); }}>
              Acheter
            </button>
          </li>
        ))}
      </ul>

      {selectedEvent && (
        <div className="purchase-section">
          <h3>Achat pour : {selectedEvent.title}</h3>
          <label>
            Offre : 
            <select
              value={selectedOfferId}
              onChange={e => { setSelectedOfferId(e.target.value); setQuantity(1); }}
            >
              <option value="">-- Choisir une offre --</option>
              {OFFERS.map(offer => (
                <option key={offer.id} value={offer.id}>
                  {offer.name} ({offer.people} pers.) - {formatter.format(selectedEvent.price * offer.multiplier)}
                </option>
              ))}
            </select>
          </label>
          <br />
          <label>
            Quantité (max {selectedOfferId ? Math.floor(selectedEvent.remainingTickets / OFFERS.find(o => o.id === parseInt(selectedOfferId)).people) : '-'}) :
            <input 
              type="number" 
              min="1" 
              step="1"
              value={quantity} 
              onChange={e => {
                if (!selectedOfferId) return;
                const val = Math.floor(Number(e.target.value));
                const offer = OFFERS.find(o => o.id === parseInt(selectedOfferId));
                const maxQty = Math.floor(selectedEvent.remainingTickets / offer.people);
                setQuantity(Math.max(1, Math.min(val, maxQty)));
              }}
            />
          </label>
          <br />
          <p>
            Prix total : {selectedOfferId 
              ? formatter.format(selectedEvent.price * OFFERS.find(o => o.id === parseInt(selectedOfferId)).multiplier * quantity) 
              : formatter.format(0)}
          </p>
          <button onClick={handleAddToCart} disabled={!selectedOfferId || quantity < 1}>Ajouter au panier</button>
          <button onClick={() => setSelectedEvent(null)} className="cancel-button">Annuler</button>
        </div>
      )}
    </div>
  );
}

export default Events;
