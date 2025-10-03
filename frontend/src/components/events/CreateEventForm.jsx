import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateEventForm() {
  const [event, setEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: null,
    totalTickets: null
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent(prev => ({
      ...prev,
      [name]: (name === 'price' || name === 'totalTickets') ? (value === '' ? null : Number(value)) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('olympics_auth_token');
    if (!token) {
      alert("Veuillez vous connecter");
      navigate('/login');
      return;
    }

    // Validation que la date est dans le futur
    const today = new Date();
    const eventDate = new Date(event.date);
    if (eventDate <= today) {
      alert("La date de l'événement doit être dans le futur");
      return;
    }

    // Formatage de la date au format ISO complet
    const formattedEvent = {
      ...event,
      date: event.date ? event.date + "T00:00:00" : null
    };

    console.log("Données envoyées au serveur :", formattedEvent);

    try {
      await axios.post('http://localhost:8080/api/events', formattedEvent, {
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
        price: null,
        totalTickets: null
      });
    } catch (err) {
      console.error("Erreur API création événement :", err.response?.data || err.message);
      if (err.response?.status === 403) {
        alert('Permission refusée : vous devez être administrateur.');
      } else {
        alert('Erreur lors de la création de l’événement : ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
        value={event.price !== null ? event.price : ''}
        onChange={handleChange}
        min="0"
        step="0.01"
        required
      />

      <input
        type="number"
        name="totalTickets"
        placeholder="Nombre total de tickets"
        value={event.totalTickets !== null ? event.totalTickets : ''}
        onChange={handleChange}
        min="0"
        required
      />

      <button type="submit">Créer</button>
    </form>
  );
}

export default CreateEventForm;
