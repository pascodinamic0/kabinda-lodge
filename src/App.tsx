
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import { LoadingSpinner, PageSkeleton } from '@/components/LoadingSpinner';

// Lazy load pages for code splitting
// Public Pages
const CompanyLanding = lazy(() => import('@/pages/CompanyLanding'));
const Home = lazy(() => import('@/pages/Home'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));
const Contact = lazy(() => import('@/pages/Contact'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const Rooms = lazy(() => import('@/pages/Rooms'));
const RoomDetails = lazy(() => import('@/pages/RoomDetails'));
const Conference = lazy(() => import('@/pages/Conference'));
const ConferenceRoomDetails = lazy(() => import('@/pages/ConferenceRoomDetails'));
const Restaurant = lazy(() => import('@/pages/Restaurant'));
const RestaurantDetails = lazy(() => import('@/pages/RestaurantDetails'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Auth Pages
const Auth = lazy(() => import('@/pages/Auth'));
const ClientAuth = lazy(() => import('@/pages/ClientAuth'));

// Booking Pages
const RoomSelection = lazy(() => import('@/pages/RoomSelection'));
const BookRoom = lazy(() => import('@/pages/BookRoom'));
const BookConferenceRoom = lazy(() => import('@/pages/BookConferenceRoom'));
const DiningReservation = lazy(() => import('@/pages/DiningReservation'));
const MyBookings = lazy(() => import('@/pages/MyBookings'));

// Dashboard Pages
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const SuperAdminDashboard = lazy(() => import('@/pages/SuperAdminDashboard'));
const ReceptionDashboard = lazy(() => import('@/pages/ReceptionDashboard'));
const RestaurantDashboard = lazy(() => import('@/pages/RestaurantDashboard'));

// Admin Pages
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const RoomManagement = lazy(() => import('@/pages/admin/RoomManagement'));
const BookingOverview = lazy(() => import('@/pages/admin/BookingOverview'));
const ConferenceRoomManagement = lazy(() => import('@/pages/admin/ConferenceRoomManagement'));
const MenuManagement = lazy(() => import('@/pages/admin/MenuManagement'));
const ContentManagement = lazy(() => import('@/pages/admin/ContentManagement'));
const PromotionsManagement = lazy(() => import('@/pages/admin/PromotionsManagement'));
const ReportsDashboard = lazy(() => import('@/pages/admin/ReportsDashboard'));
const EmailSettings = lazy(() => import('@/pages/admin/EmailSettings'));
const PaymentVerification = lazy(() => import('@/pages/admin/PaymentVerification'));
const PaymentManagement = lazy(() => import('@/pages/admin/PaymentManagement'));
const AdminRestaurantTableManagement = lazy(() => import('@/pages/admin/RestaurantTableManagement'));
const BookingManagement = lazy(() => import('@/pages/admin/BookingManagement'));
const AmenitiesManagement = lazy(() => import('@/pages/admin/AmenitiesManagement'));

// Reception Pages
const GuestManagement = lazy(() => import('@/pages/reception/GuestManagement'));
const RoomStatus = lazy(() => import('@/pages/reception/RoomStatus'));
const GuestServices = lazy(() => import('@/pages/reception/GuestServices'));
const MaintenanceRequests = lazy(() => import('@/pages/reception/MaintenanceRequests'));
const LostAndFound = lazy(() => import('@/pages/reception/LostAndFound'));
const OrderApproval = lazy(() => import('@/pages/reception/OrderApproval'));
const ReviewManagement = lazy(() => import('@/pages/reception/ReviewManagement'));
const PaymentVerificationReception = lazy(() => import('@/pages/reception/PaymentVerification'));
const IncidentReporting = lazy(() => import('@/pages/reception/IncidentReporting'));
const HousekeepingCoordination = lazy(() => import('@/pages/reception/HousekeepingCoordination'));
const KeyCardManagement = lazy(() => import('@/pages/reception/KeyCardManagement'));
const ConferenceRoomSelection = lazy(() => import('@/pages/reception/ConferenceRoomSelection'));
const ReceptionBookingDetails = lazy(() => import('@/pages/reception/ReceptionBookingDetails'));
const ReceptionConferenceBookingDetails = lazy(() => import('@/pages/reception/ReceptionConferenceBookingDetails'));

// Restaurant Pages
const RestaurantOrderApproval = lazy(() => import('@/pages/restaurant/OrderApproval'));
const OrderCreation = lazy(() => import('@/pages/restaurant/OrderCreation'));
const RestaurantTableManagement = lazy(() => import('@/pages/restaurant/TableManagement'));
const KitchenDashboard = lazy(() => import('@/pages/restaurant/KitchenDashboard'));
const RestaurantPromotions = lazy(() => import('@/pages/restaurant/RestaurantPromotions'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <div className="App">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Company Landing Page */}
                  <Route path="/" element={<Suspense fallback={<LoadingSpinner />}><CompanyLanding /></Suspense>} />
                  
                  {/* Kabinda Lodge Routes */}
                  <Route path="/kabinda-lodge" element={<Layout><Suspense fallback={<PageSkeleton />}><Home /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/home" element={<Layout><Suspense fallback={<PageSkeleton />}><Home /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/about" element={<Layout><Suspense fallback={<PageSkeleton />}><AboutUs /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/contact" element={<Layout><Suspense fallback={<PageSkeleton />}><Contact /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/privacy" element={<Layout><Suspense fallback={<PageSkeleton />}><PrivacyPolicy /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/terms" element={<Layout><Suspense fallback={<PageSkeleton />}><TermsOfService /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/rooms" element={<Layout><Suspense fallback={<PageSkeleton />}><Rooms /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/rooms/:id" element={<Layout><Suspense fallback={<PageSkeleton />}><RoomDetails /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/conference" element={<Layout><Suspense fallback={<PageSkeleton />}><Conference /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/conference/:id" element={<Layout><Suspense fallback={<PageSkeleton />}><ConferenceRoomDetails /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/restaurant" element={<Layout><Suspense fallback={<PageSkeleton />}><Restaurant /></Suspense></Layout>} />
                  <Route path="/kabinda-lodge/restaurant/:id" element={<Layout><Suspense fallback={<PageSkeleton />}><RestaurantDetails /></Suspense></Layout>} />

                  {/* Auth Pages (without layout) */}
                  <Route path="/kabinda-lodge/auth" element={<Suspense fallback={<LoadingSpinner />}><Auth /></Suspense>} />
                  <Route path="/kabinda-lodge/client-auth" element={<Suspense fallback={<LoadingSpinner />}><ClientAuth /></Suspense>} />
                
                {/* Protected Routes - Reception Staff Room Selection */}
                <Route path="/kabinda-lodge/room-selection" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<LoadingSpinner />}><RoomSelection /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/book-room/:id" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin', 'Guest']}>
                    <Layout><Suspense fallback={<PageSkeleton />}><BookRoom /></Suspense></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/book-conference/:id" element={<Layout><Suspense fallback={<PageSkeleton />}><BookConferenceRoom /></Suspense></Layout>} />
                <Route path="/kabinda-lodge/dining-reservation/:id" element={<Layout><Suspense fallback={<PageSkeleton />}><DiningReservation /></Suspense></Layout>} />

                {/* Protected Routes - Guest */}
                <Route path="/kabinda-lodge/my-bookings" element={
                  <ProtectedRoute allowedRoles={['Guest']}>
                    <Layout><Suspense fallback={<PageSkeleton />}><MyBookings /></Suspense></Layout>
                  </ProtectedRoute>
                } />

                {/* Protected Routes - SuperAdmin */}
                <Route path="/kabinda-lodge/super-admin" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <Suspense fallback={<LoadingSpinner />}><SuperAdminDashboard /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/super-admin/bookings" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><BookingManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/users" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><UserManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/payment-management" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><PaymentManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/reports" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><ReportsDashboard /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/email-settings" element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><EmailSettings /></Suspense>
                  </ProtectedRoute>
                } />
                

                {/* Protected Routes - Admin */}
                <Route path="/kabinda-lodge/admin" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/rooms" element={
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><RoomManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/bookings" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><BookingOverview /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/conference-rooms" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><ConferenceRoomManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/menu" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><MenuManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/content" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><ContentManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/promotions" element={
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><PromotionsManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/payments" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><PaymentVerification /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/restaurant-tables" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><AdminRestaurantTableManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/amenities" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><AmenitiesManagement /></Suspense>
                  </ProtectedRoute>
                } />

                {/* Protected Routes - Reception */}
                <Route path="/kabinda-lodge/reception" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<LoadingSpinner />}><ReceptionDashboard /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/guests" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><GuestManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/rooms" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><RoomStatus /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/services" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><GuestServices /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/maintenance" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><MaintenanceRequests /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/lost-found" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><LostAndFound /></Suspense>
                  </ProtectedRoute>
                } />

                <Route path="/kabinda-lodge/reception/orders" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><OrderApproval /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/reviews" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><ReviewManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/payment-verification" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><PaymentVerificationReception /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/payments" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><PaymentVerificationReception /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/incidents" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><IncidentReporting /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/housekeeping" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><HousekeepingCoordination /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/key-cards" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><KeyCardManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/conference-selection" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><ConferenceRoomSelection /></Suspense>
                  </ProtectedRoute>
                } />

                <Route path="/kabinda-lodge/reception/booking/:id" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><ReceptionBookingDetails /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/reception/conference-booking/:id" element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><ReceptionConferenceBookingDetails /></Suspense>
                  </ProtectedRoute>
                } />

                {/* Protected Routes - Restaurant */}
                <Route path="/kabinda-lodge/restaurant-dashboard" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <Suspense fallback={<LoadingSpinner />}><RestaurantDashboard /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/orders" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><RestaurantOrderApproval /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/tables" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><RestaurantTableManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/order" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><OrderCreation /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/kitchen" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><KitchenDashboard /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/menu" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><MenuManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/restaurant/promotions" element={
                  <ProtectedRoute allowedRoles={['RestaurantLead', 'Admin']}>
                    <Suspense fallback={<PageSkeleton />}><RestaurantPromotions /></Suspense>
                  </ProtectedRoute>
                } />

                {/* 404 Route */}
                <Route path="*" element={<Layout><Suspense fallback={<PageSkeleton />}><NotFound /></Suspense></Layout>} />
              </Routes>
              </Suspense>
              <Toaster />
            </div>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
