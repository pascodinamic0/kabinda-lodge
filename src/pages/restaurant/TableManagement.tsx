import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TableStatusManager from '@/components/restaurant/TableStatusManager';

const RestaurantTableManagement = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
          <p className="text-muted-foreground">
            Manage table occupancy and availability status
          </p>
        </div>
        
        <TableStatusManager />
      </div>
    </DashboardLayout>
  );
};

export default RestaurantTableManagement;