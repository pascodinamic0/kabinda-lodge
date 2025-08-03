
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';

// Pages
import CompanyLanding from '@/pages/CompanyLanding';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import ClientAuth from '@/pages/ClientAuth';
import AboutUs from '@/pages/AboutUs';
import Contact from '@/pages/Contact';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import Rooms from '@/pages/Rooms';
import RoomDetails from '@/pages/RoomDetails';
import RoomSelection from '@/pages/RoomSelection';
import BookRoom from '@/pages/BookRoom';
import MyBookings from '@/pages/MyBookings';
import Conference from '@/pages/Conference';
import ConferenceRoomDetails from '@/pages/ConferenceRoomDetails';
import BookConferenceRoom from '@/pages/BookConferenceRoom';
import Restaurant from '@/pages/Restaurant';
import RestaurantDetails from '@/pages/RestaurantDetails';
import DiningReservation from '@/pages/DiningReservation';
import NotFound from '@/pages/NotFound';

// Dashboard Pages
import AdminDashboard from '@/pages/AdminDashboard';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import ReceptionDashboard from '@/pages/ReceptionDashboard';
import RestaurantDashboard from '@/pages/RestaurantDashboard';

// Admin Pages
import UserManagement from '@/pages/admin/UserManagement';
import RoomManagement from '@/pages/admin/RoomManagement';
import BookingOverview from '@/pages/admin/BookingOverview';
import ConferenceRoomManagement from '@/pages/admin/ConferenceRoomManagement';
import MenuManagement from '@/pages/admin/MenuManagement';
import ContentManagement from '@/pages/admin/ContentManagement';
import PromotionsManagement from '@/pages/admin/PromotionsManagement';
import ReportsDashboard from '@/pages/admin/ReportsDashboard';
import PaymentVerification from '@/pages/admin/PaymentVerification';
import PaymentManagement from '@/pages/admin/PaymentManagement';
import AdminRestaurantTableManagement from '@/pages/admin/RestaurantTableManagement';

// Reception Pages
import GuestManagement from '@/pages/reception/GuestManagement';
import RoomStatus from '@/pages/reception/RoomStatus';
import GuestServices from '@/pages/reception/GuestServices';
import MaintenanceRequests from '@/pages/reception/MaintenanceRequests';
import LostAndFound from '@/pages/reception/LostAndFound';
import PhoneDirectory from '@/pages/reception/PhoneDirectory';
import OrderApproval from '@/pages/reception/OrderApproval';
import ReviewManagement from '@/pages/reception/ReviewManagement';
import PaymentVerificationReception from '@/pages/reception/PaymentVerification';
import IncidentReporting from '@/pages/reception/IncidentReporting';
import HousekeepingCoordination from '@/pages/reception/HousekeepingCoordination';
import KeyCardManagement from '@/pages/reception/KeyCardManagement';

// Restaurant Pages
import RestaurantOrderApproval from '@/pages/restaurant/OrderApproval';
import OrderCreation from '@/pages/restaurant/OrderCreation';
import RestaurantTableManagement from '@/pages/restaurant/TableManagement';
import KitchenDashboard from '@/pages/restaurant/KitchenDashboard';
import RestaurantPromotions from '@/pages/restaurant/RestaurantPromotions';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Company Landing Page */}
                <Route path="/" element={<CompanyLanding />} />
                
                {/* Kabinda Lodge Routes */}
                <Route path="/kabinda-lodge" element={<Layout><Home /></Layout>} />
                <Route path="/kabinda-lodge/home" element={<Layout><Home /></Layout>} />
                <Route path="/kabinda-lodge/about" element={<Layout><AboutUs /></Layout>} />
                <Route path="/kabinda-lodge/contact" element={<Layout><Contact /></Layout>} />
                <Route path="/kabinda-lodge/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
                <Route path="/kabinda-lodge/terms" element={<Layout><TermsOfService /></Layout>} />
                <Route path="/kabinda-lodge/rooms" element={<Layout><Rooms /></Layout>} />
                <Route path="/kabinda-lodge/rooms/:id" element={<Layout><RoomDetails /></Layout>} />
                <Route path="/kabinda-lodge/conference" element={<Layout><Conference /></Layout>} />
                <Route path="/kabinda-lodge/conference/:id" element={<Layout><ConferenceRoomDetails /></Layout>} />
                <Route path="/kabinda-lodge/restaurant" element={<Layout><Restaurant /></Layout>} />
                <Route path="/kabinda-lodge/restaurant/:id" element={<Layout><RestaurantDetails /></Layout>} />

                {/* Auth Pages (without layout) */}
                <Route path="/kabinda-lodge/auth" element={<Auth />} />
                <Route path="/kabinda-lodge/client-auth" element={<ClientAuth />} />
                
                {/* Protected Routes - Reception Staff Room Selection */}
                <Route path="/kabinda-lodge/room-selection" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <RoomSelection />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/book-room/:id" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin', 'Guest']}>
                    <Layout><BookRoom /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/book-conference/:id" element={<Layout><BookConferenceRoom /></Layout>} />
                <Route path="/kabinda-lodge/dining-reservation/:id" element={<Layout><DiningReservation /></Layout>} />

                {/* Protected Routes - Guest */}
                <Route path="/kabinda-lodge/my-bookings" element={
                  <ProtectedRoute allowedRoles={['Guest']}>
                    <Layout><MyBookings /></Layout>
                  </ProtectedRoute>
                } />

                {/* Protected Routes - SuperAdmin */}
                <Route path="/kabinda-lodge/super-admin" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/users" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/payment-management" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <PaymentManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/reports" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <ReportsDashboard />
                  </ProtectedRoute>
                } />

                {/* Protected Routes - Admin */}
                <Route path="/kabinda-lodge/admin" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/rooms" element={
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <RoomManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/bookings" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <BookingOverview />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/conference-rooms" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <ConferenceRoomManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/menu" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <MenuManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/content" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <ContentManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/promotions" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <PromotionsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/payments" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <PaymentVerification />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/restaurant-tables" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminRestaurantTableManagement />
                  </ProtectedRoute>
                } />

                {/* Protected Routes - Reception */}
                <Route path="/kabinda-lodge/reception" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <ReceptionDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/guests" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <GuestManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/rooms" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <RoomStatus />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/services" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <GuestServices />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/maintenance" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <MaintenanceRequests />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/lost-found" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <LostAndFound />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/directory" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <PhoneDirectory />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/orders" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <OrderApproval />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/reviews" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <ReviewManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/payment-verification" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <PaymentVerificationReception />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/payments" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <PaymentVerificationReception />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/incidents" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <IncidentReporting />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/housekeeping" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <HousekeepingCoordination />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/key-cards" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <KeyCardManagement />
                  </ProtectedRoute>
                } />

                {/* Protected Routes - Restaurant */}
                <Route path="/kabinda-lodge/restaurant-dashboard" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/orders" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <RestaurantOrderApproval />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/tables" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <RestaurantTableManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/order" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin', 'Receptionist']}>
                    <OrderCreation />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/kitchen" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <KitchenDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/menu" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <MenuManagement />
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/promotions" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <RestaurantPromotions />
                  </ProtectedRoute>
                } />

                {/* 404 Route */}
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
