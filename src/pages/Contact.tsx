import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GoogleMapsLocator } from "@/components/ui/GoogleMapsLocator";

const Contact = () => {
  const { t } = useLanguage();
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
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-elegant text-2xl">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Enter your first name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Enter your last name" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email address" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="Enter your phone number" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="What can we help you with?" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us more about your inquiry or special requests..."
                      rows={6}
                    />
                  </div>

                  <Button className="w-full" size="lg">
                    Send Message
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    We typically respond within 2 hours during business hours.
                  </p>
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