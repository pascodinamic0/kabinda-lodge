
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, user, userRole } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      // Redirect based on role
      switch (userRole) {
        case 'SuperAdmin':
          navigate('/super-admin');
          break;
        case 'Admin':
          navigate('/admin');
          break;
        case 'Receptionist':
          navigate('/reception');
          break;
        case 'RestaurantLead':
          navigate('/restaurant-dashboard');
          break;
        case 'Guest':
          navigate('/my-bookings');
          break;
        default:
          navigate('/admin'); // Default for staff login is admin dashboard
      }
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid credentials"
        });
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Please try again";
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: msg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('staff_login', 'Staff Login')}</CardTitle>
          <CardDescription>
            {t('staff_login_desc', 'Sign in to your Kabinda Lodge staff account')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Staff accounts are created by administrators only
            </div>
            
            <div>
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
