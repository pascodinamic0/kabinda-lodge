import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  swift_code: string;
  branch: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useBankAccounts = (includeInactive: boolean = false) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let query = supabase
          .from('bank_accounts')
          .select('*')
          .order('bank_name');

        if (!includeInactive) {
          query = query.eq('is_active', true) as any;
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setBankAccounts(data || []);
      } catch (err) {
        console.error('Error fetching bank accounts:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch bank accounts'));
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccounts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('bank_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_accounts',
        },
        () => {
          // Refetch bank accounts when changes occur
          fetchBankAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [includeInactive]);

  return { bankAccounts, loading, error };
};







