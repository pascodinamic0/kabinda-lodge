import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Star, 
  Calendar,
  User,
  Send,
  CheckCircle,
  Clock
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Booking {
  id: number;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  created_at: string;
  rooms: {
    name: string;
    type: string;
  };
  users: {
    name: string;
    email: string;
  };
  review_requests?: {
    id: string;
    sent_at: string;
    status: string;
  }[];
}

export default function ReviewManagement() {
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  const { toast } = useToast();

  // Helper function to extract guest name
  const getGuestName = (booking: any, userData: any): string => {
    // Priority 1: guest_name field from booking
    if (booking.guest_name) {
      return booking.guest_name;
    }
    
    // Priority 2: Only use user data if they're a guest (not staff)
    if (userData && userData.role === 'Guest') {
      return userData.name;
    }
    
    // Fallback
    return 'Guest';
  };

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    try {
      // First get bookings with room info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          start_date,
          end_date,
          status,
          notes,
          created_at,
          rooms (
            name,
            type
          )
        `)
        .eq('status', 'booked')
        .lte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: false })
        .limit(50);

      if (bookingsError) throw bookingsError;

      // Get user info and review requests for each booking
      const enrichedBookings = await Promise.all((bookingsData || []).map(async (booking) => {
        // Get user info (including role to exclude staff names)
        const { data: userData } = await supabase
          .from('users')
          .select('name, email, role')
          .eq('id', booking.user_id)
          .single();

        // Get review requests
        const { data: reviewRequestsData } = await supabase
          .from('review_requests')
          .select('id, sent_at, status')
          .eq('booking_id', booking.id);

        // PRIORITY: Use guest_name/email fields, NEVER show staff names or emails
        const guestName = getGuestName(booking, userData || null);
        const guestEmail = (booking as any).guest_email || 'Not provided';

        return {
          ...booking,
          users: { 
            name: guestName, 
            email: guestEmail 
          },
          review_requests: reviewRequestsData || []
        };
      }));

      setCompletedBookings(enrichedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch completed bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReviewRequest = async (booking: Booking) => {
    setSending(booking.id);
    
    try {
      // Call the edge function to send review request email
      const { error } = await supabase.functions.invoke('send-review-request', {
        body: {
          booking_id: booking.id,
          guest_email: booking.users.email,
          guest_name: booking.users.name,
          room_name: booking.rooms.name,
          check_out_date: booking.end_date
        }
      });

      if (error) throw error;

      // Record the review request in the database
      const { error: insertError } = await supabase
        .from('review_requests')
        .insert({
          booking_id: booking.id,
          user_id: booking.user_id,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

      if (insertError) throw insertError;

      toast({
        title: "Review Request Sent",
        description: `Review request sent to ${booking.users.name}`,
      });

      // Refresh the bookings list
      fetchCompletedBookings();
    } catch (error) {
      console.error('Error sending review request:', error);
      toast({
        title: "Error",
        description: "Failed to send review request",
        variant: "destructive"
      });
    } finally {
      setSending(null);
    }
  };

  const hasReviewRequestSent = (booking: Booking) => {
    return booking.review_requests && booking.review_requests.length > 0;
  };

  if (loading) {
    return (
      <DashboardLayout title="Review Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading completed bookings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Review Management">
      <div>
        <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Review Management</h1>
            <p className="text-muted-foreground mt-2">Send review requests to guests who have completed their stay</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {completedBookings.length} Completed Stays
            </Badge>
          </div>
        </div>

        {completedBookings.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Bookings</h3>
                <p className="text-muted-foreground">There are no completed bookings to send review requests for.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {booking.users.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{booking.users.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={hasReviewRequestSent(booking) ? "secondary" : "outline"}>
                        {hasReviewRequestSent(booking) ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Room</p>
                      <p className="text-sm text-muted-foreground">{booking.rooms.name} ({booking.rooms.type})</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Stay Period</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Booking ID</p>
                      <p className="text-sm text-muted-foreground">HOTEL-{booking.id}</p>
                    </div>
                  </div>

                  {hasReviewRequestSent(booking) ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Review request sent on {new Date(booking.review_requests![0].sent_at).toLocaleDateString()}
                    </div>
                  ) : (
                    <Button 
                      onClick={() => sendReviewRequest(booking)}
                      disabled={sending === booking.id}
                      className="w-full"
                    >
                      {sending === booking.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Review Request
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}