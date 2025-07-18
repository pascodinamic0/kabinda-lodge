import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, LogIn, Mail, Lock, User, Phone } from "lucide-react";

const ClientAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(false); // Default to sign-up for new users
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });

        navigate('/');
      } else {
        // Handle guest registration
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: formData.name,
              phone: formData.phone,
              role: 'Guest' // This will be used by the trigger
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Registration Successful!",
          description: "Please check your email to verify your account, then you can start booking rooms.",
        });

        // Reset form
        setFormData({
          email: "",
          password: "",
          name: "",
          phone: "",
          confirmPassword: ""
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-16">
      <div className="container max-w-md mx-auto px-4">
        <Card className="shadow-elegant">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-elegant font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              {isLogin 
                ? 'Sign in to manage your bookings and access exclusive features' 
                : 'Join us to book rooms, manage your stays, and enjoy personalized service'
              }
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Registration-only fields */}
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required={!isLogin}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-base">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+243 xxx xxx xxx"
                      required={!isLogin}
                      className="h-12 text-base"
                    />
                  </div>
                </>
              )}

              {/* Common fields */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-base">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={isLogin ? "Enter your password" : "Create a password (min. 6 characters)"}
                  required
                  className="h-12 text-base"
                />
              </div>

              {/* Confirm password for registration */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-base">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    required={!isLogin}
                    className="h-12 text-base"
                  />
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    {isLogin ? <LogIn className="h-5 w-5 mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                    {isLogin ? "Sign In" : "Create Account"}
                  </>
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-base"
              >
                {isLogin ? (
                  <>
                    Don't have an account?{" "}
                    <span className="font-semibold text-primary ml-1">Sign up here</span>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <span className="font-semibold text-primary ml-1">Sign in here</span>
                  </>
                )}
              </Button>
            </div>

            {/* Staff Access */}
            <Separator className="my-6" />
            <div className="text-center space-y-3">
              <p className="text-base text-muted-foreground font-medium">Hotel Staff?</p>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="w-full h-12 text-base">
                  Staff Login Portal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="mt-6 bg-gradient-to-r from-primary/5 to-primary-glow/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h4 className="font-elegant font-semibold text-lg mb-4 text-primary">✨ Guest Account Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Easy room & conference booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Secure payment tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Complete booking history</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Quick re-booking features</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientAuth;