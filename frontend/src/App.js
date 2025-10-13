import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/common/Navbar';
import FooterComponent from './components/common/Footer';
import HomePage from './components/homepage/HomePage';
import LoginPage from './components/auth/LoginPage';
import RegistrationPage from './components/auth/RegistrationPage';
import RequireAdmin from './components/auth/RequireAdmin';
import RequireUser from './components/auth/RequireUser';

import UserManagementPage from './components/userpage/UserManagementPage';
import UpdateUser from './components/userpage/UpdateUser';
import Events from './components/events/Events';
import EventList from './components/events/EventList';
import CreateEventForm from './components/events/CreateEventForm';
import CartPage from './components/cart/CartPage';

import OffersPage from './components/OffersPage/OffersPage';
import OffersGestion from './components/OffersGestion/OffersGestion';
import TicketValidator from './components/tickets/TicketValidator'; // ← NOUVEAU IMPORT

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import GuestOnlyRoute from './components/GuestOnlyRoute/GuestOnlyRoute';

import AuthWidget from './context/AuthWidget';
import CguPages from './components/CguPages/CguPages';
import AboutPage from './components/AboutPage/AboutPage';
import PrivacyPage from './components/PrivacyPage/PrivacyPage';
import ContactPage from './components/ContactPage/ContactPage';

import background from './assets/images/Jeux_2024.jpg';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div
            className="App"
            style={{
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '100vh',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
            }}
          >
            <Navbar />
            <AuthWidget />

            <div className="content">
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/offers" element={<OffersPage />} />

                {/* Guests */}
                <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
                <Route path="/register" element={<GuestOnlyRoute><RegistrationPage /></GuestOnlyRoute>} />

                {/* Admin-only */}
                <Route path="/admin/register" element={<RequireAdmin><RegistrationPage adminRegistration={true} /></RequireAdmin>} />
                <Route path="/admin/events" element={<RequireAdmin><EventList /></RequireAdmin>} />
                <Route path="/admin/user-management" element={<RequireAdmin><UserManagementPage /></RequireAdmin>} />
                <Route path="/admin/update-user/:userId" element={<RequireAdmin><UpdateUser /></RequireAdmin>} />
                <Route path="/admin/create-event" element={<RequireAdmin><CreateEventForm /></RequireAdmin>} />
                <Route path="/admin/offers-gestion" element={<RequireAdmin><OffersGestion /></RequireAdmin>} />
                <Route path="/admin/validate-tickets" element={<RequireAdmin><TicketValidator /></RequireAdmin>} /> {/* ← NOUVELLE ROUTE */}

                {/* Authenticated users */}
                <Route path="/public-events" element={<RequireUser><Events /></RequireUser>} />
                <Route path="/cart" element={<RequireUser><CartPage /></RequireUser>} />

                {/* Static pages */}
                <Route path="/cgu" element={<CguPages />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            <FooterComponent />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;