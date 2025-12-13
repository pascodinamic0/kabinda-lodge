
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
const CompanyLanding = lazy(() => import('@/page-components/CompanyLanding'));
const Home = lazy(() => import('@/page-components/Home'));
const AboutUs = lazy(() => import('@/page-components/AboutUs'));
const Contact = lazy(() => import('@/page-components/Contact'));
const PrivacyPolicy = lazy(() => import('@/page-components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/page-components/TermsOfService'));
const Rooms = lazy(() => import('@/page-components/Rooms'));
const RoomDetails = lazy(() => import('@/page-components/RoomDetails'));
const Conference = lazy(() => import('@/page-components/Conference'));
const ConferenceRoomDetails = lazy(() => import('@/page-components/ConferenceRoomDetails'));
const Restaurant = lazy(() => import('@/page-components/Restaurant'));
const RestaurantDetails = lazy(() => import('@/page-components/RestaurantDetails'));
const NotFound = lazy(() => import('@/page-components/NotFound'));

// Auth Pages
const Auth = lazy(() => import('@/page-components/Auth'));
const ClientAuth = lazy(() => import('@/page-components/ClientAuth'));

// Booking Pages
const RoomSelection = lazy(() => import('@/page-components/RoomSelection'));
const BookRoom = lazy(() => import('@/page-components/BookRoom'));
const BookConferenceRoom = lazy(() => import('@/page-components/BookConferenceRoom'));
const DiningReservation = lazy(() => import('@/page-components/DiningReservation'));
const MyBookings = lazy(() => import('@/page-components/MyBookings'));

// Dashboard Pages
const AdminDashboard = lazy(() => import('@/page-components/AdminDashboard'));
const SuperAdminDashboard = lazy(() => import('@/page-components/SuperAdminDashboard'));
const ReceptionDashboard = lazy(() => import('@/page-components/ReceptionDashboard'));
const RestaurantDashboard = lazy(() => import('@/page-components/RestaurantDashboard'));

// Admin Pages
const UserManagement = lazy(() => import('@/page-components/admin/UserManagement'));
const RoomManagement = lazy(() => import('@/page-components/admin/RoomManagement'));
const BookingOverview = lazy(() => import('@/page-components/admin/BookingOverview'));
const ConferenceRoomManagement = lazy(() => import('@/page-components/admin/ConferenceRoomManagement'));
const MenuManagement = lazy(() => import('@/page-components/admin/MenuManagement'));
const BuffetManagement = lazy(() => import('@/page-components/admin/BuffetManagement'));
const ContentManagement = lazy(() => import('@/page-components/admin/ContentManagement'));
const PromotionsManagement = lazy(() => import('@/page-components/admin/PromotionsManagement'));
const ReportsDashboard = lazy(() => import('@/page-components/admin/ReportsDashboard'));
const EmailSettings = lazy(() => import('@/page-components/admin/EmailSettings'));
const PaymentVerification = lazy(() => import('@/page-components/admin/PaymentVerification'));
const PaymentManagement = lazy(() => import('@/page-components/admin/PaymentManagement'));
const AdminRestaurantTableManagement = lazy(() => import('@/page-components/admin/RestaurantTableManagement'));
const BookingManagement = lazy(() => import('@/page-components/admin/BookingManagement'));
const AmenitiesManagement = lazy(() => import('@/page-components/admin/AmenitiesManagement'));
const AdminMaintenanceManagement = lazy(() => import('@/page-components/admin/MaintenanceManagement'));
const AgentManagement = lazy(() => import('@/page-components/admin/AgentManagement'));
const CardIssueManagement = lazy(() => import('@/page-components/admin/CardIssueManagement'));

// Reception Pages
const GuestManagement = lazy(() => import('@/page-components/reception/GuestManagement'));
const RoomStatus = lazy(() => import('@/page-components/reception/RoomStatus'));
const GuestServices = lazy(() => import('@/page-components/reception/GuestServices'));
const MaintenanceRequests = lazy(() => import('@/page-components/reception/MaintenanceRequests'));
const LostAndFound = lazy(() => import('@/page-components/reception/LostAndFound'));
const OrderApproval = lazy(() => import('@/page-components/reception/OrderApproval'));
const ReviewManagement = lazy(() => import('@/page-components/reception/ReviewManagement'));
const PaymentVerificationReception = lazy(() => import('@/page-components/reception/PaymentVerification'));
const IncidentReporting = lazy(() => import('@/page-components/reception/IncidentReporting'));
const HousekeepingCoordination = lazy(() => import('@/page-components/reception/HousekeepingCoordination'));
const KeyCardManagement = lazy(() => import('@/page-components/reception/KeyCardManagement'));
const ConferenceRoomSelection = lazy(() => import('@/page-components/reception/ConferenceRoomSelection'));
const ReceptionBookingDetails = lazy(() => import('@/page-components/reception/ReceptionBookingDetails'));
const ReceptionConferenceBookingDetails = lazy(() => import('@/page-components/reception/ReceptionConferenceBookingDetails'));

// Restaurant Pages
const RestaurantOrderApproval = lazy(() => import('@/page-components/restaurant/OrderApproval'));
const OrderCreation = lazy(() => import('@/page-components/restaurant/OrderCreation'));
const RestaurantTableManagement = lazy(() => import('@/page-components/restaurant/TableManagement'));
const KitchenDashboard = lazy(() => import('@/page-components/restaurant/KitchenDashboard'));
const RestaurantPromotions = lazy(() => import('@/page-components/restaurant/RestaurantPromotions'));

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
                <Route path="/kabinda-lodge/admin/buffet" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><BuffetManagement /></Suspense>
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
                <Route path="/kabinda-lodge/admin/maintenance" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Suspense fallback={<PageSkeleton />}><AdminMaintenanceManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/agents" element={
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><AgentManagement /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/kabinda-lodge/admin/card-issues" element={
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <Suspense fallback={<PageSkeleton />}><CardIssueManagement /></Suspense>
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
