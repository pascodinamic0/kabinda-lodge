import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, CheckCircle, Clock, Wrench } from 'lucide-react';

interface RestaurantTable {
  id: number;
  table_number: string;
  capacity: number;
  status: string;
  location_description?: string;
  restaurant_id: number;
  created_at: string;
  updated_at: string;
}

export default function TableStatusManager() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTable, setUpdatingTable] = useState<number | null>(null);

  useEffect(() => {
    fetchTables();
    
    // Set up real-time subscription for table changes
    const tablesChannel = supabase
      .channel('restaurant-tables-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables'
        },
        () => {
          fetchTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
    };
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (tableId: number, newStatus: string) => {
    setUpdatingTable(tableId);
    
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);

      if (error) throw error;

      toast.success(`Table status updated to ${newStatus}`);
      fetchTables();
    } catch (error) {
      console.error('Error updating table status:', error);
      toast.error('Failed to update table status');
    } finally {
      setUpdatingTable(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      available: { 
        label: 'Available', 
        variant: 'default' as const, 
        icon: CheckCircle,
        color: 'text-green-600'
      },
      occupied: { 
        label: 'Occupied', 
        variant: 'destructive' as const, 
        icon: Users,
        color: 'text-red-600'
      },
      reserved: { 
        label: 'Reserved', 
        variant: 'secondary' as const, 
        icon: Clock,
        color: 'text-yellow-600'
      },
      maintenance: { 
        label: 'Maintenance', 
        variant: 'outline' as const, 
        icon: Wrench,
        color: 'text-gray-600'
      }
    };

    return configs[status as keyof typeof configs] || configs.available;
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      available: 'occupied',
      occupied: 'available',
      reserved: 'occupied',
      maintenance: 'available'
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || 'available';
  };

  const getActionLabel = (currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    const config = getStatusConfig(nextStatus);
    return `Mark as ${config.label}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table Status Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table Status Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No tables found. Contact your administrator to add tables.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = tables.reduce((acc, table) => {
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Status Manager</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">{statusCounts.available || 0} Available</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{statusCounts.occupied || 0} Occupied</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{statusCounts.reserved || 0} Reserved</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{statusCounts.maintenance || 0} Maintenance</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => {
                const statusConfig = getStatusConfig(table.status);
                const StatusIcon = statusConfig.icon;
                const isUpdating = updatingTable === table.id;
                
                return (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">
                      {table.table_number}
                    </TableCell>
                    <TableCell>
                      {table.capacity} guests
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTableStatus(table.id, getNextStatus(table.status))}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                            Updating...
                          </div>
                        ) : (
                          getActionLabel(table.status)
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}