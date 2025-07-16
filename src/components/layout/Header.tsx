import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail, User, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Rooms & Suites", href: "/rooms" },
    { name: "Dining", href: "/dining" },
    { name: "Contact", href: "/contact" },
  ];


  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Top Contact Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>info@kabidalodge.com</span>
            </div>
          </div>
          <div className="hidden md:block">
            <span>Experience Luxury • Create Memories</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-elegant font-bold text-xl">K</span>
            </div>
            <div>
              <h1 className="font-elegant font-bold text-2xl text-foreground">Kabinda Lodge</h1>
              <p className="text-xs text-muted-foreground font-sans">Premium Hospitality</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "font-medium transition-colors hover:text-primary relative py-2",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                {item.name}
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth/CTA Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              // Authenticated user menu
              <>
                {userRole === 'Guest' ? (
                  // Guest user menu
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/my-bookings" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        My Bookings
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  // Staff user menu
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={
                        userRole === 'Admin' ? '/admin' :
                        userRole === 'Receptionist' ? '/reception' :
                        userRole === 'RestaurantLead' ? '/restaurant' : '/'
                      }>
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                )}
              </>
            ) : (
              // Non-authenticated menu
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Staff Login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/rooms">Book Now</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "block py-3 px-2 font-medium transition-colors",
                  isActive(item.href)
                    ? "text-primary border-l-2 border-primary"
                    : "text-foreground hover:text-primary"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              {user ? (
                // Authenticated mobile menu
                <>
                  {userRole === 'Guest' ? (
                    <>
                      <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                        <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)}>
                          <Calendar className="h-4 w-4" />
                          My Bookings
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                        <Link to={
                          userRole === 'Admin' ? '/admin' :
                          userRole === 'Receptionist' ? '/reception' :
                          userRole === 'RestaurantLead' ? '/restaurant' : '/'
                        } onClick={() => setIsMenuOpen(false)}>
                          <User className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  )}
                </>
              ) : (
                // Non-authenticated mobile menu
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      Staff Login
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/rooms" onClick={() => setIsMenuOpen(false)}>
                      Book Now
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;