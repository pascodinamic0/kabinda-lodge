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
import { UserPlus, LogIn, ArrowLeft, Mail, Lock, User, Phone } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </CardTitle>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Sign in to manage your bookings' 
                : 'Create an account to book this room and manage your stays'
              }
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Registration-only fields */}
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
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
                    />
                  </div>
                </>
              )}

              {/* Common fields */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
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
                />
              </div>

              {/* Confirm password for registration */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
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
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    {isLogin ? <LogIn className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
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
                className="text-sm"
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
            <Separator className="my-4" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Hotel Staff?</p>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Staff Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <h4 className="font-semibold mb-2">✨ Guest Account Benefits:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Easy room booking and management</li>
                <li>• View your booking history</li>
                <li>• Secure payment tracking</li>
                <li>• Quick re-booking for favorite rooms</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientAuth;