import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Load initial notifications based on user role
    loadNotifications();

    // Set up real-time subscriptions based on user role
    const subscriptions = setupRoleBasedSubscriptions();

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [user]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    if (!user?.role) return;

    // Generate role-specific notifications
    const roleNotifications = await getRoleBasedNotifications(user.role);
    setNotifications(roleNotifications);
  };

  const setupRoleBasedSubscriptions = () => {
    const subscriptions: any[] = [];

    if (user?.role === 'Admin') {
      // Admin gets notifications about all activities
      const bookingsChannel = supabase
        .channel('admin_bookings')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, (payload) => {
          addNotification({
            title: 'New Booking Activity',
            message: `Booking ${payload.eventType === 'INSERT' ? 'created' : 'updated'}`,
            type: 'info'
          });
        })
        .subscribe();

      const paymentsChannel = supabase
        .channel('admin_payments')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'payments' 
        }, (payload) => {
          addNotification({
            title: 'Payment Activity',
            message: `Payment ${payload.eventType === 'INSERT' ? 'received' : 'updated'}`,
            type: 'success'
          });
        })
        .subscribe();

      const usersChannel = supabase
        .channel('admin_users')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'users' 
        }, (payload) => {
          addNotification({
            title: 'New User Registration',
            message: 'A new user has registered',
            type: 'info'
          });
        })
        .subscribe();

      subscriptions.push(bookingsChannel, paymentsChannel, usersChannel);
    } 
    else if (user?.role === 'Receptionist') {
      // Receptionist gets notifications about bookings and payments
      const bookingsChannel = supabase
        .channel('reception_bookings')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, (payload) => {
          addNotification({
            title: 'Booking Update',
            message: `New booking requires attention`,
            type: 'warning'
          });
        })
        .subscribe();

      const paymentsChannel = supabase
        .channel('reception_payments')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments' 
        }, (payload) => {
          addNotification({
            title: 'Payment Received',
            message: 'A new payment has been processed',
            type: 'success'
          });
        })
        .subscribe();

      subscriptions.push(bookingsChannel, paymentsChannel);
    } 
    else if (user?.role === 'RestaurantLead') {
      // Restaurant lead gets notifications about orders and menu
      const ordersChannel = supabase
        .channel('restaurant_orders')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, (payload) => {
          addNotification({
            title: 'Order Update',
            message: `Order ${payload.eventType === 'INSERT' ? 'placed' : 'updated'}`,
            type: 'info'
          });
        })
        .subscribe();

      const menuChannel = supabase
        .channel('restaurant_menu')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        }, (payload) => {
          addNotification({
            title: 'Menu Update',
            message: 'Menu items have been updated',
            type: 'info'
          });
        })
        .subscribe();

      subscriptions.push(ordersChannel, menuChannel);
    }

    return subscriptions;
  };

  const getRoleBasedNotifications = async (role: string): Promise<Notification[]> => {
    const notifications: Notification[] = [];

    try {
      if (role === 'Admin') {
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

        // Get new users
        const { data: newUsers } = await supabase
          .from('users')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(3);

        if (pendingPayments?.length) {
          notifications.push({
            id: `pending-payments-${Date.now()}`,
            title: 'Pending Payments',
            message: `${pendingPayments.length} payment${pendingPayments.length > 1 ? 's' : ''} awaiting verification`,
            type: 'warning',
            timestamp: new Date(),
            read: false
          });
        }

        if (recentBookings?.length) {
          notifications.push({
            id: `new-bookings-${Date.now()}`,
            title: 'New Bookings',
            message: `${recentBookings.length} new booking${recentBookings.length > 1 ? 's' : ''} received today`,
            type: 'info',
            timestamp: new Date(),
            read: false
          });
        }

        if (newUsers?.length) {
          notifications.push({
            id: `new-users-${Date.now()}`,
            title: 'New Registrations',
            message: `${newUsers.length} new user${newUsers.length > 1 ? 's' : ''} registered today`,
            type: 'info',
            timestamp: new Date(),
            read: false
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
            read: false
          });
        }

        if (pendingPayments?.length) {
          notifications.push({
            id: `payments-pending-${Date.now()}`,
            title: 'Payment Verification',
            message: `${pendingPayments.length} payment${pendingPayments.length > 1 ? 's' : ''} need verification`,
            type: 'warning',
            timestamp: new Date(),
            read: false
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
            read: false
          });
        }

        if (recentOrders?.length) {
          notifications.push({
            id: `new-orders-${Date.now()}`,
            title: 'New Orders',
            message: `${recentOrders.length} new order${recentOrders.length > 1 ? 's' : ''} received in the last hour`,
            type: 'info',
            timestamp: new Date(),
            read: false
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
          read: false
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
        read: false
      });
    }

    return notifications;
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
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

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    addNotification
  };
}