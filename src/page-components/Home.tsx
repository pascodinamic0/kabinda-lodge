import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, Users, MapPin, Wifi, Car, Coffee, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { fetchGoogleReviews, getGoogleReviewsConfig, type CachedReview } from "@/services/googleReviewsService";
import { ReviewCard } from "@/components/ui/ReviewCard";
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

interface HomeSlideshowProps {
  images: Array<{ url: string; alt_text: string; title?: string; category?: string }>;
  autoplay: boolean;
  interval?: number;
}

const HomeSlideshow = ({ images, autoplay, interval = 5000 }: HomeSlideshowProps) => {
  const [api, setApi] = useState<CarouselApi>(null);

  useEffect(() => {
    if (!api || !autoplay) {
      return;
    }

    const timer = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [api, autoplay, interval]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Carousel setApi={setApi} className="w-full h-full">
      <CarouselContent className="h-full">
        {images.map((image, index) => (
          <CarouselItem key={`slide-${index}`} className="h-full p-0">
            <div className="relative w-full h-full">
              <img
                src={image.url}
                alt={image.alt_text}
                loading={index === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {(image.title || image.category) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end transition-opacity duration-300 group-hover:opacity-90">
                  <div className="p-4 sm:p-6 text-white animate-slide-up">
                    {image.title && (
                      <p className="text-base sm:text-lg font-medium">{image.title}</p>
                    )}
                    {image.category && (
                      <p className="text-sm sm:text-base text-white/90">{image.category}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          <CarouselPrevious className="left-2 sm:left-4" />
          <CarouselNext className="right-2 sm:right-4" />
        </>
      )}
    </Carousel>
  );
};

const Home = () => {
  const {
    toast
  } = useToast();
  const {
    t
  } = useLanguage();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [googleReviews, setGoogleReviews] = useState<CachedReview[]>([]);
  const [loadingGoogleReviews, setLoadingGoogleReviews] = useState(true);
  const [googleReviewsConfig, setGoogleReviewsConfig] = useState<{ business_profile_url?: string } | null>(null);
  const [heroImage, setHeroImage] = useState<Record<string, unknown> | null>(null);
  const [amenitiesContent, setAmenitiesContent] = useState<Record<string, unknown> | null>(null);
  const [slideshowData, setSlideshowData] = useState<{
    images: Array<{ url: string; alt_text: string; title?: string; category?: string }>;
    autoplay: boolean;
    interval?: number;
  } | null>(null);
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
    fetchGoogleReviewsData();
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

      // Fetch slideshow content
      const {
        data: slideshowContent
      } = await supabase.from('website_content').select('content').eq('section', 'home_slideshow').single();
      if (slideshowContent) {
        const content = slideshowContent.content as {
          images?: Array<{ url: string; alt_text: string; title?: string; category?: string }>;
          autoplay?: boolean;
          interval?: number;
        };
        setSlideshowData({
          images: content.images || [],
          autoplay: content.autoplay ?? true,
          interval: content.interval ?? 5000,
        });
      }
    } catch (error) {
      // Dynamic content fetch failed silently
    }
  };
  const fetchGoogleReviewsData = async () => {
    try {
      setLoadingGoogleReviews(true);
      const config = await getGoogleReviewsConfig();
      
      if (config && config.enabled) {
        setGoogleReviewsConfig(config);
        const reviews = await fetchGoogleReviews(false);
        setGoogleReviews(reviews);
      } else {
        setGoogleReviews([]);
      }
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
      // Silently fail - we'll fallback to feedback
      setGoogleReviews([]);
    } finally {
      setLoadingGoogleReviews(false);
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
        let userMap: Record<string, { id: string; name: string }> = {};

        try {
          // Fetch user profiles using secure RPC function
          const {
            data: usersData,
            error: usersError
          } = await supabase.rpc('get_public_user_profiles', {
            user_ids: userIds
          });
          
          if (!usersError && usersData) {
            userMap = usersData.reduce((acc: Record<string, { id: string; name: string }>, user: { id: string; name: string }) => {
              acc[user.id] = user;
              return acc;
            }, {} as Record<string, { id: string; name: string }>);
          } else {
            console.warn('Could not fetch feedback authors (non-fatal):', usersError);
          }
        } catch (err) {
          console.warn('Error fetching feedback authors (non-fatal):', err);
        }

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
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] sm:h-[80vh] flex items-center overflow-hidden">
        {/* Background - Video, Image, or Gradient */}
        {heroImage?.video_enabled && heroImage?.video_url ? (
          <>
            {/* Video Background */}
            <video autoPlay muted loop playsInline poster={(heroImage?.video_poster as string) || (heroImage?.image_url as string)} className="absolute inset-0 w-full h-full object-cover">
              <source src={heroImage.video_url as string} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Video Overlay */}
            <div className="absolute inset-0 bg-black/60" />
          </>
        ) : heroImage?.image_url ? (
          <>
            {/* Image Background */}
            <img 
              src={heroImage.image_url as string} 
              alt={heroImage.alt_text as string || 'Hero Background'} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Image Overlay */}
            <div className="absolute inset-0 bg-black/60" />
          </>
        ) : (
          /* Gradient Background Fallback */
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
        
        {/* Content Overlay */}
        <div className="relative z-10 container-responsive">
          <div className="max-w-2xl lg:max-w-3xl animate-fade-in-up backdrop-blur-sm bg-black/10 rounded-lg p-4 sm:p-6 lg:p-8">
            {(() => {
              const hasMediaBackground = (heroImage?.video_enabled && heroImage?.video_url) || heroImage?.image_url;
              const textColorClass = hasMediaBackground ? 'text-white' : 'text-foreground';
              const mutedTextColorClass = hasMediaBackground ? 'text-white/90' : 'text-muted-foreground';
              
              return (
                <>
                  <h1 className={`font-elegant text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold ${textColorClass} mb-4 sm:mb-6 leading-tight animate-slide-up drop-shadow-xl`}>
                    {t('welcome_to', 'Welcome to')}
                    <span className={`${hasMediaBackground ? 'text-white' : 'text-primary'} block ${hasMediaBackground ? '' : 'bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent'} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
                      Kabinda Lodge & Suites
                    </span>
                  </h1>
                  <p className={`text-base sm:text-lg lg:text-xl ${mutedTextColorClass} mb-6 sm:mb-8 leading-relaxed animate-fade-in drop-shadow-lg`} style={{ animationDelay: '0.4s' }}>
                    {t('hero_description', 'Where luxury meets comfort in an unforgettable hospitality experience. Discover premium accommodations, exceptional restaurant experience, and personalized service that creates lasting memories.')}
                  </p>
                </>
              );
            })()}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 touch-manipulation hover-lift transition-smooth" asChild>
                <Link to="/rooms">
                  {t('explore_rooms', 'Explore Rooms')}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 touch-manipulation hover-lift transition-smooth" asChild>
                <Link to="/client-auth">{t('guest_login', 'Guest Login')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container-responsive">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
            <h2 className="font-elegant text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              {t('premium_amenities', 'Premium Amenities & Services')}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl lg:max-w-2xl mx-auto">
              {t('amenities_description', 'Experience world-class facilities and personalized service designed to exceed your expectations')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card 
                key={`feature-${feature.title}-${index}`} 
                className="border-border hover-lift transition-smooth touch-manipulation animate-scale-in card-responsive"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                    <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="font-elegant text-base sm:text-lg lg:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
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
                <Link to="/about">
                  {t('learn_more_about_us', 'Learn More About Us')}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            </div>
            <div className="relative rounded-lg h-64 sm:h-80 lg:h-96 overflow-hidden group animate-fade-in">
              {slideshowData && slideshowData.images && slideshowData.images.length > 0 ? (
                <HomeSlideshow 
                  images={slideshowData.images} 
                  autoplay={slideshowData.autoplay}
                  interval={slideshowData.interval}
                />
              ) : (
                // Fallback to static image if no slideshow configured
                <>
                  <img 
                    src="/lovable-uploads/f8b6a78a-996e-4b21-b11f-1e782e469f24.png" 
                    alt="Beautiful location view of Kabinda Lodge" 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end transition-opacity duration-300 group-hover:opacity-90">
                    <div className="p-4 sm:p-6 text-white animate-slide-up">
                      <p className="text-base sm:text-lg font-medium">Beautiful Location</p>
                      <p className="text-sm sm:text-base text-white/90">Stunning views await you</p>
                    </div>
                  </div>
                </>
              )}
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
          
          {(loadingFeedback || loadingGoogleReviews) ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
            </div>
          ) : (() => {
            // Combine reviews: Google reviews first, then internal feedback
            const allReviews: Array<{ type: 'google' | 'internal'; data: CachedReview | Feedback; index: number }> = [];
            
            // Add Google reviews
            googleReviews.slice(0, 6).forEach((review, index) => {
              allReviews.push({ type: 'google', data: review, index });
            });
            
            // Add internal feedback (fill remaining slots up to 6 total)
            const remainingSlots = 6 - allReviews.length;
            feedback.slice(0, remainingSlots).forEach((review, index) => {
              allReviews.push({ type: 'internal', data: review, index: allReviews.length + index });
            });

            if (allReviews.length > 0) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {allReviews.map((item, index) => (
                    <ReviewCard
                      key={item.type === 'google' ? (item.data as CachedReview).id : (item.data as Feedback).id}
                      review={item.data}
                      source={item.type}
                      businessProfileUrl={item.type === 'google' ? googleReviewsConfig?.business_profile_url : undefined}
                    />
                  ))}
                </div>
              );
            } else {
              return (
                <div className="text-center">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {t('no_feedback_available', 'No guest feedback available yet.')}
                  </p>
                </div>
              );
            }
          })()}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        <div className="container-responsive text-center relative z-10 animate-fade-in-up">
          <h2 className="font-elegant text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            {t('ready_perfect_stay', 'Ready for Your Perfect Stay?')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-primary-foreground/90">
            {t('book_luxury_experience', 'Book your luxury experience at Kabinda Lodge today')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 touch-manipulation hover-lift transition-smooth shadow-lg" asChild>
              <Link to="/rooms">{t('view_availability', 'View Availability')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary touch-manipulation hover-lift transition-smooth" asChild>
              <Link to="/contact">{t('contact_us', 'Contact Us')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;