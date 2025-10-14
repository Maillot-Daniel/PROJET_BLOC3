import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./UpdateEvent.css";

function UpdateEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
    price: 0,
    totalTickets: 0,
    image: "/images/events/default-event.jpg", // Image par défaut
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState("/images/events/default-event.jpg");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  // --- Chargement de l'événement existant ---
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
        const eventDate = ev.date ? ev.date.slice(0, 10) : "";

        setEventData({
          title: ev.title || "",
          date: eventDate,
          location: ev.location || "",
          description: ev.description || "",
          price: ev.price || 0,
          totalTickets: ev.totalTickets || ev.remainingTickets || 0,
          image: ev.image || "/images/events/default-event.jpg",
        });

        setImagePreview(ev.image || "/images/events/default-event.jpg");
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l'événement");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate, API_URL]);

  // --- Gestion des champs ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "totalTickets" ? Number(value) : value,
    }));

    if (name === "image") {
      setImagePreview(value || "/images/events/default-event.jpg");
    }
  };

  // --- Gestion du fichier image ---
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name;
      const imagePath = `/images/events/${fileName}`;
      setEventData((prev) => ({ ...prev, image: imagePath }));
      setImagePreview(imagePath);

      alert(`⚠️ N'oubliez pas de copier "${fileName}" dans le dossier public/images/events/`);
    }
  };

  // --- Soumission du formulaire ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventData.title || !eventData.date || !eventData.location || !eventData.description) {
      alert("Tous les champs obligatoires doivent être remplis");
      return;
    }

    try {
      const token = localStorage.getItem("olympics_auth_token");
      if (!token) {
        alert("Veuillez vous connecter");
        navigate("/login");
        return;
      }

      const updatedEvent = {
        ...eventData,
        image: eventData.image || "/images/events/default-event.jpg",
      };

      await axios.put(`${API_URL}/api/events/${eventId}`, updatedEvent, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Événement mis à jour avec succès !");
      navigate("/admin/events");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour de l'événement");
      alert("Erreur lors de la mise à jour de l'événement");
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <p>Chargement de l'événement...</p>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate("/admin/events")} className="back-btn">
          Retour
        </button>
      </div>
    );

  return (
    <div className="update-event-form">
      <div className="form-header">
        <h2>Modifier l'événement</h2>
        <button onClick={() => navigate("/admin/events")} className="back-button">
          ← Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-section">
          <label>Titre *</label>
          <input
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            required
          />

          <label>Description *</label>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleChange}
            required
            rows="4"
          />
        </div>

        <div className="form-section">
          <label>Date *</label>
          <input
            type="date"
            name="date"
            value={eventData.date}
            onChange={handleChange}
            required
          />

          <label>Lieu *</label>
          <input
            type="text"
            name="location"
            value={eventData.location}
            onChange={handleChange}
            required
          />

          <label>Prix (€) *</label>
          <input
            type="number"
            name="price"
            value={eventData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />

          <label>Nombre de tickets *</label>
          <input
            type="number"
            name="totalTickets"
            value={eventData.totalTickets}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div className="form-section">
          <h3>Image de l'événement</h3>

          <div className="image-preview">
            <img
              src={imagePreview}
              alt="Aperçu"
              onError={(e) => (e.target.src = "/images/events/default-event.jpg")}
              style={{ width: "150px", borderRadius: "6px" }}
            />
          </div>

          <label>Choisir une image :</label>
          <input type="file" accept="image/*" onChange={handleImageFileChange} />

          <label>Ou saisir le chemin manuellement :</label>
          <input
            type="text"
            name="image"
            value={eventData.image}
            onChange={handleChange}
            placeholder="/images/events/nom-image.jpg"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn">
            💾 Mettre à jour
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/admin/events")}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default UpdateEvent;
