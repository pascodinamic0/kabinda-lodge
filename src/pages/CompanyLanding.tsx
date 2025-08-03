import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Building, Users, Globe, Star } from 'lucide-react';

const CompanyLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header Section */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex flex-col items-center group transition-all duration-300">
              <span className="font-elegant font-bold text-2xl text-primary">
                La Richarde & Associates
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <p className="text-xs text-muted-foreground font-sans tracking-wider uppercase opacity-80 px-1">
                  Global Business Solutions
                </p>
                <div className="w-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              </div>
            </div>
            
            <Button asChild>
              <Link to="/kabinda-lodge">Visit Kabinda Lodge</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-6">
            Welcome to La Richarde & Associates
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Leading the way in global business solutions with excellence, innovation, and integrity. 
            Our diverse portfolio spans multiple industries, delivering exceptional value to our clients worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/kabinda-lodge" className="gap-2">
                Explore Kabinda Lodge <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              Learn About Our Services
            </Button>
          </div>
        </div>
      </section>

      {/* Business Portfolio Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Business Portfolio</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Kabinda Lodge Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Kabinda Lodge</CardTitle>
                <CardDescription>Premium Hospitality & Conference Facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Experience luxury accommodation, world-class dining, and state-of-the-art conference facilities in our flagship hospitality venture.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/kabinda-lodge">
                    Visit Kabinda Lodge <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Consulting Services Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Business Consulting</CardTitle>
                <CardDescription>Strategic Advisory & Management Solutions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive business consulting services helping organizations optimize operations and achieve sustainable growth.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Global Partnerships Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Global Partnerships</CardTitle>
                <CardDescription>International Business Development</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Facilitating international partnerships and business development opportunities across emerging markets.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose La Richarde & Associates?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Excellence in Service</h3>
                    <p className="text-sm text-muted-foreground">
                      Committed to delivering exceptional quality in every project and client interaction.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Global Perspective</h3>
                    <p className="text-sm text-muted-foreground">
                      International experience with deep understanding of diverse markets and cultures.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Innovation Focus</h3>
                    <p className="text-sm text-muted-foreground">
                      Leveraging cutting-edge technology and innovative approaches to solve complex challenges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Discover what makes our hospitality experience exceptional at Kabinda Lodge.
              </p>
              <Button size="lg" asChild>
                <Link to="/kabinda-lodge">
                  Explore Kabinda Lodge <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <h3 className="font-bold text-lg mb-2">La Richarde & Associates</h3>
          <p className="text-muted-foreground text-sm">
            Global Business Solutions • Premium Hospitality • Strategic Partnerships
          </p>
          <div className="mt-6">
            <Button variant="ghost" asChild>
              <Link to="/kabinda-lodge">Kabinda Lodge</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompanyLanding;