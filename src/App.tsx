import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import Conference from "./pages/Conference";
import ConferenceRoomDetails from "./pages/ConferenceRoomDetails";
import BookConferenceRoom from "./pages/BookConferenceRoom";
import Restaurant from "./pages/Restaurant";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Auth from "./pages/Auth";
import ClientAuth from "./pages/ClientAuth";
import AdminDashboard from "./pages/AdminDashboard";
import MyBookings from "./pages/MyBookings";
import UserManagement from "./pages/admin/UserManagement";
import RoomManagement from "./pages/admin/RoomManagement";
import BookingOverview from "./pages/admin/BookingOverview";
import MenuManagement from "./pages/admin/MenuManagement";
import ConferenceRoomManagement from "./pages/admin/ConferenceRoomManagement";
import ReportsDashboard from "./pages/admin/ReportsDashboard";
import PromotionsManagement from "./pages/admin/PromotionsManagement";
import ContentManagement from "./pages/admin/ContentManagement";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import BookRoom from "./pages/BookRoom";
import PaymentVerification from "./pages/admin/PaymentVerification";
import OrderApproval from "./pages/reception/OrderApproval";
import RestaurantOrderApproval from "./pages/restaurant/OrderApproval";
import DiningReservation from "./pages/DiningReservation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="room/:roomId" element={<RoomDetails />} />
              <Route path="conference" element={<Conference />} />
              <Route path="conference/:roomId" element={<ConferenceRoomDetails />} />
              <Route path="about" element={<AboutUs />} />
              <Route path="restaurant" element={<Restaurant />} />
              <Route path="contact" element={<Contact />} />
            </Route>
            
            {/* Authentication */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/client-auth" element={<ClientAuth />} />
            
            {/* Booking */}
            <Route path="/book-room/:roomId" element={<BookRoom />} />
            <Route path="/book-conference/:roomId" element={<BookConferenceRoom />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            
            {/* Restaurant Routes */}
            <Route path="/restaurant/reservation" element={<DiningReservation />} />
            
            {/* Protected Admin Routes */}
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
            <Route path="/admin/menu" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <MenuManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/conference-rooms" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ConferenceRoomManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ReportsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/promotions" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <PromotionsManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <PaymentVerification />
              </ProtectedRoute>
            } />
            <Route path="/admin/content" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ContentManagement />
              </ProtectedRoute>
            } />
            
            {/* Protected Reception Routes */}
            <Route path="/reception" element={
              <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                <ReceptionDashboard />
              </ProtectedRoute>
            } />
            <Route path="/reception/orders" element={
              <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                <OrderApproval />
              </ProtectedRoute>
            } />
            
            {/* Protected Restaurant Routes */}
            <Route path="/restaurant-dashboard" element={
              <ProtectedRoute allowedRoles={['Admin', 'RestaurantLead']}>
                <RestaurantDashboard />
              </ProtectedRoute>
            } />
            <Route path="/restaurant-dashboard/orders" element={
              <ProtectedRoute allowedRoles={['Admin', 'RestaurantLead']}>
                <RestaurantOrderApproval />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
