import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import GoogleMapsLocator from "@/components/ui/GoogleMapsLocator";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { handleError, handleSuccess } from "@/utils/errorHandling";
import SocialLinks from "@/components/ui/SocialLinks";
import { useContent } from "@/hooks/useContent";
import { SocialLink } from "@/utils/socialMediaUtils";

const Contact = () => {
  const { t } = useLanguage();
  const { content: footerContent } = useContent('footer');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    // Extract social links from footer content
    if (footerContent?.social_links) {
      if (Array.isArray(footerContent.social_links)) {
        const normalized = footerContent.social_links.map((link: any) => {
          if (link.name && link.url) {
            return { name: link.name, url: link.url };
          }
          if (link.platform && link.url) {
            return { name: link.platform, url: link.url };
          }
          return link;
        }).filter((link: any) => link.name && link.url);
        setSocialLinks(normalized);
      } else if (typeof footerContent.social_links === 'object') {
        const links: SocialLink[] = [];
        Object.entries(footerContent.social_links).forEach(([key, url]) => {
          if (url && typeof url === 'string') {
            links.push({ name: key.charAt(0).toUpperCase() + key.slice(1), url });
          }
        });
        setSocialLinks(links);
      }
    }
  }, [footerContent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      handleError(new Error("Please fill in all required fields"), "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'contact',
          to: 'admin@kabidalodge.com', // Replace with actual admin email
          data: formData
        }
      });

      if (error) throw error;

      handleSuccess("Thank you for your message! We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      handleError(error, "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center">
            <h1 className="font-elegant text-5xl font-bold text-foreground mb-4">
              {t('contact_us', 'Contact Us')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're here to help make your stay exceptional. Reach out to us for reservations, 
              special requests, or any questions about your visit.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="font-elegant text-3xl font-bold text-foreground mb-6">
                  Get in Touch
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Our dedicated team is available around the clock to ensure your 
                  experience exceeds expectations.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Address</h3>
                        <p className="text-muted-foreground">
                          Avenue Lumumba<br />
                          Kabinda, Congo - Kinshasa<br />
                          Democratic Republic of Congo
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Phone</h3>
                        <p className="text-muted-foreground">
                          Main: +1 (555) 123-4567<br />
                          Reservations: +1 (555) 123-4568<br />
                          Emergency: +1 (555) 123-4569
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Email</h3>
                        <p className="text-muted-foreground">
                          General: info@kabidalodge.com<br />
                          Reservations: bookings@kabidalodge.com<br />
                          Events: events@kabidalodge.com
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Hours</h3>
                        <p className="text-muted-foreground">
                          Front Desk: 24/7<br />
                          Concierge: 6:00 AM - 12:00 AM<br />
                          Restaurant: 6:00 AM - 11:00 PM
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Links */}
                {socialLinks.length > 0 && (
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg mb-2">Follow Us</h3>
                        <SocialLinks 
                          links={socialLinks}
                          variant="buttons"
                          showLabels={false}
                          iconSize={20}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-elegant text-2xl">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input 
                          id="firstName" 
                          name="name"
                          placeholder="Enter your first name" 
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          placeholder="Enter your last name" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        placeholder="Enter your email address" 
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        type="tel" 
                        placeholder="Enter your phone number" 
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input 
                        id="subject" 
                        name="subject"
                        placeholder="What can we help you with?" 
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea 
                        id="message" 
                        name="message"
                        placeholder="Tell us more about your inquiry or special requests..."
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      We typically respond within 2 hours during business hours.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section Placeholder */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-elegant text-3xl font-bold text-foreground mb-4">
              Find Us
            </h2>
            <p className="text-lg text-muted-foreground">
              Located in the heart of Kabinda, easily accessible and ready to welcome you
            </p>
          </div>
          
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="h-96 rounded-lg overflow-hidden">
                <GoogleMapsLocator className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Contact;