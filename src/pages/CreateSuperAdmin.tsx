import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function CreateSuperAdminPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSuperAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-super-admin');
      
      if (error) {
        toast({
          title: "Error",
          description: `Failed to create Super Admin: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Super Admin user created successfully!",
        variant: "default"
      });

      console.log('Super Admin created:', data);
    } catch (err) {
      console.error('Error calling function:', err);
      toast({
        title: "Error", 
        description: "Failed to call create function",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-6 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create Super Admin</h2>
          <p className="text-muted-foreground mt-2">
            This will create the auth user for ekabilam@gmail.com
          </p>
        </div>
        
        <Button 
          onClick={createSuperAdmin}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Super Admin User'}
        </Button>
      </div>
    </div>
  );
}