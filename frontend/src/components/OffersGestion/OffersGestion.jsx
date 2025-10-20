import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './OffersGestion.css';

// Données statiques de secours
const STATIC_OFFERS = [
  { id: 1, name: 'SOLO', people: 1, multiplier: 1 },
  { id: 2, name: 'DUO', people: 2, multiplier: 1.9 },
  { id: 3, name: 'FAMILLE', people: 4, multiplier: 3.5 }
];

function OffersGestion() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    people: '',
    multiplier: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const token = localStorage.getItem('olympics_auth_token');

  const testAPI = useCallback(async () => {
    try {
      // Test 1: Sans authentification
      try {
        const testRes = await axios.get(`${API_URL}/api/offer_types`);
        return testRes.data;
      } catch {}

      // Test 2: Avec authentification
      if (token) {
        const authRes = await axios.get(`${API_URL}/api/offer_types`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return authRes.data;
      }

      // Utiliser les données statiques
      return STATIC_OFFERS;

    } catch {
      return STATIC_OFFERS;
    }
  }, [API_URL, token]);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offersData = await testAPI();
      
      let normalizedOffers = [];
      if (Array.isArray(offersData)) {
        normalizedOffers = offersData;
      } else if (offersData && Array.isArray(offersData.content)) {
        normalizedOffers = offersData.content;
      } else {
        normalizedOffers = STATIC_OFFERS;
      }
      
      setOffers(normalizedOffers);
    } catch {
      setError('Impossible de charger les offres');
      setOffers(STATIC_OFFERS);
    } finally {
      setLoading(false);
    }
  }, [testAPI]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // CRUD Operations
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Vous devez être connecté pour créer une offre");
      return;
    }

    try {
      const newOffer = {
        name: formData.name,
        people: parseInt(formData.people),
        multiplier: parseFloat(formData.multiplier)
      };

      const res = await axios.post(`${API_URL}/api/offer_types`, newOffer, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setOffers([...offers, res.data]);
      resetForm();
      setShowForm(false);
      alert('Offre créée avec succès');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Vous devez être connecté pour modifier une offre");
      return;
    }

    try {
      const updatedOffer = {
        name: formData.name,
        people: parseInt(formData.people),
        multiplier: parseFloat(formData.multiplier)
      };

      const res = await axios.put(`${API_URL}/api/offer_types/${editingOffer.id}`, updatedOffer, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setOffers(offers.map(offer => offer.id === editingOffer.id ? res.data : offer));
      resetForm();
      setShowForm(false);
      alert('Offre modifiée avec succès');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (!token) {
      alert("Vous devez être connecté pour supprimer une offre");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) return;

    try {
      await axios.delete(`${API_URL}/api/offer_types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOffers(offers.filter(o => o.id !== id));
      alert('Offre supprimée avec succès');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleDuplicate = async (offer) => {
    if (!token) {
      alert("Vous devez être connecté pour dupliquer une offre");
      return;
    }

    try {
      const newOffer = {
        name: `${offer.name} - Copie`,
        people: offer.people,
        multiplier: offer.multiplier
      };

      const res = await axios.post(`${API_URL}/api/offer_types`, newOffer, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setOffers([...offers, res.data]);
      alert('Offre dupliquée avec succès');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la duplication');
    }
  };

  // Helpers
  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      name: offer.name || '',
      people: offer.people || '',
      multiplier: offer.multiplier || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', people: '', multiplier: '' });
    setEditingOffer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) return <div className="loading">Chargement des offres...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="offers-container">
      <div className="offers-header">
        <h2>Gestion des Offres</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nouvelle Offre
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingOffer ? 'Modifier l\'offre' : 'Nouvelle offre'}</h3>
            <form onSubmit={editingOffer ? handleUpdate : handleCreate}>
              <div className="form-group">
                <label>Nom de l'offre:</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: SOLO, DUO, FAMILLE" required />
              </div>
              
              <div className="form-group">
                <label>Nombre de personnes:</label>
                <input type="number" name="people" value={formData.people} onChange={handleInputChange} min="1" placeholder="Ex: 1, 2, 3" required />
              </div>
              
              <div className="form-group">
                <label>Multiplicateur:</label>
                <input type="number" name="multiplier" step="0.01" value={formData.multiplier} onChange={handleInputChange} min="0" placeholder="Ex: 1.0, 1.5, 2.0" required />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-success">{editingOffer ? 'Modifier' : 'Créer'}</button>
                <button type="button" className="btn-cancel" onClick={handleCancel}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {offers.length === 0 ? (
        <p className="no-data">Aucune offre trouvée.</p>
      ) : (
        <table className="offers-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Personnes</th>
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
                <td className="actions">
                  <button className="btn-edit" onClick={() => handleEdit(offer)}>Modifier</button>
                  <button className="btn-duplicate" onClick={() => handleDuplicate(offer)}>Dupliquer</button>
                  <button className="btn-delete" onClick={() => handleDelete(offer.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OffersGestion;
