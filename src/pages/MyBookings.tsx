import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, CreditCard, Phone, ArrowLeft, Eye, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import FeedbackModal from "@/components/feedback/FeedbackModal";

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

  useEffect(() => {
    if (!user) {
      navigate('/client-auth');
      return;
    }
    if (userRole !== 'Guest') {
      navigate('/');
      return;
    }
    fetchBookings();
  }, [user, userRole]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(name, type, price),
          feedback(id, rating, message)
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
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="outline" onClick={() => navigate('/')} className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('back_to_home', 'Back to Home')}
            </Button>
            <h1 className="text-3xl font-bold">{t('my_bookings', 'My Bookings')}</h1>
            <p className="text-muted-foreground">{t('manage_reservations', 'Manage and track your room reservations')}</p>
          </div>
          <Button onClick={() => navigate('/rooms')} className="gap-2">
            <MapPin className="h-4 w-4" />
            Book Another Room
          </Button>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any room reservations yet. Start exploring our available rooms!
              </p>
              <Button onClick={() => navigate('/rooms')} className="gap-2">
                <MapPin className="h-4 w-4" />
                Browse Rooms
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{booking.room.name}</CardTitle>
                      <p className="text-muted-foreground">{booking.room.type}</p>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Booking Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">Check-in:</span>
                        <span>{formatDate(booking.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">Check-out:</span>
                        <span>{formatDate(booking.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Duration:</span>
                        <span>{calculateNights(booking.start_date, booking.end_date)} nights</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="font-medium">Total Amount:</span>
                        <span className="text-lg font-bold text-primary">${booking.total_price}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Booking ID:</span>
                        <span className="font-mono">HOTEL-{booking.id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Booked on:</span>
                        <span>{formatDate(booking.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Special Notes */}
                  {booking.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm mb-2">Special Requests:</h4>
                        <p className="text-sm text-muted-foreground">{booking.notes}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Feedback Section */}
                  {hasProvidedFeedback(booking) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          Your Review
                        </h4>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (booking.feedback?.[0]?.rating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground">
                            {booking.feedback?.[0]?.rating}/5 stars
                          </span>
                        </div>
                        {booking.feedback?.[0]?.message && (
                          <p className="text-sm text-muted-foreground italic">
                            "{booking.feedback[0].message}"
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/room/${booking.room_id}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Room Details
                    </Button>
                    
                    {booking.status === 'confirmed' && (
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/book-room/${booking.room_id}`)}
                        className="gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Book Again
                      </Button>
                    )}

                    {/* Feedback Button */}
                    {booking.status === 'confirmed' && 
                     isStayCompleted(booking.end_date) && 
                     !hasProvidedFeedback(booking) && (
                      <Button 
                        size="sm"
                        variant="secondary"
                        onClick={() => handleProvideFeedback(booking)}
                        className="gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Rate Your Stay
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
      </div>
    </div>
  );
};

export default MyBookings;