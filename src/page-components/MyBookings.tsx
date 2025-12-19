import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, CreditCard, Phone, ArrowLeft, Eye, Star, ClipboardList, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { ReceiptGenerator } from "@/components/ReceiptGenerator";

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
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
      navigate('/client-auth');
      return;
    }
    if (userRole !== 'Guest') {
      navigate('/');
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              My Bookings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and track your room reservations
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button 
              onClick={() => navigate('/rooms')}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              Book Room
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                You haven't made any room reservations yet. Start exploring our available rooms!
              </p>
              <Button onClick={() => navigate('/rooms')}>
                Browse Rooms
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-muted/30">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl">{booking.room.name}</CardTitle>
                      <p className="text-muted-foreground">
                        {booking.room.type} • Booking #{booking.id}
                      </p>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Check-in */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Check-in</p>
                        <p className="font-medium">{formatDate(booking.start_date)}</p>
                      </div>
                    </div>

                    {/* Check-out */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Check-out</p>
                        <p className="font-medium">{formatDate(booking.end_date)}</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{calculateNights(booking.start_date, booking.end_date)} nights</p>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-medium">${booking.total_price}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {booking.payments && booking.payments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Information
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-4">
                        {booking.payments.map((payment, index) => (
                          <div key={payment.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Payment {index + 1}</p>
                              <p className="text-sm text-muted-foreground">
                                {payment.method} • {payment.transaction_ref || 'No reference'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${payment.amount}</p>
                              <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                                {payment.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {booking.notes && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Special Requests</h4>
                      <p className="text-muted-foreground bg-muted/30 rounded-lg p-3">
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  <Separator className="my-6" />

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePrintReceipt(booking)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Receipt
                    </Button>

                    {isStayCompleted(booking.end_date) && !hasProvidedFeedback(booking) && (
                      <Button 
                        size="sm"
                        onClick={() => handleProvideFeedback(booking)}
                        className="gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Leave Feedback
                      </Button>
                    )}

                    {hasProvidedFeedback(booking) && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Feedback Provided
                      </Badge>
                    )}

                    {userData?.phone && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`tel:${userData.phone}`)}
                        className="gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Contact
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
    </div>
  );
};

export default MyBookings;