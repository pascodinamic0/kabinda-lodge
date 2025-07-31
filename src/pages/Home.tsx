import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, Users, MapPin, Wifi, Car, Coffee, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
  const [heroImage, setHeroImage] = useState<any>(null);
  const [amenitiesContent, setAmenitiesContent] = useState<any>(null);
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
        setHeroImage(heroData.content);
      }
    } catch (error) {
      // Dynamic content fetch failed silently
    }
  };
  const fetchFeedback = async () => {
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

      // Fetch all users in one query
      const {
        data: usersData
      } = await supabase.from('users').select('id, name').in('id', userIds);

      // Create user lookup map
      const userMap = usersData?.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>) || {};

      // Map feedback with user data
      const feedbackWithUsers = (feedbackData || []).map(feedback => ({
        ...feedback,
        users: userMap[feedback.user_id] || null
      }));
      setFeedback(feedbackWithUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load guest feedback",
        variant: "destructive"
      });
    } finally {
      setLoadingFeedback(false);
    }
  };
  return <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        {/* Background - Video or Gradient */}
        {heroImage?.video_enabled && heroImage?.video_url ? <>
            {/* Video Background */}
            <video autoPlay muted loop playsInline poster={heroImage?.video_poster || heroImage?.image_url} className="absolute inset-0 w-full h-full object-cover">
              <source src={heroImage.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Video Overlay */}
            <div className="absolute inset-0 bg-black/40" />
          </> : (/* Gradient Background */
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />)}
        
        {/* Content Overlay */}
        <div className="relative z-10 container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-elegant text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              {t('welcome_to', 'Welcome to')}
              <span className="text-primary block">Kabinda Lodge</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {t('hero_description', 'Where luxury meets comfort in an unforgettable hospitality experience. Discover premium accommodations, exceptional restaurant experience, and personalized service that creates lasting memories.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="/rooms">
                  {t('explore_rooms', 'Explore Rooms')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link to="/client-auth">{t('guest_login', 'Guest Login')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-elegant text-4xl font-bold text-foreground mb-4">
              {t('premium_amenities', 'Premium Amenities & Services')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('amenities_description', 'Experience world-class facilities and personalized service designed to exceed your expectations')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={`feature-${feature.title}-${index}`} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-elegant text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-elegant text-4xl font-bold text-foreground mb-6 text-center">
                {t('legacy_excellence', 'A Legacy of Excellence')}
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('about_paragraph_1', 'For over two decades, Kabinda Lodge has been synonymous with luxury, comfort, and exceptional hospitality. Our commitment to creating unforgettable experiences has made us a preferred destination for discerning travelers worldwide.')}
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('about_paragraph_2', 'Every detail of your stay is carefully curated by our dedicated team, from the moment you arrive until your departure. We believe that true luxury lies in the perfect balance of comfort, service, and authentic experiences.')}
              </p>
              <Button size="lg" asChild>
                <Link to="/about">
                  {t('learn_more_about_us', 'Learn More About Us')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="relative rounded-lg h-96 overflow-hidden">
              <img src="/lovable-uploads/f8b6a78a-996e-4b21-b11f-1e782e469f24.png" alt="Beautiful location view of Kabinda Lodge" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-end">
                <div className="p-6 text-white">
                  <p className="text-lg font-medium">Beautiful Location</p>
                  <p className="text-white/90">Stunning views await you</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Feedback Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-elegant text-4xl font-bold text-foreground mb-4">
              {t('what_guests_say', 'What Our Guests Say')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('real_experiences', 'Real experiences from our valued guests')}
            </p>
          </div>
          
          {loadingFeedback ? <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div> : feedback.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {feedback.slice(0, 6).map(review => <Card key={review.id} className="border-border">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-5 w-5 text-accent fill-current" />)}
                    </div>
                    {review.message && <p className="text-muted-foreground mb-4 italic">"{review.message}"</p>}
                    <div>
                      <p className="font-semibold text-foreground">
                        {review.users?.name || 'Anonymous Guest'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>)}
            </div> : <div className="text-center">
              <p className="text-muted-foreground">{t('no_feedback_available', 'No guest feedback available yet.')}</p>
            </div>}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-elegant text-4xl font-bold mb-4">
            {t('ready_perfect_stay', 'Ready for Your Perfect Stay?')}
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            {t('book_luxury_experience', 'Book your luxury experience at Kabinda Lodge today')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
              <Link to="/rooms">{t('view_availability', 'View Availability')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/contact">{t('contact_us', 'Contact Us')}</Link>
            </Button>
          </div>
        </div>
      </section>
        </div>
      </main>
      <Footer />
    </div>;
};
export default Home;