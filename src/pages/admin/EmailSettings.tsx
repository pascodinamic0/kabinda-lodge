import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { 
  Mail, 
  Key, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface ApiSecret {
  name: string;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
}

const API_SECRETS: ApiSecret[] = [
  {
    name: 'RESEND_API_KEY',
    label: 'Resend API Key',
    description: 'Required for sending email notifications. Get your API key from resend.com',
    placeholder: 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true
  }
];

export default function EmailSettings() {
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  // Load existing secrets status
  useEffect(() => {
    checkSecretsStatus();
  }, []);

  const checkSecretsStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-secrets', {
        body: {
          secrets: API_SECRETS.map(s => s.name)
        }
      });

      if (error) throw error;

      if (data?.secretStatus) {
        // Update local state to reflect which secrets are configured
        const configuredSecrets: Record<string, string> = {};
        Object.entries(data.secretStatus).forEach(([key, isConfigured]) => {
          if (isConfigured) {
            configuredSecrets[key] = '***configured***'; // Placeholder to show it's set
          }
        });
        setSecrets(configuredSecrets);
      }
    } catch (error) {
      console.error('Error checking secrets status:', error);
    }
  };

  const handleSecretUpdate = async (secretName: string, value: string) => {
    if (!value.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      toast({
        title: "Info",
        description: `Please use the Supabase dashboard to update ${secretName}. This will redirect you to the secrets management page.`,
      });
      
      // Open Supabase secrets management
      window.open(`https://supabase.com/dashboard/project/xgcsmkapakcyqxzxpuqk/settings/functions`, '_blank');
      
      // Clear the input field and check status after a delay
      setSecrets(prev => ({ ...prev, [secretName]: '' }));
      
      // Check status after a delay to allow user to update the secret
      setTimeout(() => {
        checkSecretsStatus();
      }, 3000);
      
    } catch (error) {
      console.error('Error updating secret:', error);
      toast({
        title: "Error",
        description: "Failed to open secrets management page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    if (!secrets['RESEND_API_KEY']) {
      toast({
        title: "Error",
        description: "Please configure RESEND_API_KEY first",
        variant: "destructive"
      });
      return;
    }

    setTestLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'test',
          to: testEmail,
          subject: 'Test Email from Kabinda Lodge',
          content: 'This is a test email to verify your email configuration is working correctly.'
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${testEmail}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test email. Please check your API key configuration.",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  const toggleKeyVisibility = (secretName: string) => {
    setShowKeys(prev => ({ ...prev, [secretName]: !prev[secretName] }));
  };

  const getSecretStatus = (secretName: string) => {
    const hasValue = secrets[secretName] && secrets[secretName].length > 0;
    return hasValue;
  };

  const refreshSecretStatus = () => {
    checkSecretsStatus();
    toast({
      title: "Refreshing",
      description: "Checking current secret status...",
    });
  };

  return (
    <DashboardLayout title="Email Settings">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Email Settings</h1>
              <p className="text-muted-foreground">Configure API keys for email functionality</p>
            </div>
            <Button 
              variant="outline" 
              onClick={refreshSecretStatus}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>
        </div>

        {/* API Keys Configuration */}
        <div className="space-y-6">
          {API_SECRETS.map((secret) => (
            <Card key={secret.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {secret.label}
                  {getSecretStatus(secret.name) ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Set
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{secret.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={secret.name}>API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <Input
                          id={secret.name}
                          type={showKeys[secret.name] ? "text" : "password"}
                          value={secrets[secret.name] || ''}
                          onChange={(e) => setSecrets(prev => ({ ...prev, [secret.name]: e.target.value }))}
                          placeholder={secret.placeholder}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleKeyVisibility(secret.name)}
                        >
                          {showKeys[secret.name] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleSecretUpdate(secret.name, secrets[secret.name] || '')}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Key className="h-4 w-4 mr-2" />
                        )}
                        Update in Supabase
                      </Button>
                    </div>
                  </div>

                  {secret.name === 'RESEND_API_KEY' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Getting your Resend API Key</h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <p>1. Sign up at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com</a></p>
                            <p>2. Verify your sending domain at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com/domains</a></p>
                            <p>3. Create an API key at <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com/api-keys</a></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Email Testing */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Email Configuration
            </CardTitle>
            <CardDescription>
              Send a test email to verify your configuration is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address to receive test email"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleTestEmail}
                disabled={testLoading || !testEmail.trim() || !getSecretStatus('RESEND_API_KEY')}
              >
                {testLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Test Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Status Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Functionality Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Service</span>
                {getSecretStatus('RESEND_API_KEY') ? (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-300">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User Email Notifications</span>
                {getSecretStatus('RESEND_API_KEY') ? (
                  <Badge variant="outline" className="text-green-600 border-green-300">Enabled</Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-300">Disabled</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Password Change Notifications</span>
                {getSecretStatus('RESEND_API_KEY') ? (
                  <Badge variant="outline" className="text-green-600 border-green-300">Enabled</Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-300">Disabled</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}