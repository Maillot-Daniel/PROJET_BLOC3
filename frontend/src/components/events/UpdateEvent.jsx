import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function UpdateEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
    price: 0,
    totalTickets: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  // Charger les données de l'événement
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("olympics_auth_token");
        if (!token) {
          alert("Veuillez vous connecter");
          navigate("/login");
          return;
        }

        const res = await axios.get(`${API_URL}/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ev = res.data;
        setEventData({
          title: ev.title || "",
          date: ev.date ? ev.date.slice(0, 10) : "",
          location: ev.location || "",
          description: ev.description || "",
          price: ev.price || 0,
          totalTickets: ev.totalTickets || ev.remainingTickets || 0
        });
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l'événement");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, navigate, API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "totalTickets" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("olympics_auth_token");
      if (!token) {
        alert("Veuillez vous connecter");
        navigate("/login");
        return;
      }

      await axios.put(`${API_URL}/api/events/${eventId}`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Événement mis à jour avec succès !");
      navigate("/admin/events");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour de l'événement");
    }
  };

  if (loading) return <p>Chargement de l'événement...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Modifier un événement</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Titre :
          <input
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Date :
          <input
            type="date"
            name="date"
            value={eventData.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Lieu :
          <input
            type="text"
            name="location"
            value={eventData.location}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description :
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Prix (€) :
          <input
            type="number"
            name="price"
            value={eventData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </label>

        <label>
          Nombre de tickets :
          <input
            type="number"
            name="totalTickets"
            value={eventData.totalTickets}
            onChange={handleChange}
            min="0"
            required
          />
        </label>

        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  );
}

export default UpdateEvent;
