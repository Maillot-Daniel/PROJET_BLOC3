import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";


function UpdateEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Charger les données de l'événement à modifier
    async function fetchEvent() {
      try {
        setLoading(true);
        const response = await EventsService.getEventById(eventId);
        setEventData({
          title: response.title || "",
          date: response.date || "",
          location: response.location || "",
          description: response.description || "",
        });
      } catch (err) {
        setError("Erreur lors du chargement de l'événement");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await EventsService.updateEvent(eventId, eventData);
      alert("Événement mis à jour avec succès !");
      navigate("/admin/events");
    } catch (err) {
      setError("Erreur lors de la mise à jour de l'événement");
    }
  };

  if (loading) return <p>Chargement de l'événement...</p>;
  if (error) return <p>{error}</p>;

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

        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  );
}

export default UpdateEvent;
