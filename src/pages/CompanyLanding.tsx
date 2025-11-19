import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  Building, 
  Users, 
  Globe, 
  Star, 
  Award,
  TrendingUp,
  Shield,
  Heart,
  Target,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

const CompanyLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex flex-col items-start group transition-all duration-300">
              <span className="font-elegant font-bold text-2xl text-primary">
                & Digni Digital LLC
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <p className="text-xs text-muted-foreground font-sans tracking-wider uppercase opacity-80 px-1">
                  Excellence in Global Business
                </p>
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className="font-medium transition-colors hover:text-primary">About</a>
              <a href="#services" className="font-medium transition-colors hover:text-primary">Services</a>
              <a href="#expertise" className="font-medium transition-colors hover:text-primary">Expertise</a>
              <a href="#contact" className="font-medium transition-colors hover:text-primary">Contact</a>
              <Button asChild>
                <Link to="/kabinda-lodge">Visit Kabinda Lodge</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-elegant font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-6">
            Building Excellence
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Across Global Markets
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            & Digni Digital LLC is a premier global business conglomerate dedicated to delivering 
            exceptional value through strategic innovation, sustainable practices, and unwavering commitment 
            to excellence across diverse industries.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" className="px-8 py-4 text-lg" asChild>
              <Link to="/kabinda-lodge" className="gap-2">
                Explore Kabinda Lodge <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              Discover Our Services
            </Button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">25+</div>
              <p className="text-muted-foreground font-medium">Years of Excellence</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">150+</div>
              <p className="text-muted-foreground font-medium">Global Projects</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground font-medium">Countries Served</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground font-medium">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Domains Section */}
      <section id="expertise" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-elegant font-bold mb-6">Our Expertise Domains</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leveraging decades of experience across multiple industries to deliver comprehensive solutions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Hospitality & Tourism */}
            <Card className="hover:shadow-elegant transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Hospitality & Tourism</CardTitle>
                <CardDescription>Premium accommodation and hospitality services</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our flagship Kabinda Lodge exemplifies our commitment to luxury hospitality, 
                  offering world-class accommodation and conference facilities.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Luxury Accommodation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Conference Facilities
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Fine Dining
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/kabinda-lodge">
                    Visit Kabinda Lodge <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Business Consulting */}
            <Card className="hover:shadow-elegant transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Business Consulting</CardTitle>
                <CardDescription>Strategic advisory and management solutions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Comprehensive consulting services helping organizations optimize operations 
                  and achieve sustainable growth in competitive markets.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Strategic Planning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Operations Optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Market Analysis
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Global Partnerships */}
            <Card className="hover:shadow-elegant transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Global Partnerships</CardTitle>
                <CardDescription>International business development</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Facilitating strategic international partnerships and business development 
                  opportunities across emerging and established markets worldwide.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Market Entry Strategy
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Partnership Facilitation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Risk Assessment
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Technology Solutions */}
            <Card className="hover:shadow-elegant transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Technology Solutions</CardTitle>
                <CardDescription>Digital transformation and innovation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Cutting-edge technology solutions designed to streamline operations, 
                  enhance productivity, and drive digital transformation initiatives.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Digital Transformation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Process Automation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    System Integration
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Financial Services */}
            <Card className="hover:shadow-elegant transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Financial Services</CardTitle>
                <CardDescription>Investment and wealth management</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Comprehensive financial services including investment advisory, 
                  wealth management, and strategic financial planning for businesses and individuals.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Investment Advisory
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Wealth Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Financial Planning
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Sustainable Development */}
            <Card className="hover:shadow-elegant transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Sustainable Development</CardTitle>
                <CardDescription>Environmental and social responsibility</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Committed to sustainable business practices and community development initiatives 
                  that create positive environmental and social impact.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Environmental Initiatives
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Community Development
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    CSR Programs
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section id="about" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-elegant font-bold mb-8">Our Mission & Vision</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    Our Mission
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    To deliver exceptional value through strategic innovation, operational excellence, 
                    and sustainable practices while fostering meaningful partnerships that drive 
                    positive impact across global markets.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Star className="h-6 w-6 text-primary" />
                    Our Vision
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    To be the premier global business conglomerate recognized for transforming 
                    industries through innovation, excellence, and unwavering commitment to 
                    stakeholder success and sustainable development.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-6">Core Values</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-background rounded-lg border">
                  <Award className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Excellence</h4>
                    <p className="text-sm text-muted-foreground">
                      Committed to delivering the highest quality in every aspect of our business operations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-background rounded-lg border">
                  <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Integrity</h4>
                    <p className="text-sm text-muted-foreground">
                      Conducting business with transparency, honesty, and ethical practices in all relationships.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-background rounded-lg border">
                  <TrendingUp className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Innovation</h4>
                    <p className="text-sm text-muted-foreground">
                      Embracing cutting-edge solutions and creative approaches to solve complex challenges.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-background rounded-lg border">
                  <Heart className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Sustainability</h4>
                    <p className="text-sm text-muted-foreground">
                      Building a better future through responsible business practices and community engagement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-elegant font-bold mb-6">Ready to Experience Excellence?</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Discover the La Richarde difference at our flagship Kabinda Lodge. Experience luxury 
            hospitality, world-class facilities, and exceptional service that defines our commitment to excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" className="px-8 py-4 text-lg" asChild>
              <Link to="/kabinda-lodge">
                Explore Kabinda Lodge <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              Schedule a Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Stay Connected</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Subscribe to receive updates on our latest developments, exclusive offers, 
            and insights from our global business network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-1"
            />
            <Button className="px-6">
              Subscribe
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 px-4 bg-muted/30 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <h3 className="font-elegant font-bold text-2xl text-primary mb-4">& Digni Digital LLC</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                A premier global business conglomerate committed to excellence, innovation, 
                and sustainable development across diverse industries.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="p-2">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Linkedin className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><Link to="/kabinda-lodge" className="hover:text-primary transition-colors">Kabinda Lodge</Link></li>
                <li><a href="#expertise" className="hover:text-primary transition-colors">Our Expertise</a></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4">Contact Information</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>contact@laricharde.com</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <span>Global Headquarters<br />Business District</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 & Digni Digital LLC. All rights reserved. | 
              <a href="#" className="hover:text-primary transition-colors ml-1">Privacy Policy</a> | 
              <a href="#" className="hover:text-primary transition-colors ml-1">Terms of Service</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompanyLanding;