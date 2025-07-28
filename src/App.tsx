
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';

// Pages
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
                {/* Public Routes with Layout */}
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/home" element={<Layout><Home /></Layout>} />
                <Route path="/about" element={<Layout><AboutUs /></Layout>} />
                <Route path="/contact" element={<Layout><Contact /></Layout>} />
                <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
                <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
                <Route path="/rooms" element={<Layout><Rooms /></Layout>} />
                <Route path="/rooms/:id" element={<Layout><RoomDetails /></Layout>} />
                <Route path="/conference" element={<Layout><Conference /></Layout>} />
                <Route path="/conference/:id" element={<Layout><ConferenceRoomDetails /></Layout>} />
                <Route path="/restaurant" element={<Layout><Restaurant /></Layout>} />
                <Route path="/restaurant/:id" element={<Layout><RestaurantDetails /></Layout>} />

                {/* Auth Pages (without layout) */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/client-auth" element={<ClientAuth />} />
                
                {/* Booking Pages (with layout) */}
                <Route path="/room-selection" element={<Layout><RoomSelection /></Layout>} />
                <Route path="/book-room/:id" element={<Layout><BookRoom /></Layout>} />
                <Route path="/book-conference/:id" element={<Layout><BookConferenceRoom /></Layout>} />
                <Route path="/dining-reservation/:id" element={<Layout><DiningReservation /></Layout>} />

                {/* Protected Routes - Guest */}
                <Route path="/my-bookings" element={
                  <ProtectedRoute allowedRoles={['Guest']}>
                    <Layout><MyBookings /></Layout>
                  </ProtectedRoute>
                } />

                {/* Protected Routes - Admin */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/rooms" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <RoomManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/bookings" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <BookingOverview />
                  </ProtectedRoute>
                } />
                <Route path="/admin/conference-rooms" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <ConferenceRoomManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/menu" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <MenuManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/content" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <ContentManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/promotions" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <PromotionsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <ReportsDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/payments" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <PaymentVerification />
                  </ProtectedRoute>
                } />
                <Route path="/admin/payment-management" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <PaymentManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/restaurant-tables" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminRestaurantTableManagement />
                  </ProtectedRoute>
                } />

                {/* Protected Routes - Reception */}
                <Route path="/reception" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <ReceptionDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/reception/guests" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <GuestManagement />
                  </ProtectedRoute>
                } />
                <Route path="/reception/rooms" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <RoomStatus />
                  </ProtectedRoute>
                } />
                <Route path="/reception/services" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <GuestServices />
                  </ProtectedRoute>
                } />
                <Route path="/reception/maintenance" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <MaintenanceRequests />
                  </ProtectedRoute>
                } />
                <Route path="/reception/lost-found" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <LostAndFound />
                  </ProtectedRoute>
                } />
                <Route path="/reception/directory" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <PhoneDirectory />
                  </ProtectedRoute>
                } />
                <Route path="/reception/orders" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <OrderApproval />
                  </ProtectedRoute>
                } />
                <Route path="/reception/reviews" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <ReviewManagement />
                  </ProtectedRoute>
                } />
                <Route path="/reception/payments" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <PaymentVerificationReception />
                  </ProtectedRoute>
                } />

                {/* Protected Routes - Restaurant */}
                <Route path="/restaurant-dashboard" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/orders" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <RestaurantOrderApproval />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/tables" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <RestaurantTableManagement />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/order" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <OrderCreation />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/kitchen" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <KitchenDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/menu" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <MenuManagement />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/promotions" element={
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
