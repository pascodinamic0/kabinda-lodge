
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
  currentUserRole?: string;
}

export default function UserModal({ isOpen, onClose, user, onSuccess, currentUserRole }: UserModalProps) {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetingPassword, setResetingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Receptionist',
    phone: user?.phone || '',
    password: ''
  });
  const [passwordReset, setPasswordReset] = useState({
    newPassword: '',
    reason: ''
  });
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [newPasswordStrength, setNewPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Reset form data when user prop changes
  React.useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'Receptionist',
      phone: user?.phone || '',
      password: ''
    });
    setPasswordReset({
      newPassword: '',
      reason: ''
    });
    setPasswordStrength(null);
    setNewPasswordStrength(null);
  }, [user]);

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'weak';
    if (password.length >= 8 && password.match(/[A-Z]/) && password.match(/[0-9]/)) return 'strong';
    return 'medium';
  };

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    if (password && !user) {
      setPasswordStrength(validatePassword(password));
    }
  };

  const handleNewPasswordChange = (password: string) => {
    setPasswordReset(prev => ({ ...prev, newPassword: password }));
    if (password) {
      setNewPasswordStrength(validatePassword(password));
    } else {
      setNewPasswordStrength(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!user || !passwordReset.newPassword) return;
    
    setResetingPassword(true);
    
    try {
      if (passwordReset.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const { error } = await supabase.functions.invoke('admin-password-reset', {
        body: {
          targetUserId: user.id,
          newPassword: passwordReset.newPassword,
          reason: passwordReset.reason || 'SuperAdmin password reset via UserModal'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset successfully. The user will need to use the new password on next login.",
      });

      // Clear the password reset form
      setPasswordReset({ newPassword: '', reason: '' });
      setNewPasswordStrength(null);

    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Password Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setResetingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.email.trim()) {
        toast({
          title: "Validation Error",
          description: "Name and email are required",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if trying to create/modify admin and current user is not SuperAdmin
      if ((formData.role === 'Admin' || formData.role === 'SuperAdmin') && userRole !== 'SuperAdmin') {
        toast({
          title: "Access Denied",
          description: "Only Super Administrators can create or modify admin/super admin users",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (user) {
        // Check if email is being changed
        const emailChanged = formData.email !== user.email;
        
        // Check if role has changed
        const roleChanged = user.role !== formData.role;
        
        if (roleChanged) {
          // Use the secure role update function
          const { error: roleError } = await supabase.rpc('update_user_role', {
            target_user_id: user.id,
            new_role: formData.role as 'SuperAdmin' | 'Admin' | 'Receptionist' | 'RestaurantLead' | 'Guest',
            reason: 'Super Admin role update via UserModal'
          });

          if (roleError) throw roleError;
        }

        // Update user data in users table
        const updateData: any = {
          name: formData.name.trim(),
          phone: formData.phone.trim() || null
        };

        // Only include email if it changed and user is SuperAdmin
        if (emailChanged && currentUserRole === 'SuperAdmin') {
          updateData.email = formData.email;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;

        // Update email in auth system if changed
        if (emailChanged && currentUserRole === 'SuperAdmin') {
          try {
            const { error: authError } = await supabase.auth.admin.updateUserById(
              user.id,
              { email: formData.email }
            );
            if (authError) throw authError;

            // Send notification email to new email address
            await supabase.functions.invoke('send-notification-email', {
              body: {
                type: 'account-update',
                to: formData.email,
                data: {
                  userName: formData.name,
                  email: formData.email,
                  role: formData.role
                }
              }
            });
          } catch (emailError) {
            console.warn("Failed to update email or send notification:", emailError);
          }
        }

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Validate password for new users
        if (!formData.password || formData.password.length < 8) {
          toast({
            title: "Password Error",
            description: "Password must be at least 8 characters long",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Create new user via Supabase auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: formData.name.trim(),
              role: formData.role,
              phone: formData.phone.trim() || null
            }
          }
        });

        if (authError) throw authError;

        // Log the user creation for audit purposes
        console.log('New staff user created:', {
          email: formData.email,
          role: formData.role,
          createdBy: userRole
        });

        toast({
          title: "Success",
          description: `${formData.role} account created successfully. The user can now log in with their credentials.`,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('User creation/update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPasswordStrengthColor = (strength: string | null) => {
    switch (strength) {
      case 'weak': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'strong': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit Staff Member' : 'Create New Staff Account'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update staff member information and role' : 'Create a new staff account with secure credentials'}
          </DialogDescription>
        </DialogHeader>
        
        {!user && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Staff accounts can only be created by administrators. The new user will receive their login credentials.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  placeholder="Enter secure password (min. 8 characters)"
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
              {passwordStrength && (
                <p className={`text-xs ${getPasswordStrengthColor(passwordStrength)}`}>
                  Password strength: {passwordStrength}
                  {passwordStrength === 'weak' && ' - Use 8+ characters with uppercase and numbers'}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {userRole === 'SuperAdmin' && <SelectItem value="SuperAdmin">Super Admin</SelectItem>}
                {userRole === 'SuperAdmin' && <SelectItem value="Admin">Admin</SelectItem>}
                <SelectItem value="Receptionist">Receptionist</SelectItem>
                <SelectItem value="RestaurantLead">Restaurant Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SuperAdmin Password Reset Section */}
          {user && userRole === 'SuperAdmin' && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label className="text-sm font-medium">Password Reset (SuperAdmin Only)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Reset this user's password. They will need to use the new password on their next login.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordReset.newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {newPasswordStrength && (
                  <p className={`text-xs ${getPasswordStrengthColor(newPasswordStrength)}`}>
                    Password strength: {newPasswordStrength}
                    {newPasswordStrength === 'weak' && ' - Use 8+ characters with uppercase and numbers'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resetReason">Reason (Optional)</Label>
                <Input
                  id="resetReason"
                  value={passwordReset.reason}
                  onChange={(e) => setPasswordReset(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for password reset"
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handlePasswordReset}
                disabled={!passwordReset.newPassword || resetingPassword}
              >
                {resetingPassword ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : (user ? 'Update Staff Member' : 'Create Account')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
