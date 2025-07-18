import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Monitor, Coffee, Wifi, MapPin, Camera, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConferenceRoom {
  id: number;
  name: string;
  capacity: number;
  hourlyRate: number;
  description: string;
  features: string[];
  images: string[];
  status: 'available' | 'occupied' | 'maintenance';
}

const Conference = () => {
  const [conferenceRooms, setConferenceRooms] = useState<ConferenceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Mock data for now - you can replace this with actual API call
  useEffect(() => {
    const mockRooms: ConferenceRoom[] = [
      {
        id: 1,
        name: "Executive Boardroom",
        capacity: 12,
        hourlyRate: 150,
        description: "Premium boardroom with state-of-the-art technology and elegant furnishings, perfect for executive meetings and presentations.",
        features: ["4K Display", "Video Conferencing", "Premium Audio", "Coffee Service", "High-Speed WiFi", "Whiteboard"],
        images: ["/placeholder.svg"],
        status: 'available'
      },
      {
        id: 2,
        name: "Innovation Hub",
        capacity: 20,
        hourlyRate: 200,
        description: "Modern conference space designed for creative collaboration and team building sessions.",
        features: ["Interactive Display", "Breakout Areas", "Standing Desks", "Natural Light", "Brainstorming Tools", "Refreshments"],
        images: ["/placeholder.svg"],
        status: 'available'
      },
      {
        id: 3,
        name: "Meeting Pod",
        capacity: 6,
        hourlyRate: 75,
        description: "Intimate meeting space ideal for small team discussions and client consultations.",
        features: ["Smart TV", "Video Calling", "Privacy Glass", "Ergonomic Seating", "WiFi", "Coffee Machine"],
        images: ["/placeholder.svg"],
        status: 'occupied'
      }
    ];

    // Simulate loading
    setTimeout(() => {
      setConferenceRooms(mockRooms);
      setLoading(false);
    }, 500);
  }, []);

  const handleBookNow = (room: ConferenceRoom) => {
    if (!user) {
      navigate('/client-auth', { 
        state: { from: `/conference/${room.id}` }
      });
      return;
    }
    navigate(`/book-conference/${room.id}`);
  };

  const getFeatureIcon = (feature: string) => {
    const icons: Record<string, typeof Monitor> = {
      "4K Display": Monitor,
      "Video Conferencing": Camera,
      "WiFi": Wifi,
      "High-Speed WiFi": Wifi,
      "Coffee Service": Coffee,
      "Coffee Machine": Coffee,
      "Refreshments": Coffee,
    };
    return icons[feature] || Monitor;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-glow py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-elegant font-bold text-primary-foreground mb-6">
            {t("conference.title", "Conference Rooms")}
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            {t("conference.subtitle", "Professional meeting spaces equipped with modern technology for your business needs")}
          </p>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-elegant font-bold text-foreground mb-4">
              {t("conference.available_rooms", "Available Conference Rooms")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("conference.description", "Choose from our selection of modern conference rooms designed for productivity and collaboration")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {conferenceRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                <div className="relative">
                  <img 
                    src={room.images[0]} 
                    alt={room.name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge 
                    variant={room.status === 'available' ? 'default' : 'secondary'}
                    className="absolute top-4 right-4"
                  >
                    {room.status === 'available' ? t("common.available", "Available") : t("common.occupied", "Occupied")}
                  </Badge>
                </div>
                
                <CardHeader>
                  <CardTitle className="font-elegant">{room.name}</CardTitle>
                  <CardDescription>{room.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {t("conference.capacity", `Up to ${room.capacity} people`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-primary">
                        ${room.hourlyRate}/hr
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t("conference.features", "Features")}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {room.features.slice(0, 4).map((feature) => {
                        const IconComponent = getFeatureIcon(feature);
                        return (
                          <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <IconComponent className="h-3 w-3" />
                            <span>{feature}</span>
                          </div>
                        );
                      })}
                    </div>
                    {room.features.length > 4 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        +{room.features.length - 4} {t("conference.more_features", "more features")}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/conference/${room.id}`)}
                  >
                    {t("common.view_details", "View Details")}
                  </Button>
                  <Button 
                    className="flex-1 gap-2"
                    onClick={() => handleBookNow(room)}
                    disabled={room.status !== 'available'}
                  >
                    <Calendar className="h-4 w-4" />
                    {t("common.book_now", "Book Now")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-elegant font-bold text-foreground mb-4">
              {t("conference.additional_services", "Additional Services")}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Coffee className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>{t("conference.catering", "Catering Services")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("conference.catering_desc", "Professional catering for your meetings and events")}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Monitor className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>{t("conference.tech_support", "Tech Support")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("conference.tech_support_desc", "On-site technical assistance for your presentations")}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>{t("conference.location", "Prime Location")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("conference.location_desc", "Conveniently located with easy access and parking")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Conference;