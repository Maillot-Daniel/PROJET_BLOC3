import './OffersPage.css';

const OffersPage = () => (
  <div className="offers-page">
    <h1>Nos Offres de Billets</h1>
    <div className="offer-list">
      <div className="offer-card">
        <h2>Formule Solo</h2>
        <p>Idéal pour vivre l’expérience olympique en toute liberté.</p>
        <ul>
          <li>1 billet pour l’événement de votre choix</li>
          <li>Accès rapide et sécurisé</li>
        </ul>
      </div>

      <div className="offer-card">
        <h2>Formule Duo</h2>
        <p>Venez partager les Jeux Olympiques avec un proche, avec un petit plus !</p>
        <ul>
          <li>2 billets pour le même événement</li>
          <li>Accès à une zone dédiée Duo</li>
          <li>Un souvenir offert par personne</li>
        </ul>
      </div>

      <div className="offer-card">
        <h2>Formule Famille</h2>
        <p>Pour vivre ensemble des moments inoubliables aux Jeux Olympiques.</p>
        <ul>
          <li>4 billets pour le même événement</li>
          <li>Tarif réduit famille</li>
          <li>Pack goodies enfants inclus</li>
        </ul>
      </div>
    </div>
  </div>
);

export default OffersPage;
