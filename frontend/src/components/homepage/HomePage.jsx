import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../homepage/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [lastThreeEvents, setLastThreeEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ URL API FIXE - Plus d'erreur REACT_APP_API_URL
  const API_URL = "https://projet-bloc3.onrender.com";

  useEffect(() => {
    fetchLastThreeEvents();
  }, []);

  const fetchLastThreeEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/events`);
      const events = response.data.content || response.data;

      // Trier par date décroissante
      const sorted = events
        .filter(event => event.date && !isNaN(new Date(event.date)))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Garder les 3 derniers
      setLastThreeEvents(sorted.slice(0, 3));
    } catch (err) {
      console.error("Erreur lors du chargement des événements récents :", err);
      setError("Impossible de charger les événements. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleReserveClick = () => navigate('/public-events');
  const handleLearnMore = () => navigate('/public-events');
  const handleAdventureReserve = () => navigate('/public-events');

  const handleEventClick = (id) => {
    navigate(`/public-events?id=${id}`);
  };

  return (
    <div className="homepage">
      {/* Section Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Bienvenue aux Jeux Olympiques France 2024</h1>
          <p className="hero-description">
            Dans l'univers des Jeux Olympiques, chaque événement est unique. 
            L'excellence et l'esprit de découverte se rencontrent pour créer 
            des expériences inoubliables.
          </p>

          <div className="hero-values">
            <span>UNITÉ ET PAIX</span>
            <span>EXCELLENCE SPORTIVE</span>
            <span>COMMUNAUTÉ MONDIALE</span>
          </div>

          <div className="hero-cta">
            <button className="cta-primary" onClick={handleReserveClick}>
              RÉSERVEZ VOS BILLETS →
            </button>
            <button className="cta-secondary" onClick={handleLearnMore}>
              EN SAVOIR PLUS
            </button>
          </div>
        </div>
      </section>

      {/* Section Épreuves phares */}
      <section className="featured-events">
        <h2>Les épreuves phares</h2>
        <p className="section-subtitle">
          Découvrez les moments les plus attendus des Jeux Olympiques 2024
        </p>

        <div className="events-grid">
          {loading && <p>Chargement des événements...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && lastThreeEvents.length === 0 && <p>Aucun événement disponible.</p>}
          {!loading && !error && lastThreeEvents.map(event => (
            <div 
              key={event.id}
              className="event-card"
              onClick={() => handleEventClick(event.id)}
              style={{ cursor: "pointer" }}
            >
              {event.imageUrl && (
                <img 
                  src={`${API_URL}${event.imageUrl}`} 
                  alt={event.title} 
                  className="event-image"
                />
              )}
              <h3>{event.title}</h3>
              <p>{event.description}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="separator" />

      {/* Section Rejoignez l'aventure */}
      <section className="join-adventure">
        <div className="adventure-content">
          <h2>Rejoignez l'aventure des Jeux Olympiques</h2>
          <p>Vivez l'excitation, soutenez vos athlètes favoris et faites partie de l'histoire.</p>

          <div className="highlights">
            <div className="highlight-item">
              <h4>Moments inoubliables</h4>
              <p>Athlètes en action</p>
            </div>
            <div className="highlight-item">
              <h4>Voltige historique</h4>
              <p>Découvertes époustouflantes</p>
            </div>
          </div>

          <div className="adventure-cta">
            <button className="cta-primary" onClick={handleAdventureReserve}>
              Réservez vos billets
            </button>
            <button className="cta-secondary" onClick={handleLearnMore}>
              En savoir plus
            </button>
          </div>
        </div>
      </section>

      {/* Section Billetterie */}
      <section className="ticketing">
        <h2>BILLETTERIE</h2>
        <p className="section-subtitle">Comment réserver vos places</p>
        <p className="ticketing-description">
          Suivez ces étapes simples pour garantir votre présence aux Jeux Olympiques 2024.
        </p>

        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Créer un compte</h3>
            <p>Inscrivez-vous en quelques clics pour accéder à la billetterie.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Choisir vos événements</h3>
            <p>Sélectionnez les épreuves que vous souhaitez voir.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Confirmer votre réservation</h3>
            <p>Finalisez votre achat et préparez-vous à vivre un moment unique.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;