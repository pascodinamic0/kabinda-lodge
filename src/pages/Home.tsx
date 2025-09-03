import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, Users, MapPin, Wifi, Car, Coffee, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
interface Feedback {
  id: string;
  rating: number;
  message: string;
  created_at: string;
  user_id: string;
  users?: {
    name: string;
  };
}
const Home = () => {
  const {
    toast
  } = useToast();
  const {
    t
  } = useLanguage();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [heroImage, setHeroImage] = useState<Record<string, unknown> | null>(null);
  const [amenitiesContent, setAmenitiesContent] = useState<Record<string, unknown> | null>(null);
  const features = [{
    icon: Star,
    title: t('luxury_suites', 'Luxury Suites'),
    description: t('elegant_rooms_amenities', 'Elegant rooms with premium amenities')
  }, {
    icon: Users,
    title: t('concierge_service', 'Concierge Service'),
    description: t('personalized_assistance', '24/7 personalized assistance')
  }, {
    icon: Coffee,
    title: t('fine_restaurant', 'Fine Restaurant'),
    description: t('world_class_cuisine', 'World-class cuisine and beverages')
  }, {
    icon: Wifi,
    title: t('high_speed_wifi', 'High-Speed WiFi'),
    description: t('complimentary_wifi', 'Complimentary throughout property')
  }, {
    icon: Car,
    title: t('valet_parking', 'Valet Parking'),
    description: t('secure_parking', 'Secure and convenient parking')
  }, {
    icon: Shield,
    title: t('premium_security', 'Premium Security'),
    description: t('safety_priority', 'Your safety is our priority')
  }];
  useEffect(() => {
    fetchFeedback();
    fetchDynamicContent();
  }, []);
  const fetchDynamicContent = async () => {
    try {
      // Fetch hero image content
      const {
        data: heroData
      } = await supabase.from('website_content').select('content').eq('section', 'hero_image').single();
      if (heroData) {
        setHeroImage(heroData.content as Record<string, unknown>);
      }
    } catch (error) {
      // Dynamic content fetch failed silently
    }
  };
  const fetchFeedback = async (retryCount = 0) => {
    try {
      // First get feedback
      const {
        data: feedbackData,
        error: feedbackError
      } = await supabase.from('feedback').select('id, rating, message, created_at, user_id').order('created_at', {
        ascending: false
      }).limit(6);
      if (feedbackError) throw feedbackError;

      // Get all user IDs first
      const userIds = [...new Set((feedbackData || []).map(f => f.user_id))];

      // Only fetch users if we have feedback data
      if (feedbackData && feedbackData.length > 0) {
        // Fetch all users in one query using secure view
        const {
          data: usersData,
          error: usersError
        } = await supabase.from('users_staff_view').select('id, name').in('id', userIds);
        
        if (usersError) throw usersError;

        // Create user lookup map
        const userMap = usersData?.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, { id: string; name: string }>) || {};

        // Map feedback with user data
        const feedbackWithUsers = (feedbackData || []).map(feedback => ({
          ...feedback,
          users: userMap[feedback.user_id] || null
        })) as Feedback[];
        setFeedback(feedbackWithUsers);
      } else {
        // No feedback data available
        setFeedback([]);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      
      // Retry once if it's a network error
      if (retryCount === 0 && error instanceof Error && 
          (error.message.includes('network') || error.message.includes('timeout'))) {
        console.log('Retrying feedback fetch...');
        setTimeout(() => fetchFeedback(1), 2000);
        return;
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load guest feedback",
        variant: "destructive"
      });
    } finally {
      setLoadingFeedback(false);
    }
  };
  return <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] sm:h-[80vh] flex items-center overflow-hidden">
        {/* Background - Video or Gradient */}
        {heroImage?.video_enabled && heroImage?.video_url ? <>
            {/* Video Background */}
            <video autoPlay muted loop playsInline poster={(heroImage?.video_poster as string) || (heroImage?.image_url as string)} className="absolute inset-0 w-full h-full object-cover">
              <source src={heroImage.video_url as string} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Video Overlay */}
            <div className="absolute inset-0 bg-black/40" />
          </> : (/* Gradient Background */
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />)}
        
        {/* Content Overlay */}
        <div className="relative z-10 container-responsive">
          <div className="max-w-2xl lg:max-w-3xl">
            <h1 className="font-elegant text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              {t('welcome_to', 'Welcome to')}
              <span className="text-primary block">Kabinda Lodge</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              {t('hero_description', 'Where luxury meets comfort in an unforgettable hospitality experience. Discover premium accommodations, exceptional restaurant experience, and personalized service that creates lasting memories.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 touch-manipulation" asChild>
                <Link to="/kabinda-lodge/rooms">
                  {t('explore_rooms', 'Explore Rooms')}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 touch-manipulation" asChild>
                <Link to="/kabinda-lodge/client-auth">{t('guest_login', 'Guest Login')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container-responsive">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-elegant text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              {t('premium_amenities', 'Premium Amenities & Services')}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl lg:max-w-2xl mx-auto">
              {t('amenities_description', 'Experience world-class facilities and personalized service designed to exceed your expectations')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => <Card key={`feature-${feature.title}-${index}`} className="border-border hover:shadow-lg transition-shadow touch-manipulation">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <h3 className="font-elegant text-base sm:text-lg lg:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container-responsive">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="font-elegant text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                {t('legacy_excellence', 'A Legacy of Excellence')}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                {t('about_paragraph_1', 'For over two decades, Kabinda Lodge has been synonymous with luxury, comfort, and exceptional hospitality. Our commitment to creating unforgettable experiences has made us a preferred destination for discerning travelers worldwide.')}
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                {t('about_paragraph_2', 'Every detail of your stay is carefully curated by our dedicated team, from the moment you arrive until your departure. We believe that true luxury lies in the perfect balance of comfort, service, and authentic experiences.')}
              </p>
              <Button size="lg" className="touch-manipulation" asChild>
                <Link to="/kabinda-lodge/about">
                  {t('learn_more_about_us', 'Learn More About Us')}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            </div>
            <div className="relative rounded-lg h-64 sm:h-80 lg:h-96 overflow-hidden">
              <img src="/lovable-uploads/f8b6a78a-996e-4b21-b11f-1e782e469f24.png" alt="Beautiful location view of Kabinda Lodge" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-end">
                <div className="p-4 sm:p-6 text-white">
                  <p className="text-base sm:text-lg font-medium">Beautiful Location</p>
                  <p className="text-sm sm:text-base text-white/90">Stunning views await you</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Feedback Section */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container-responsive">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-elegant text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              {t('what_guests_say', 'What Our Guests Say')}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              {t('real_experiences', 'Real experiences from our valued guests')}
            </p>
          </div>
          
          {loadingFeedback ? <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
            </div> : feedback.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {feedback.slice(0, 6).map(review => <Card key={review.id} className="border-border">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex mb-3 sm:mb-4">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-accent fill-current" />)}
                    </div>
                    {review.message && <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4 italic line-clamp-mobile">"{review.message}"</p>}
                    <div>
                      <p className="font-semibold text-xs sm:text-sm lg:text-base text-foreground">
                        {review.users?.name || 'Anonymous Guest'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>)}
            </div> : <div className="text-center">
              <p className="text-sm sm:text-base text-muted-foreground">{t('no_feedback_available', 'No guest feedback available yet.')}</p>
            </div>}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-primary text-primary-foreground">
        <div className="container-responsive text-center">
          <h2 className="font-elegant text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            {t('ready_perfect_stay', 'Ready for Your Perfect Stay?')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-primary-foreground/90">
            {t('book_luxury_experience', 'Book your luxury experience at Kabinda Lodge today')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 touch-manipulation" asChild>
              <Link to="/kabinda-lodge/rooms">{t('view_availability', 'View Availability')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary touch-manipulation" asChild>
              <Link to="/kabinda-lodge/contact">{t('contact_us', 'Contact Us')}</Link>
            </Button>
          </div>
        </div>
      </section>
      </div>;
};
export default Home;