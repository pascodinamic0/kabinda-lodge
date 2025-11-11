import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  icon_name: string | null;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = (includeInactive: boolean = false) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let query = supabase
          .from('payment_methods')
          .select('*')
          .order('name');

        if (!includeInactive) {
          query = query.eq('is_active', true) as any;
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setPaymentMethods(data || []);
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch payment methods'));
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('payment_methods_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_methods',
        },
        () => {
          // Refetch payment methods when changes occur
          fetchPaymentMethods();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [includeInactive]);

  return { paymentMethods, loading, error };
};




