import { useEffect, useState } from 'react';
import axios from 'axios';
import './OffersGestion.css';

function OffersGestion() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const token = localStorage.getItem('olympics_auth_token');

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/offer_types`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const rawOffers = Array.isArray(res.data.content) ? res.data.content : res.data;
      setOffers(rawOffers);
    } catch (err) {
      console.error('Erreur lors de la récupération des offres :', err);
      setError('Impossible de récupérer les offres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!token) return alert("Vous devez être connecté pour supprimer une offre");
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) return;

    try {
      await axios.delete(`${API_URL}/api/offer_types/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setOffers(offers.filter(o => o.id !== id));
      alert('Offre supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression de l’offre :', err);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <div>Chargement des offres...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="offers-container">
      <h2>Liste des Offres</h2>
      {offers.length === 0 && <p>Aucune offre trouvée.</p>}

      <table className="offers-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Nombre de personnes</th>
            <th>Multiplicateur</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map(offer => (
            <tr key={offer.id}>
              <td>{offer.name}</td>
              <td>{offer.people}</td>
              <td>{offer.multiplier}</td>
              <td>
                {/* Ici tu peux ajouter un bouton pour modifier si nécessaire */}
                <button onClick={() => handleDelete(offer.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OffersGestion;
