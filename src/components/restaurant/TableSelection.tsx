
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { RestaurantTable } from '@/types/restaurant';

interface TableSelectionProps {
  selectedTable: RestaurantTable | null;
  onTableSelect: (table: RestaurantTable | null) => void;
}

export default function TableSelection({ selectedTable, onTableSelect }: TableSelectionProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedTable?.id === table.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            } ${table.status !== 'available' ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => table.status === 'available' && onTableSelect(table)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">Table {table.table_number}</div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Capacity: {table.capacity}
                </div>
                {table.location_description && (
                  <div className="text-sm text-gray-500 mt-1">
                    {table.location_description}
                  </div>
                )}
              </div>
              <Badge className={getStatusColor(table.status)}>
                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
              </Badge>
            </div>
          </div>
        ))}
        
        {selectedTable && (
          <Button
            variant="outline"
            onClick={() => onTableSelect(null)}
            className="w-full mt-4"
          >
            Clear Selection
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
