import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Calendar, MapPin, CreditCard, Phone, ArrowLeft, Eye, Star, FileText, Menu, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { ReceiptGenerator } from "@/components/ReceiptGenerator";
import { GuestSidebar } from "@/components/guest/GuestSidebar";
import { ServiceRequestModal } from "@/components/guest/ServiceRequestModal";
import { ServiceRequestsList } from "@/components/guest/ServiceRequestsList";
import { LeaveReviewSection } from "@/components/guest/LeaveReviewSection";
import { ReviewsList } from "@/components/guest/ReviewsList";

interface Booking {
  id: number;
  room_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  notes: string;
  created_at: string;
  room: {
    name: string;
    type: string;
    price: number;
  };
  feedback?: {
    id: string;
    rating: number;
    message: string;
  }[];
  payments?: {
    id: number;
    method: string;
    transaction_ref?: string;
    amount: number;
    status: string;
  }[];
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState("new-request");
  const [serviceRequestModal, setServiceRequestModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    bookingId?: number;
    roomName?: string;
  }>({ isOpen: false });
  
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    booking?: Booking;
  }>({ isOpen: false });
  
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    phone?: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/kabinda-lodge/client-auth');
      return;
    }
    if (userRole !== 'Guest') {
      navigate('/kabinda-lodge');
      return;
    }
    fetchUserData();
    fetchBookings();
  }, [user, userRole]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Use fallback data from auth if users table data unavailable
      setUserData({
        name: user?.email?.split('@')[0] || "Guest",
        email: user?.email || "",
        phone: "",
      });
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(name, type, price),
          feedback(id, rating, message),
          payments(id, method, transaction_ref, amount, status)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isStayCompleted = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const hasProvidedFeedback = (booking: Booking) => {
    return booking.feedback && booking.feedback.length > 0;
  };

  const handleProvideFeedback = (booking: Booking) => {
    setFeedbackModal({
      isOpen: true,
      bookingId: booking.id,
      roomName: booking.room.name,
    });
  };

  const handleFeedbackSubmitted = () => {
    setFeedbackModal({ isOpen: false });
    fetchBookings(); // Refresh to show feedback was submitted
  };

  const createReceiptData = (booking: Booking) => {
    const payment = booking.payments?.[0]; // Get the first payment
    const nights = calculateNights(booking.start_date, booking.end_date);
    
    return {
      bookingId: booking.id,
      guestName: userData?.name || "Guest",
      guestEmail: userData?.email || "",
      guestPhone: userData?.phone || "",
      roomName: booking.room.name,
      roomType: booking.room.type,
      checkIn: booking.start_date,
      checkOut: booking.end_date,
      nights: nights,
      roomPrice: booking.room.price,
      totalAmount: booking.total_price,
      paymentMethod: payment?.method || "cash",
      transactionRef: payment?.transaction_ref,
      createdAt: booking.created_at,
    };
  };

  const handlePrintReceipt = (booking: Booking) => {
    setReceiptModal({
      isOpen: true,
      booking: booking,
    });
  };

  const handleSectionNavigation = (section: string) => {
    setCurrentSection(section);
  };

  const handleServiceRequestSubmitted = () => {
    setServiceRequestModal(false);
    toast({
      title: "Request Submitted",
      description: "Your service request has been submitted successfully.",
    });
  };

  const renderMainContent = () => {
    switch (currentSection) {
      case "new-request":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">New Service Request</h2>
                <p className="text-muted-foreground">Submit a request for hotel services</p>
              </div>
              <Button onClick={() => setServiceRequestModal(true)}>
                Create New Request
              </Button>
            </div>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Ready to Request a Service?</p>
                <p className="text-muted-foreground text-center mb-4">
                  Need housekeeping, maintenance, or any other service? Click the button above to get started.
                </p>
                <Button onClick={() => setServiceRequestModal(true)}>
                  Create Service Request
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      
      case "my-requests":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">My Service Requests</h2>
              <p className="text-muted-foreground">Track your submitted service requests</p>
            </div>
            <ServiceRequestsList />
          </div>
        );
      
      case "leave-review":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Leave a Review</h2>
              <p className="text-muted-foreground">Share your experience from your recent stays</p>
            </div>
            <LeaveReviewSection />
          </div>
        );
      
      case "my-reviews":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">My Reviews</h2>
              <p className="text-muted-foreground">View all your submitted reviews</p>
            </div>
            <ReviewsList />
          </div>
        );
      
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">My Bookings</h2>
              <p className="text-muted-foreground">Manage and track your room reservations</p>
            </div>
            {/* Original bookings content would go here */}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
        <div className="container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen w-full bg-gradient-to-br from-background to-secondary/20">
        {/* Header */}
        <header className="h-16 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
            <div>
              <h1 className="text-xl font-semibold">Guest Services</h1>
              <p className="text-sm text-muted-foreground">Access your bookings and services</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/kabinda-lodge')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button onClick={() => navigate('/kabinda-lodge/rooms')} className="gap-2">
              <MapPin className="h-4 w-4" />
              Book Room
            </Button>
          </div>
        </header>

        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} w-full`}>
          {/* Sidebar - Hidden on mobile, positioned below header when open */}
          {!isMobile && (
            <GuestSidebar 
              onNavigate={handleSectionNavigation}
              currentSection={currentSection}
            />
          )}
          
          {/* Mobile Sidebar - Positioned below header */}
          {isMobile && (
            <div className="relative">
              <GuestSidebar 
                onNavigate={handleSectionNavigation}
                currentSection={currentSection}
              />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {renderMainContent()}
          </main>
        </div>

        {/* Service Request Modal */}
        <ServiceRequestModal
          isOpen={serviceRequestModal}
          onClose={() => setServiceRequestModal(false)}
          onSubmit={handleServiceRequestSubmitted}
        />

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false })}
          bookingId={feedbackModal.bookingId!}
          roomName={feedbackModal.roomName!}
          onSubmit={handleFeedbackSubmitted}
        />

        {/* Receipt Modal */}
        {receiptModal.isOpen && receiptModal.booking && (
          <ReceiptGenerator
            receiptData={createReceiptData(receiptModal.booking)}
            onClose={() => setReceiptModal({ isOpen: false })}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default MyBookings;