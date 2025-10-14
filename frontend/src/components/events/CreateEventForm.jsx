import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateEventForm() {
  const [event, setEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    totalTickets: '',
    image: ''
  });

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'totalTickets' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvent(prev => ({
        ...prev,
        image: file.name
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('olympics_auth_token');
    if (!token) {
      alert("Veuillez vous connecter");
      navigate('/login');
      return;
    }

    if (!event.title || !event.description || !event.date || !event.location || event.price === '' || event.totalTickets === '') {
      alert("Tous les champs sont obligatoires");
      return;
    }

    const today = new Date();
    const eventDate = new Date(event.date);
    if (eventDate <= today) {
      alert("La date de l'événement doit être dans le futur");
      return;
    }

    const formattedEvent = {
      ...event,
      date: event.date + "T00:00:00",
      // Chemin relatif depuis la racine du frontend
      image: event.image ? `/images/events/${event.image}` : '/images/events/default-event.jpg'
    };

    try {
      await axios.post(`${API_URL}/api/events`, formattedEvent, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Événement créé avec succès');
      setEvent({
        title: '',
        description: '',
        date: '',
        location: '',
        price: '',
        totalTickets: '',
        image: ''
      });
    } catch (err) {
      console.error("Erreur API création événement :", err.response?.data || err.message);
      const message = err.response?.data?.message || err.message;
      if (err.response?.status === 403) {
        alert('Permission refusée : vous devez être administrateur.');
      } else {
        alert('Erreur lors de la création de l\'événement : ' + message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-event-form">
      <h2>Créer un événement</h2>

      <input
        name="title"
        placeholder="Titre"
        value={event.title}
        onChange={handleChange}
        required
      />

      <textarea
        name="description"
        placeholder="Description"
        value={event.description}
        onChange={handleChange}
        required
      />

      <input
        type="date"
        name="date"
        value={event.date}
        onChange={handleChange}
        required
      />

      <input
        name="location"
        placeholder="Lieu"
        value={event.location}
        onChange={handleChange}
        required
      />

      <input
        type="number"
        name="price"
        placeholder="Prix"
        value={event.price}
        onChange={handleChange}
        min="0"
        step="0.01"
        required
      />

      <input
        type="number"
        name="totalTickets"
        placeholder="Nombre total de tickets"
        value={event.totalTickets}
        onChange={handleChange}
        min="0"
        required
      />

      <div className="form-group">
        <label htmlFor="image">Image de l'événement :</label>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
        />
        {event.image && (
          <div className="image-info">
            <p>Image sélectionnée : <strong>{event.image}</strong></p>
            <p className="instruction">
              ⚠️ Copiez manuellement cette image dans : <code>frontend/public/images/events/</code>
            </p>
          </div>
        )}
      </div>

      <button type="submit">Créer</button>
    </form>
  );
}

export default CreateEventForm;