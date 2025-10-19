import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AdminDashboard.css';

// ✅ DÉFINIR COLORS AU NIVEAU DU MODULE
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesByOffer, setSalesByOffer] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const API_URL = "https://projet-bloc3.onrender.com";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('olympics_auth_token');
      
      const [dashboardResponse, salesResponse, ordersResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/sales-by-offer`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (dashboardResponse.ok && salesResponse.ok && ordersResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        const salesData = await salesResponse.json();
        const ordersData = await ordersResponse.json();
        
        setDashboardStats(dashboardData);
        setSalesByOffer(salesData);
        setRecentOrders(ordersData);
      } else {
        console.error('Erreur lors du chargement des données');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">
          <div className="spinner"></div>
          Chargement des données en temps réel...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>📊 Tableau de Bord Admin - Données Réelles</h1>
        <p>Analyse des ventes basée sur les commandes en base de données</p>
        <button onClick={refreshData} className="refresh-btn">
          🔄 Actualiser
        </button>
      </header>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Aperçu
        </button>
        <button 
          className={`tab-button ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          🎯 Ventes par Offre
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Commandes Récentes
        </button>
        <button 
          className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Revenus
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab stats={dashboardStats} />}
        {activeTab === 'offers' && <OffersTab sales={salesByOffer} />}
        {activeTab === 'orders' && <OrdersTab orders={recentOrders} />}
        {activeTab === 'revenue' && <RevenueTab stats={dashboardStats} />}
      </div>
    </div>
  );
};

// Composant Onglet Aperçu
const OverviewTab = ({ stats }) => (
  <div className="overview-tab">
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">🛒</div>
        <div className="stat-info">
          <h3>Commandes Total</h3>
          <p className="stat-number">{stats?.totalOrders || 0}</p>
          <small>Aujourd'hui: {stats?.todayOrders || 0}</small>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-info">
          <h3>Revenu Total</h3>
          <p className="stat-number">
            {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString('fr-FR')} €` : '0 €'}
          </p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">🎫</div>
        <div className="stat-info">
          <h3>Total Tickets</h3>
          <p className="stat-number">{stats?.totalTickets || 0}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <h3>Tickets Validés</h3>
          <p className="stat-number">{stats?.validatedTickets || 0}</p>
        </div>
      </div>
    </div>

    {/* Commandes récentes en résumé */}
    {stats?.recentOrders && stats.recentOrders.length > 0 && (
      <div className="recent-orders-summary">
        <h3>📋 Dernières Commandes</h3>
        <div className="orders-list">
          {stats.recentOrders.slice(0, 3).map((order, index) => (
            <div key={order.id} className="order-summary">
              <span className="order-number">{order.orderNumber}</span>
              <span className="order-amount">{order.totalPrice} €</span>
              <span className="order-date">
                {new Date(order.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Composant Ventes par Offre
const OffersTab = ({ sales }) => (
  <div className="offers-tab">
    <h3>🎯 Ventes par Type d'Offre</h3>
    <p className="subtitle">Données réelles depuis les commandes payées</p>
    
    <div className="offers-grid">
      {/* Graphique circulaire */}
      <div className="chart-container">
        <h4>Répartition des Ventes</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sales}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ eventTitle, percent }) => 
                `${eventTitle} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="ticketsSold"
            >
              {sales.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                value, 
                `${props.payload.eventTitle} - Tickets vendus`
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau détaillé */}
      <div className="offers-table">
        <h4>Détails des Ventes</h4>
        <table>
          <thead>
            <tr>
              <th>Type d'Offre</th>
              <th>Tickets Vendus</th>
              <th>Revenu Total</th>
              <th>Prix Moyen</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((offer, index) => (
              <tr key={index}>
                <td>
                  <div className="offer-color" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  {offer.eventTitle}
                </td>
                <td>{offer.ticketsSold}</td>
                <td>{offer.totalRevenue.toLocaleString('fr-FR')} €</td>
                <td>{offer.averageTicketPrice?.toFixed(2)} €</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan="4" className="no-data">
                  Aucune vente enregistrée pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Composant Commandes Récentes
const OrdersTab = ({ orders }) => (
  <div className="orders-tab">
    <h3>📋 Commandes Récentes</h3>
    <p className="subtitle">Liste des dernières commandes payées</p>
    
    <div className="orders-container">
      {orders.length > 0 ? (
        <div className="orders-list-detailed">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-number">{order.orderNumber}</span>
                <span className="order-status paid">✅ Payée</span>
              </div>
              
              <div className="order-details">
                <div className="order-info">
                  <span><strong>Client:</strong> {order.customerEmail}</span>
                  <span><strong>Date:</strong> {new Date(order.createdAt).toLocaleString('fr-FR')}</span>
                  <span><strong>Total:</strong> {order.totalPrice} €</span>
                </div>
                
                {order.items && order.items.length > 0 && (
                  <div className="order-items">
                    <strong>Articles:</strong>
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        {item.quantity}x {item.eventTitle} - {item.offerTypeName} 
                        ({item.unitPrice} €)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-orders">
          <p>Aucune commande enregistrée pour le moment</p>
          <small>Les commandes apparaîtront ici après les premiers paiements</small>
        </div>
      )}
    </div>
  </div>
);

// Composant Onglet Revenus
const RevenueTab = ({ stats }) => (
  <div className="revenue-tab">
    <h3>💰 Analyse des Revenus</h3>
    <p className="subtitle">Basé sur les commandes payées</p>
    
    <div className="revenue-stats">
      <div className="revenue-card">
        <h4>Revenu Total</h4>
        <p className="revenue-amount">
          {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString('fr-FR')} €` : '0 €'}
        </p>
      </div>
      
      <div className="revenue-card">
        <h4>Commandes Aujourd'hui</h4>
        <p className="revenue-amount">{stats?.todayOrders || 0}</p>
      </div>
      
      <div className="revenue-card">
        <h4>Panier Moyen</h4>
        <p className="revenue-amount">
          {stats?.totalOrders > 0 ? 
            `${(stats.totalRevenue / stats.totalOrders).toFixed(2)} €` : '0 €'
          }
        </p>
      </div>
    </div>

    {/* Graphique de performance */}
    <div className="chart-container">
      <h4>Performance des Ventes</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={[
          { name: 'Commandes', value: stats?.totalOrders || 0 },
          { name: 'Tickets Total', value: stats?.totalTickets || 0 },
          { name: 'Tickets Validés', value: stats?.validatedTickets || 0 },
          { name: 'Tickets Utilisés', value: stats?.usedTickets || 0 }
        ]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default AdminDashboard;