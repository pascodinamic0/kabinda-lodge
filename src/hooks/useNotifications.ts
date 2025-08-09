
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RoutePaths } from '@/routes/paths';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (!user || !userRole) return;

    // Load initial notifications based on user role
    loadNotifications();

    // Set up real-time subscriptions based on user role
    const subscriptions = setupRoleBasedSubscriptions();

    return () => {
      subscriptions.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
    };
  }, [user, userRole]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    if (!userRole) return;

    try {
      // Generate role-specific notifications
      const roleNotifications = await getRoleBasedNotifications(userRole);
      setNotifications(roleNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      addNotification({
        title: 'System Alert',
        message: 'Unable to load notifications',
        type: 'error',
        priority: 'high'
      });
    }
  };

  const setupRoleBasedSubscriptions = () => {
    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    if (userRole === 'SuperAdmin') {
      // SuperAdmin gets notifications about all system activities
      const systemChannel = supabase
        .channel('superadmin_system')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        }, (payload: any) => {
          addNotification({
            title: 'User Management',
            message: `User ${payload.eventType === 'INSERT' ? 'registered' : 'updated'}`,
            type: 'info',
            priority: 'medium'
          });
        })
        .subscribe();

      const paymentsChannel = supabase
        .channel('superadmin_payments')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'payments' 
        }, (payload: any) => {
          addNotification({
            title: 'Payment Activity',
            message: `Payment ${payload.eventType === 'INSERT' ? 'processed' : 'updated'}`,
            type: 'success',
            priority: 'medium'
          });
        })
        .subscribe();

      subscriptions.push(systemChannel, paymentsChannel);
    }
    else if (userRole === 'Admin') {
      // Admin gets notifications about all activities
      const bookingsChannel = supabase
        .channel('admin_bookings')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, (payload: any) => {
          addNotification({
            title: 'New Booking Activity',
            message: `Booking ${payload.eventType === 'INSERT' ? 'created' : 'updated'}`,
            type: 'info',
            priority: 'medium'
          });
        })
        .subscribe();

      const paymentsChannel = supabase
        .channel('admin_payments')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'payments' 
        }, (payload: any) => {
          addNotification({
            title: 'Payment Activity',
            message: `Payment ${payload.eventType === 'INSERT' ? 'received' : 'updated'}`,
            type: 'success',
            priority: 'medium'
          });
        })
        .subscribe();

      const ordersChannel = supabase
        .channel('admin_orders')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, (payload: any) => {
          addNotification({
            title: 'Restaurant Order',
            message: `Order ${payload.eventType === 'INSERT' ? 'placed' : 'updated'}`,
            type: 'info',
            priority: 'low'
          });
        })
        .subscribe();

      subscriptions.push(bookingsChannel, paymentsChannel, ordersChannel);
    } 
    else if (userRole === 'Receptionist') {
      // Receptionist gets notifications about bookings and payments
      const bookingsChannel = supabase
        .channel('reception_bookings')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, (payload: any) => {
          addNotification({
            title: 'Booking Update',
            message: `New booking requires attention`,
            type: 'warning',
            priority: 'high',
            actionUrl: RoutePaths.Reception.Guests
          });
        })
        .subscribe();

      const paymentsChannel = supabase
        .channel('reception_payments')
        .on('postgres_changes' as any, { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments' 
        }, (payload: any) => {
          addNotification({
            title: 'Payment Received',
            message: 'A new payment has been processed',
            type: 'success',
            priority: 'medium',
            actionUrl: RoutePaths.Reception.Payments
          });
        })
        .subscribe();

      subscriptions.push(bookingsChannel, paymentsChannel);
    } 
    else if (userRole === 'RestaurantLead') {
      // Restaurant lead gets notifications about orders and menu
      const ordersChannel = supabase
        .channel('restaurant_orders')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, (payload: any) => {
          addNotification({
            title: 'Order Update',
            message: `Order ${payload.eventType === 'INSERT' ? 'placed' : 'updated'}`,
            type: 'info',
            priority: 'high',
            actionUrl: RoutePaths.Restaurant.Orders
          });
        })
        .subscribe();

      const menuChannel = supabase
        .channel('restaurant_menu')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        }, (payload: any) => {
          addNotification({
            title: 'Menu Update',
            message: 'Menu items have been updated',
            type: 'info',
            priority: 'medium',
            actionUrl: RoutePaths.Admin.Menu
          });
        })
        .subscribe();

      subscriptions.push(ordersChannel, menuChannel);
    }
    else if (userRole === 'Kitchen') {
      // Kitchen staff gets notifications about orders
      const ordersChannel = supabase
        .channel('kitchen_orders')
        .on('postgres_changes' as any, { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, (payload: any) => {
          const order = payload.new as any;
          if (order?.status === 'pending' || order?.status === 'confirmed') {
            addNotification({
              title: 'New Order',
              message: `Order #${order?.tracking_number || 'Unknown'} requires preparation`,
              type: 'warning',
              priority: 'high',
              actionUrl: RoutePaths.Restaurant.Kitchen
            });
          } else if (order?.status === 'ready') {
            addNotification({
              title: 'Order Ready',
              message: `Order #${order?.tracking_number || 'Unknown'} is ready for pickup`,
              type: 'success',
              priority: 'medium',
              actionUrl: RoutePaths.Restaurant.Kitchen
            });
          }
        })
        .subscribe();

      subscriptions.push(ordersChannel);
    }

    return subscriptions;
  };

  const getRoleBasedNotifications = async (role: string): Promise<Notification[]> => {
    const notifications: Notification[] = [];

    try {
      if (role === 'SuperAdmin') {
        // Get system-wide statistics
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        const { count: adminUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'Admin');

        const { data: recentPayments } = await supabase
          .from('payments')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (totalUsers && totalUsers > 0) {
          notifications.push({
            id: `system-users-${Date.now()}`,
            title: 'System Users',
            message: `${totalUsers} total users in the system`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'low'
          });
        }

        if (adminUsers && adminUsers > 0) {
          notifications.push({
            id: `admin-users-${Date.now()}`,
            title: 'Administrators',
            message: `${adminUsers} administrator accounts`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'medium'
          });
        }

        if (recentPayments?.length) {
          notifications.push({
            id: `recent-payments-${Date.now()}`,
            title: 'Recent Payments',
            message: `${recentPayments.length} payment${recentPayments.length > 1 ? 's' : ''} processed in the last 24 hours`,
            type: 'success',
            timestamp: new Date(),
            read: false,
            priority: 'medium'
          });
        }
      }
      else if (role === 'Admin') {
        // Get pending payments
        const { data: pendingPayments } = await supabase
          .from('payments')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        // Get recent bookings
        const { data: recentBookings } = await supabase
          .from('bookings')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        // Get pending orders
        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(3);

        if (pendingPayments?.length) {
          notifications.push({
            id: `pending-payments-${Date.now()}`,
            title: 'Pending Payments',
            message: `${pendingPayments.length} payment${pendingPayments.length > 1 ? 's' : ''} awaiting verification`,
            type: 'warning',
            timestamp: new Date(),
            read: false,
            priority: 'high',
            actionUrl: RoutePaths.Admin.Payments
          });
        }

        if (recentBookings?.length) {
          notifications.push({
            id: `new-bookings-${Date.now()}`,
            title: 'New Bookings',
            message: `${recentBookings.length} new booking${recentBookings.length > 1 ? 's' : ''} received today`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            actionUrl: RoutePaths.Admin.Bookings
          });
        }

        if (pendingOrders?.length) {
          notifications.push({
            id: `pending-orders-${Date.now()}`,
            title: 'Pending Orders',
            message: `${pendingOrders.length} restaurant order${pendingOrders.length > 1 ? 's' : ''} awaiting approval`,
            type: 'warning',
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            actionUrl: RoutePaths.Restaurant.Orders
          });
        }
      } 
      else if (role === 'Receptionist') {
        // Get today's check-ins
        const today = new Date().toISOString().split('T')[0];
        const { data: todayBookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('start_date', today)
          .eq('status', 'booked')
          .order('created_at', { ascending: false });

        // Get pending payments
        const { data: pendingPayments } = await supabase
          .from('payments')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(3);

        if (todayBookings?.length) {
          notifications.push({
            id: `checkins-today-${Date.now()}`,
            title: 'Today\'s Check-ins',
            message: `${todayBookings.length} guest${todayBookings.length > 1 ? 's' : ''} expected to check-in today`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'high',
            actionUrl: RoutePaths.Reception.Guests
          });
        }

        if (pendingPayments?.length) {
          notifications.push({
            id: `payments-pending-${Date.now()}`,
            title: 'Payment Verification',
            message: `${pendingPayments.length} payment${pendingPayments.length > 1 ? 's' : ''} need verification`,
            type: 'warning',
            timestamp: new Date(),
            read: false,
            priority: 'high',
            actionUrl: RoutePaths.Reception.Payments
          });
        }
      } 
      else if (role === 'RestaurantLead') {
        // Get pending orders
        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        // Get recent orders
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(3);

        if (pendingOrders?.length) {
          notifications.push({
            id: `pending-orders-${Date.now()}`,
            title: 'Pending Orders',
            message: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} awaiting kitchen approval`,
            type: 'warning',
            timestamp: new Date(),
            read: false,
            priority: 'high',
            actionUrl: RoutePaths.Restaurant.Orders
          });
        }

        if (recentOrders?.length) {
          notifications.push({
            id: `new-orders-${Date.now()}`,
            title: 'New Orders',
            message: `${recentOrders.length} new order${recentOrders.length > 1 ? 's' : ''} received in the last hour`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            actionUrl: RoutePaths.Restaurant.OrderCreation
          });
        }
      }
      else if (role === 'Kitchen') {
        // Get pending orders for kitchen
        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('*')
          .in('status', ['pending', 'confirmed'])
          .order('created_at', { ascending: true })
          .limit(10);

        // Get preparing orders
        const { data: preparingOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'preparing')
          .order('created_at', { ascending: true })
          .limit(5);

        if (pendingOrders?.length) {
          notifications.push({
            id: `kitchen-pending-${Date.now()}`,
            title: 'Orders Pending',
            message: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} waiting to be prepared`,
            type: 'warning',
            timestamp: new Date(),
            read: false,
            priority: 'high',
            actionUrl: RoutePaths.Restaurant.Kitchen
          });
        }

        if (preparingOrders?.length) {
          notifications.push({
            id: `kitchen-preparing-${Date.now()}`,
            title: 'Orders in Preparation',
            message: `${preparingOrders.length} order${preparingOrders.length > 1 ? 's' : ''} currently being prepared`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            actionUrl: RoutePaths.Restaurant.Kitchen
          });
        }
      }

      // Add a default system status notification if no specific notifications
      if (notifications.length === 0) {
        notifications.push({
          id: `system-status-${Date.now()}`,
          title: 'System Status',
          message: 'All systems are running normally',
          type: 'success',
          timestamp: new Date(),
          read: false,
          priority: 'low'
        });
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
      notifications.push({
        id: `error-${Date.now()}`,
        title: 'System Alert',
        message: 'Unable to load recent activity',
        type: 'error',
        timestamp: new Date(),
        read: false,
        priority: 'high'
      });
    }

    return notifications;
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only latest 50
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationsByPriority = () => {
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      return bPriority - aPriority;
    });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    addNotification,
    getNotificationsByPriority
  };
}
