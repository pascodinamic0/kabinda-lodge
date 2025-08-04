import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  booking_id: number;
  rating: number;
  message?: string;
  created_at: string;
  booking?: {
    room: {
      name: string;
      type: string;
    };
    start_date: string;
    end_date: string;
  };
}

export function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          booking:bookings(
            room:rooms(name, type),
            start_date,
            end_date
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load your reviews.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
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

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No Reviews Yet</p>
          <p className="text-muted-foreground text-center">
            You haven't submitted any reviews yet. Share your experience after your stay!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">
                {review.booking?.room.name || "Room Review"}
              </CardTitle>
              <div className="flex items-center gap-1">
                {renderStars(review.rating)}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{review.booking?.room.type}</span>
              {review.booking && (
                <span>
                  {new Date(review.booking.start_date).toLocaleDateString()} - {new Date(review.booking.end_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {review.message && (
              <div>
                <p className="text-sm leading-relaxed">
                  "{review.message}"
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Submitted {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </div>
              <Badge variant="outline" className="text-xs">
                Booking #{review.booking_id}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}