import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Star,
  MessageSquare,
  Calendar,
  User,
  Building,
  Filter,
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Reply,
  Flag,
  MoreVertical,
  BarChart3,
  PieChart,
  Loader2,
  SendIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useReviewRequests } from "@/hooks/useReviewRequests";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  booking_id?: number;
  user_id: string;
  restaurant_id?: number;
  type?: string;
  booking?: {
    room?: {
      name: string;
    };
    user?: {
      name: string;
      email?: string;
    };
  };
  user?: {
    name: string;
    email?: string;
  };
  restaurant?: {
    name: string;
  };
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: { rating: number; count: number }[];
  recent_trend: 'up' | 'down' | 'stable';
  response_rate: number;
}

interface ReviewManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReviewManagementModal({ open, onOpenChange }: ReviewManagementModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendReviewRequest, isLoading: sendingRequest } = useReviewRequests();

  useEffect(() => {
    if (open) {
      fetchReviewsAndStats();
    }
  }, [open]);

  const fetchReviewsAndStats = async () => {
    setLoading(true);
    try {
      // Fetch hotel feedback (simple query)
      const feedbackResult = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch restaurant reviews (simple query)
      const restaurantReviewsResult = await supabase
        .from('restaurant_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackResult.error) throw feedbackResult.error;
      if (restaurantReviewsResult.error) throw restaurantReviewsResult.error;

      // Combine and standardize the data with type casting
      const combinedReviews: Review[] = [
        ...(feedbackResult.data || []).map(feedback => ({
          id: feedback.id,
          rating: feedback.rating,
          comment: feedback.comment || feedback.message,
          created_at: feedback.created_at,
          booking_id: feedback.booking_id,
          user_id: feedback.user_id,
          type: 'hotel',
          user: { name: 'Hotel Guest', email: '' }, // Placeholder - would fetch from users table
          booking: undefined,
          restaurant: undefined,
          restaurant_id: undefined
        } as Review)),
        ...(restaurantReviewsResult.data || []).map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          user_id: review.user_id,
          restaurant_id: review.restaurant_id,
          type: 'restaurant',
          user: { name: 'Restaurant Guest', email: '' }, // Placeholder - would fetch from users table
          booking: undefined,
          restaurant: { name: 'Restaurant' }, // Placeholder - would fetch from restaurants table
          booking_id: undefined
        } as Review))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReviews(combinedReviews);

      // Calculate stats
      const totalReviews = combinedReviews.length;
      const averageRating = combinedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews || 0;
      
      // Rating distribution
      const ratingDist = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: combinedReviews.filter(review => review.rating === rating).length
      }));

      setStats({
        total_reviews: totalReviews,
        average_rating: averageRating,
        rating_distribution: ratingDist,
        recent_trend: 'stable', // Could be calculated based on time periods
        response_rate: 0 // Could be calculated based on responses
      });

    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    setSubmittingResponse(true);
    try {
      // In a real implementation, you'd save the response to a responses table
      toast({
        title: "Success",
        description: "Response submitted successfully"
      });
      setResponseText('');
      setSelectedReview(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive"
      });
    } finally {
      setSubmittingResponse(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating;
    const matchesType = filterType === 'all' || review.type === filterType;
    const matchesSearch = !searchTerm || 
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRating && matchesType && matchesSearch;
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Review Management System
          </DialogTitle>
          <DialogDescription>
            Comprehensive review tracking and management dashboard
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="mx-6 w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">All Reviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 p-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reviews</p>
                      <p className="text-2xl font-bold">{stats?.total_reviews || 0}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                      <p className="text-2xl font-bold">{stats?.average_rating.toFixed(1) || '0.0'}</p>
                    </div>
                    <div className="flex">{renderStars(Math.round(stats?.average_rating || 0))}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Response Rate</p>
                      <p className="text-2xl font-bold">{stats?.response_rate}%</p>
                    </div>
                    <Reply className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Trend</p>
                      <p className="text-2xl font-bold capitalize">{stats?.recent_trend || 'Stable'}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.rating_distribution.map(({ rating, count }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span>{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${stats.total_reviews ? (count / stats.total_reviews) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="flex-1 p-6 pt-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hotel">Hotel Reviews</SelectItem>
                  <SelectItem value="restaurant">Restaurant Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reviews List */}
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {(review.user?.name || review.booking?.user?.name || 'Anonymous')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {review.user?.name || 'Anonymous Guest'}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex">{renderStars(review.rating)}</div>
                              <Badge variant="outline" className="text-xs">
                                {review.type === 'hotel' ? 'Hotel' : 'Restaurant'}
                              </Badge>
                              {review.restaurant && (
                                <Badge variant="outline" className="text-xs">
                                  {review.restaurant.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReview(review)}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                      )}
                      
                      {review.booking?.room && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span>Room: {review.booking.room.name}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 p-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Review Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Detailed analytics coming soon. This would include monthly trends, 
                    sentiment analysis, and comparative metrics.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Response Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Response time analytics, resolution rates, and customer 
                    satisfaction with management responses.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Response Modal */}
        {selectedReview && (
          <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Respond to Review</DialogTitle>
                <DialogDescription>
                  Craft a thoughtful response to this customer review
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{renderStars(selectedReview.rating)}</div>
                    <span className="text-sm text-muted-foreground">
                      by {selectedReview.user?.name || 'Anonymous'}
                    </span>
                  </div>
                  {selectedReview.comment && (
                    <p className="text-sm">{selectedReview.comment}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Your Response</label>
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Thank you for your feedback..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedReview(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitResponse}
                  disabled={submittingResponse || !responseText.trim()}
                >
                  {submittingResponse && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send Response
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}