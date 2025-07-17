import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, AlertTriangle, Clock } from 'lucide-react';

export default function SecurityPolicies() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: '8',
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiry: '90',
  });

  const [sessionPolicy, setSessionPolicy] = useState({
    sessionTimeout: '120',
    maxConcurrentSessions: '3',
    requireReauth: true,
  });

  const [loginPolicy, setLoginPolicy] = useState({
    maxFailedAttempts: '5',
    lockoutDuration: '30',
    requireCaptcha: true,
  });

  const [auditSettings, setAuditSettings] = useState({
    logLoginAttempts: true,
    logDataChanges: true,
    logSystemAccess: true,
    retentionPeriod: '365',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would save to your database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Security policies updated",
        description: "All security policies have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security policies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Policies
          </CardTitle>
          <CardDescription>
            Configure password requirements and expiration policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-length">Minimum Length</Label>
              <Input
                id="min-length"
                type="number"
                value={passwordPolicy.minLength}
                onChange={(e) => setPasswordPolicy(prev => ({ ...prev, minLength: e.target.value }))}
                min="6"
                max="128"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-expiry">Password Expiry (days)</Label>
              <Input
                id="password-expiry"
                type="number"
                value={passwordPolicy.passwordExpiry}
                onChange={(e) => setPasswordPolicy(prev => ({ ...prev, passwordExpiry: e.target.value }))}
                min="30"
                max="365"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Require Uppercase Letters</Label>
              <Switch
                checked={passwordPolicy.requireUppercase}
                onCheckedChange={(checked) => setPasswordPolicy(prev => ({ ...prev, requireUppercase: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Lowercase Letters</Label>
              <Switch
                checked={passwordPolicy.requireLowercase}
                onCheckedChange={(checked) => setPasswordPolicy(prev => ({ ...prev, requireLowercase: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Numbers</Label>
              <Switch
                checked={passwordPolicy.requireNumbers}
                onCheckedChange={(checked) => setPasswordPolicy(prev => ({ ...prev, requireNumbers: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Special Characters</Label>
              <Switch
                checked={passwordPolicy.requireSpecialChars}
                onCheckedChange={(checked) => setPasswordPolicy(prev => ({ ...prev, requireSpecialChars: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Configure session timeouts and concurrent session limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={sessionPolicy.sessionTimeout}
                onChange={(e) => setSessionPolicy(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                min="15"
                max="480"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-sessions">Max Concurrent Sessions</Label>
              <Input
                id="max-sessions"
                type="number"
                value={sessionPolicy.maxConcurrentSessions}
                onChange={(e) => setSessionPolicy(prev => ({ ...prev, maxConcurrentSessions: e.target.value }))}
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Re-authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require password for sensitive operations
              </p>
            </div>
            <Switch
              checked={sessionPolicy.requireReauth}
              onCheckedChange={(checked) => setSessionPolicy(prev => ({ ...prev, requireReauth: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Login Protection
          </CardTitle>
          <CardDescription>
            Configure protection against brute force attacks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-attempts">Max Failed Attempts</Label>
              <Input
                id="max-attempts"
                type="number"
                value={loginPolicy.maxFailedAttempts}
                onChange={(e) => setLoginPolicy(prev => ({ ...prev, maxFailedAttempts: e.target.value }))}
                min="3"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
              <Input
                id="lockout-duration"
                type="number"
                value={loginPolicy.lockoutDuration}
                onChange={(e) => setLoginPolicy(prev => ({ ...prev, lockoutDuration: e.target.value }))}
                min="5"
                max="1440"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require CAPTCHA</Label>
              <p className="text-sm text-muted-foreground">
                Show CAPTCHA after failed attempts
              </p>
            </div>
            <Switch
              checked={loginPolicy.requireCaptcha}
              onCheckedChange={(checked) => setLoginPolicy(prev => ({ ...prev, requireCaptcha: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit & Logging
          </CardTitle>
          <CardDescription>
            Configure security audit and logging settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Log Login Attempts</Label>
              <Switch
                checked={auditSettings.logLoginAttempts}
                onCheckedChange={(checked) => setAuditSettings(prev => ({ ...prev, logLoginAttempts: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Log Data Changes</Label>
              <Switch
                checked={auditSettings.logDataChanges}
                onCheckedChange={(checked) => setAuditSettings(prev => ({ ...prev, logDataChanges: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Log System Access</Label>
              <Switch
                checked={auditSettings.logSystemAccess}
                onCheckedChange={(checked) => setAuditSettings(prev => ({ ...prev, logSystemAccess: checked }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retention-period">Log Retention Period (days)</Label>
            <Input
              id="retention-period"
              type="number"
              value={auditSettings.retentionPeriod}
              onChange={(e) => setAuditSettings(prev => ({ ...prev, retentionPeriod: e.target.value }))}
              min="30"
              max="2555"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Security Policies"}
        </Button>
      </div>
    </div>
  );
}