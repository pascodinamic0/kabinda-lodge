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
    const now = new Date();
    const baseNotifications: Notification[] = [];

    if (role === 'Admin') {
      baseNotifications.push(
        {
          id: '1',
          title: 'System Status',
          message: 'All systems are running normally',
          type: 'success',
          timestamp: new Date(now.getTime() - 5 * 60000),
          read: false
        },
        {
          id: '2',
          title: 'Monthly Report',
          message: 'Monthly analytics report is ready for review',
          type: 'info',
          timestamp: new Date(now.getTime() - 30 * 60000),
          read: false
        }
      );
    } else if (role === 'Receptionist') {
      baseNotifications.push(
        {
          id: '3',
          title: 'Check-in Reminder',
          message: '3 guests expected to check-in today',
          type: 'warning',
          timestamp: new Date(now.getTime() - 10 * 60000),
          read: false
        },
        {
          id: '4',
          title: 'Room Cleaning',
          message: 'Room 205 cleaning completed',
          type: 'success',
          timestamp: new Date(now.getTime() - 45 * 60000),
          read: true
        }
      );
    } else if (role === 'RestaurantLead') {
      baseNotifications.push(
        {
          id: '5',
          title: 'Order Ready',
          message: 'Order #1234 is ready for delivery',
          type: 'success',
          timestamp: new Date(now.getTime() - 2 * 60000),
          read: false
        },
        {
          id: '6',
          title: 'Inventory Alert',
          message: 'Low stock on featured menu items',
          type: 'warning',
          timestamp: new Date(now.getTime() - 20 * 60000),
          read: false
        }
      );
    }

    return baseNotifications;
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