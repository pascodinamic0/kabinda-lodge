import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import FeedbackModal from "@/components/feedback/FeedbackModal";

interface BookingForReview {
  id: number;
  start_date: string;
  end_date: string;
  room: {
    name: string;
    type: string;
  };
  feedback: any[];
}

export function LeaveReviewSection() {
  const [bookings, setBookings] = useState<BookingForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    bookingId?: number;
    roomName?: string;
  }>({ isOpen: false });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCompletedBookings();
    }
  }, [user]);

  const fetchCompletedBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          room:rooms(name, type),
          feedback(id, rating, message)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'confirmed')
        .lt('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching completed bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your completed bookings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProvideFeedback = (bookingId: number, roomName: string) => {
    setFeedbackModal({
      isOpen: true,
      bookingId,
      roomName,
    });
  };

  const handleFeedbackSubmitted = () => {
    setFeedbackModal({ isOpen: false });
    fetchCompletedBookings(); // Refresh to show feedback was submitted
    toast({
      title: "Review Submitted",
      description: "Thank you for your feedback!",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const bookingsWithoutFeedback = bookings.filter(booking => booking.feedback.length === 0);
  const bookingsWithFeedback = bookings.filter(booking => booking.feedback.length > 0);

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No Completed Stays</p>
          <p className="text-muted-foreground text-center">
            Complete a stay to leave a review and share your experience with us.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {bookingsWithoutFeedback.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Ready for Review</h3>
          <div className="space-y-4">
            {bookingsWithoutFeedback.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">
                      {booking.room.name}
                    </CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ready for Review
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{booking.room.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Button
                    onClick={() => handleProvideFeedback(booking.id, booking.room.name)}
                    className="w-full"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Leave Review
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {bookingsWithFeedback.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Already Reviewed</h3>
          <div className="space-y-4">
            {bookingsWithFeedback.map((booking) => (
              <Card key={booking.id} className="overflow-hidden opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">
                      {booking.room.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      Review Submitted
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{booking.room.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
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
  );
}