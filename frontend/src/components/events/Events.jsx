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

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await axios.get('http://localhost:8080/api/events');
        const data = Array.isArray(res.data.content) ? res.data.content : [];
        setEvents(data);
      } catch (err) {
        setError("Erreur lors du chargement des événements");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });

  const handleAddToCart = () => {
    if (!selectedOfferId) {
      alert("Choisissez une offre");
      return;
    }
    if (quantity < 1 || !Number.isInteger(quantity)) {
      alert("Veuillez saisir une quantité valide (entier >= 1)");
      return;
    }
    if (!selectedEvent) {
      alert("Aucun événement sélectionné");
      return;
    }

    const offer = OFFERS.find(o => o.id === parseInt(selectedOfferId));
    if (!offer) {
      alert("Offre invalide");
      return;
    }

    // Vérification stock côté frontend (préventive)
    const maxAllowed = Math.floor(selectedEvent.remainingTickets / offer.people);
    if (quantity > maxAllowed) {
      alert(`Quantité trop élevée. Maximum possible pour cette offre : ${maxAllowed}`);
      return;
    }

    const token = localStorage.getItem('olympics_auth_token');
    if (!token) {
      alert("Veuillez vous connecter");
      navigate('/login');
      return;
    }

    // Ajout dans le panier via le contexte
    const itemToAdd = {
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      offerTypeId: offer.id,
      offerName: offer.name,
      quantity: quantity,
      priceUnit: selectedEvent.price * offer.multiplier
    };

    addItem(itemToAdd);

    alert("Ajouté au panier !");
    setSelectedEvent(null);
    setSelectedOfferId('');
    setQuantity(1);

    // Redirection vers la page panier
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
            <img 
              src={event.image_url} 
              alt={event.title} 
              loading="lazy"
            />
            <strong>{event.title}</strong> - {formatter.format(event.price)}
            <p>Places disponibles : {event.remainingTickets}</p>
            <button onClick={() => {
              setSelectedEvent(event);
              setSelectedOfferId('');
              setQuantity(1);
            }}>
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
              onChange={e => {
                setSelectedOfferId(e.target.value);
                setQuantity(1); // reset qty on offer change
              }}
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
                const val = Number(e.target.value);
                if (!selectedOfferId) return; // pas d'offre choisie => pas de modif
                const offer = OFFERS.find(o => o.id === parseInt(selectedOfferId));
                const maxQty = Math.floor(selectedEvent.remainingTickets / offer.people);
                if (val >= 1 && val <= maxQty) setQuantity(Math.floor(val));
                else if (val > maxQty) setQuantity(maxQty);
                else setQuantity(1);
              }}
            />
          </label>
          <br />
          <p>
            Prix total : {selectedOfferId 
              ? formatter.format(selectedEvent.price * OFFERS.find(o => o.id === parseInt(selectedOfferId)).multiplier * quantity) 
              : formatter.format(0)}
          </p>
          <button 
            onClick={handleAddToCart}
            disabled={!selectedOfferId || quantity < 1}
          >
            Ajouter au panier
          </button>
          <button onClick={() => setSelectedEvent(null)} className="cancel-button">
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

export default Events; 