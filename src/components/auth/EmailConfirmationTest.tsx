import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  TestTube, 
  CheckCircle, 
  Loader2,
  Send
} from 'lucide-react';

export default function EmailConfirmationTest() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const testConfirmationEmail = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      // Test the confirmation email directly
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'email-confirmation',
          to: testEmail,
          data: {
            confirmation_url: `${window.location.origin}/auth?confirmed=true&test=true`,
            user_email: testEmail
          }
        }
      });

      if (error) throw error;

      setTestResult({
        success: true,
        message: `Test confirmation email sent successfully to ${testEmail}`
      });

      toast({
        title: "Test Email Sent",
        description: `Check ${testEmail} for the confirmation email`,
      });
    } catch (error: any) {
      console.error('Error testing confirmation email:', error);
      setTestResult({
        success: false,
        message: error.message || "Failed to send test confirmation email"
      });
      
      toast({
        title: "Test Failed",
        description: "Failed to send test confirmation email. Please check your email configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testSignupFlow = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      // Test the actual signup flow with confirmation
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`
        }
      });

      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        setTestResult({
          success: true,
          message: `Test signup successful! Confirmation email should be sent to ${testEmail}`
        });

        toast({
          title: "Test Signup Successful",
          description: `Check ${testEmail} for the confirmation email`,
        });
      } else {
        setTestResult({
          success: true,
          message: "User already exists or email already confirmed"
        });
      }
    } catch (error: any) {
      console.error('Error testing signup flow:', error);
      setTestResult({
        success: false,
        message: error.message || "Failed to test signup flow"
      });
      
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test signup flow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Email Confirmation Testing
        </CardTitle>
        <CardDescription>
          Test the custom email confirmation system using Resend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="test-email">Test Email Address</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address for testing"
              className="flex-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={testConfirmationEmail}
            disabled={loading || !testEmail.trim()}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Test Confirmation Email
          </Button>

          <Button
            onClick={testSignupFlow}
            disabled={loading || !testEmail.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Test Full Signup Flow
          </Button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <TestTube className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {testResult.success ? 'Test Successful' : 'Test Failed'}
                </p>
                <p className="text-sm mt-1">{testResult.message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">How this works:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Test Confirmation Email:</strong> Sends a custom branded confirmation email directly</p>
                <p>• <strong>Test Full Signup Flow:</strong> Creates a test user account and triggers the confirmation email</p>
                <p>• Both tests use the custom Resend-powered email system with your branding</p>
                <p>• The confirmation links will redirect back to this application (not localhost)</p>
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}