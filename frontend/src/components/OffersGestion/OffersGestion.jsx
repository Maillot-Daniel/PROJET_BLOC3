import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './OffersGestion.css';

// Données statiques de secours (comme dans Events.jsx)
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

  // Test complet de l'API - version useCallback pour éviter les dépendances circulaires
  const testAPI = useCallback(async () => {
    console.log('🔍 Début du test API...');
    console.log('🔑 Token:', token);
    console.log('🌐 API URL:', API_URL);
    
    try {
      // Test 1: Sans authentification
      console.log('🧪 Test sans authentification...');
      try {
        const testRes = await axios.get(`${API_URL}/api/offer_types`);
        console.log('✅ API accessible sans auth:', testRes.data);
        return testRes.data;
      } catch (noAuthErr) {
        console.log('❌ API refuse sans auth:', noAuthErr.response?.status);
      }

      // Test 2: Avec authentification
      if (token) {
        console.log('🧪 Test avec authentification...');
        const authRes = await axios.get(`${API_URL}/api/offer_types`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ API avec auth:', authRes.data);
        return authRes.data;
      }

      // Si on arrive ici, utiliser les données statiques
      console.log('📋 Utilisation des données statiques');
      return STATIC_OFFERS;

    } catch (err) {
      console.error('💥 Erreur API:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      console.log('📋 Retour aux données statiques à cause de l\'erreur');
      return STATIC_OFFERS;
    }
  }, [API_URL, token]); // Dépendances de testAPI

  // fetchOffers en useCallback pour stabiliser la référence
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offersData = await testAPI();
      
      // Normaliser les données
      let normalizedOffers = [];
      if (Array.isArray(offersData)) {
        normalizedOffers = offersData;
      } else if (offersData && Array.isArray(offersData.content)) {
        normalizedOffers = offersData.content;
      } else {
        normalizedOffers = STATIC_OFFERS;
      }
      
      setOffers(normalizedOffers);
      console.log('📦 Offres chargées:', normalizedOffers);
      
    } catch (err) {
      console.error('Erreur finale:', err);
      setError('Impossible de charger les offres');
      setOffers(STATIC_OFFERS); // Fallback aux données statiques
    } finally {
      setLoading(false);
    }
  }, [testAPI]); // Dépendance de fetchOffers

  // useEffect avec les bonnes dépendances
  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]); // Maintenant fetchOffers est stable grâce à useCallback

  // CRUD Operations (utilisent les données locales pour l'instant)
  const handleCreate = async (e) => {
    e.preventDefault();
    
    const newOffer = {
      id: Math.max(...offers.map(o => o.id), 0) + 1,
      name: formData.name,
      people: parseInt(formData.people),
      multiplier: parseFloat(formData.multiplier)
    };

    setOffers([...offers, newOffer]);
    resetForm();
    setShowForm(false);
    alert('Offre créée avec succès (localement)');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    setOffers(offers.map(offer => 
      offer.id === editingOffer.id 
        ? {
            ...offer,
            name: formData.name,
            people: parseInt(formData.people),
            multiplier: parseFloat(formData.multiplier)
          }
        : offer
    ));
    
    resetForm();
    setShowForm(false);
    alert('Offre modifiée avec succès (localement)');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) return;

    setOffers(offers.filter(o => o.id !== id));
    alert('Offre supprimée avec succès (localement)');
  };

  const handleDuplicate = async (offer) => {
    const newOffer = {
      ...offer,
      id: Math.max(...offers.map(o => o.id), 0) + 1,
      name: `${offer.name} - Copie`
    };

    setOffers([...offers, newOffer]);
    alert('Offre dupliquée avec succès (localement)');
  };

  // Fonctions helpers
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
    setFormData({
      name: '',
      people: '',
      multiplier: ''
    });
    setEditingOffer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Nouvelle Offre
        </button>
      </div>

      {/* Formulaire de création/modification */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingOffer ? 'Modifier l\'offre' : 'Nouvelle offre'}</h3>
            <form onSubmit={editingOffer ? handleUpdate : handleCreate}>
              <div className="form-group">
                <label>Nom de l'offre:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: SOLO, DUO, FAMILLE"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Nombre de personnes:</label>
                <input
                  type="number"
                  name="people"
                  value={formData.people}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Ex: 1, 2, 3"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Multiplicateur:</label>
                <input
                  type="number"
                  name="multiplier"
                  step="0.01"
                  value={formData.multiplier}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Ex: 1.0, 1.5, 2.0"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-success">
                  {editingOffer ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des offres */}
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
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(offer)}
                  >
                    Modifier
                  </button>
                  <button 
                    className="btn-duplicate"
                    onClick={() => handleDuplicate(offer)}
                  >
                    Dupliquer
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(offer.id)}
                  >
                    Supprimer
                  </button>
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