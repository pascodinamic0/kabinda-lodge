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
import Dining from "./pages/Dining";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RoomManagement from "./pages/admin/RoomManagement";
import BookingOverview from "./pages/admin/BookingOverview";
import MenuManagement from "./pages/admin/MenuManagement";
import ReportsDashboard from "./pages/admin/ReportsDashboard";
import PromotionsManagement from "./pages/admin/PromotionsManagement";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";

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
              <Route path="dining" element={<Dining />} />
              <Route path="contact" element={<Contact />} />
            </Route>
            
            {/* Authentication */}
            <Route path="/auth" element={<Auth />} />
            
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
            
            {/* Protected Reception Routes */}
            <Route path="/reception" element={
              <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                <ReceptionDashboard />
              </ProtectedRoute>
            } />
            
            {/* Protected Restaurant Routes */}
            <Route path="/restaurant" element={
              <ProtectedRoute allowedRoles={['Admin', 'RestaurantLead']}>
                <RestaurantDashboard />
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
