import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../homepage/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [lastThreeEvents, setLastThreeEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "https://projet-bloc3.onrender.com";

  useEffect(() => {
    fetchLastThreeEvents();
  }, []);

  const fetchLastThreeEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/events`);
      const eventsData = Array.isArray(response.data.content) ? response.data.content : response.data;

      
      const formattedEvents = eventsData.map(event => ({
        ...event,
        remainingTickets: Number(event.remainingTickets ?? event.remaining_tickets ?? event.tickets_remaining) || 0,
        image: event.image || '/images/events/default-event.jpg'
      }));

    
      const sorted = formattedEvents
        .filter(event => event.date && !isNaN(new Date(event.date)))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setLastThreeEvents(sorted.slice(0, 3));
    } catch (err) {
      console.error("Erreur lors du chargement des événements récents :", err);
      setError("Impossible de charger les événements. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleReserveClick = () => navigate('/public-events');
  const handleLearnMore = () => {
    
    const aboutSection = document.getElementById('about-section');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const handleAdventureReserve = () => navigate('/public-events');

  const handleEventClick = (id) => {
    navigate(`/public-events?id=${id}`);
  };

  return (
    <div className="homepage">
      {/* Section Hero */}
      <section className="hero">
        <div className="hero-background">
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
                  <p className="event-tickets">
                    🎫 {event.remainingTickets} place(s) disponible(s)
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="separator" />

      {/* Section Rejoignez l'aventure */}
      <section className="join-adventure">
        <div className="adventure-background">
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
              <button className="cta-secondary-black" onClick={handleLearnMore}>
                En savoir plus
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section Billetterie */}
      <section className="ticketing">
        <div className="ticketing-background">
          <div className="ticketing-content">
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
          </div>
        </div>
      </section>

      {/* Section À propos dans le footer */}
      <footer className="home-footer" id="about-section">
        <div className="footer-background">
          <div className="footer-content">
            <h2>À Propos des Jeux Olympiques 2024</h2>
            <div className="about-grid">
              <div className="about-item">
                <h3>Notre Mission</h3>
                <p>Organiser des Jeux Olympiques inclusifs, durables et mémorables qui célèbrent l'excellence sportive et l'unité mondiale.</p>
              </div>
              <div className="about-item">
                <h3>Engagement</h3>
                <p>Nous nous engageons à créer un événement respectueux de l'environnement et bénéfique pour les communautés locales.</p>
              </div>
              <div className="about-item">
                <h3>Héritage</h3>
                <p>Les Jeux Olympiques Paris 2024 laisseront un héritage durable pour les générations futures de sportifs et de supporters.</p>
              </div>
            </div>
            
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;