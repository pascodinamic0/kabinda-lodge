import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess } from "@/utils/errorHandling";

export const useReviewRequests = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendReviewRequest = async (bookingId: number) => {
    setIsLoading(true);
    
    try {
      // Get booking details with user and room information
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          user_id,
          room_id,
          users!bookings_user_id_fkey(name, email),
          rooms!bookings_room_id_fkey(name)
        `)
        .eq('id', bookingId)
        .eq('status', 'confirmed')
        .single();

      if (bookingError) throw bookingError;
      
      if (!booking) {
        throw new Error('Booking not found or not confirmed');
      }

      // Check if review request already sent
      const { data: existingRequest } = await supabase
        .from('review_requests')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      if (existingRequest) {
        throw new Error('Review request already sent for this booking');
      }

      // Send review request email
      const reviewLink = `${window.location.origin}/reviews?booking=${bookingId}`;
      
      const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'review-request',
          to: booking.users.email,
          data: {
            guestName: booking.users.name,
            roomName: booking.rooms.name,
            startDate: booking.start_date,
            endDate: booking.end_date,
            reviewLink: reviewLink
          }
        }
      });

      if (emailError) throw emailError;

      // Log the review request
      const { error: logError } = await supabase.rpc('handle_review_request_insert', {
        p_booking_id: bookingId,
        p_user_id: booking.user_id
      });

      if (logError) throw logError;

      handleSuccess("Review request sent successfully");
      return true;

    } catch (error) {
      handleError(error, "Failed to send review request");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendReviewRequest,
    isLoading
  };
};