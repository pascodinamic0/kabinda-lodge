/**
 * Agent Management Page
 * Full page wrapper for AgentManagement component
 */
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { AgentManagement as AgentManagementComponent } from '@/components/admin/AgentManagement';
import { useEffect, useState } from 'react';
import { getDefaultHotelId } from '@/utils/hotelUtils';

const AgentManagement: React.FC = () => {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHotelId = async () => {
      try {
        console.log('Loading hotel ID...');
        const id = await getDefaultHotelId();
        console.log('Hotel ID loaded:', id);
        setHotelId(id);
      } catch (error: any) {
        console.error('Error loading hotel ID:', error);
        // Set a timeout to stop loading after 10 seconds even if there's an error
        setTimeout(() => {
          setLoading(false);
        }, 10000);
        // Show error to user
        alert(`Error loading hotel: ${error.message}\n\nPlease check:\n1. Hotel exists in Supabase\n2. RLS policies allow reading hotels\n3. Browser console for details`);
      } finally {
        setLoading(false);
      }
    };
    loadHotelId();
  }, []);

  if (loading || !hotelId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AgentManagementComponent hotelId={hotelId} />
    </DashboardLayout>
  );
};

export default AgentManagement;

