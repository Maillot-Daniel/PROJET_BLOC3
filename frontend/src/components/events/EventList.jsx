import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './EventList.css';

function EventList() {
  const [events, setEvents] = useState([]);
  const [editEvent, setEditEvent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: 0,
    totalTickets: 0
  });

  const navigate = useNavigate();
  const location = useLocation();
  const refs = useRef({}); // Pour scroller vers un event

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const token = localStorage.getItem('olympics_auth_token');

  // 🔹 Récupération des événements
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events`);
      const rawEvents = res.data.content || res.data;

      const eventsWithTickets = rawEvents.map(ev => ({
        ...ev,
        totalTickets: Number(ev.remainingTickets ?? ev.remaining_tickets ?? ev.tickets_remaining) || 0
      }));

      setEvents(eventsWithTickets);
    } catch (err) {
      console.error('Erreur lors de la récupération des événements :', err);
      alert('Impossible de récupérer les événements.');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 🔹 Scroll vers un événement si ID dans l'URL
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const id = query.get('id');
    if (id && refs.current[id]) {
      refs.current[id].scrollIntoView({ behavior: 'smooth', block: 'center' });
      refs.current[id].classList.add('highlight-event');
      setTimeout(() => refs.current[id]?.classList.remove('highlight-event'), 3000);
    }
  }, [events, location.search]);

  // 🔹 Supprimer un événement
  const handleDelete = async (id) => {
    if (!token) return navigate('/login');
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      await axios.delete(`${API_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(events.filter(event => event.id !== id));
      alert('Événement supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression :', err);
      alert('Erreur lors de la suppression');
    }
  };

  // 🔹 Cliquer sur modifier
  const handleEditClick = (event) => {
    setEditEvent(event);
    const formattedDate = new Date(event.date).toISOString().slice(0, 16);
    setEditFormData({
      title: event.title,
      description: event.description,
      date: formattedDate,
      location: event.location,
      price: event.price,
      totalTickets: event.totalTickets
    });
  };

  // 🔹 Modifier formulaire
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'price' ? parseFloat(value) :
              name === 'totalTickets' ? parseInt(value, 10) :
              value
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!token) return navigate('/login');

    try {
      const res = await axios.put(`${API_URL}/api/events/${editEvent.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      setEvents(events.map(ev => ev.id === editEvent.id ? res.data : ev));
      setEditEvent(null);
      alert('Événement mis à jour avec succès');
    } catch (err) {
      console.error('Erreur lors de la mise à jour :', err);
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="event-list-container">
      <h2>Liste des Événements</h2>

      {editEvent && (
        <div className="edit-form-overlay">
          <div className="edit-form-container">
            <h3>Modifier l'événement</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Titre :</label>
                <input type="text" name="title" value={editFormData.title} onChange={handleEditChange} required />
              </div>

              <div className="form-group">
                <label>Description :</label>
                <textarea name="description" value={editFormData.description} onChange={handleEditChange} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date et Heure :</label>
                  <input type="datetime-local" name="date" value={editFormData.date} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Lieu :</label>
                  <input type="text" name="location" value={editFormData.location} onChange={handleEditChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prix (€) :</label>
                  <input type="number" name="price" min="0" step="0.01" value={editFormData.price} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Places restantes :</label>
                  <input type="number" name="totalTickets" min="0" value={editFormData.totalTickets} onChange={handleEditChange} required />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">Enregistrer</button>
                <button type="button" className="cancel-btn" onClick={() => setEditEvent(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="events-grid">
        {events.length > 0 ? events.map(event => (
          <div className="event-card" key={event.id} ref={el => (refs.current[event.id] = el)}>
            <div className="card-header">
              <h3>{event.title}</h3>
              <p className="event-date">
                {new Date(event.date).toLocaleString('fr-FR', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <div className="card-body">
              <p className="event-description">{event.description}</p>
              <div className="event-details">
                <p><strong>Lieu:</strong> {event.location}</p>
                <p><strong>Prix:</strong> {event.price.toFixed(2)} €</p>
                <p className={event.totalTickets === 0 ? 'sold-out' : event.totalTickets < 10 ? 'low-tickets' : ''}>
                  <strong>Places restantes :</strong> {event.totalTickets === 0 ? 'Complet' : event.totalTickets}
                </p>
              </div>
            </div>
            <div className="card-actions">
              <button className="edit-btn" onClick={() => handleEditClick(event)}>Modifier</button>
              <button className="delete-btn" onClick={() => handleDelete(event.id)}>Supprimer</button>
            </div>
          </div>
        )) : <p>Aucun événement trouvé.</p>}
      </div>
    </div>
  );
}

export default EventList;
