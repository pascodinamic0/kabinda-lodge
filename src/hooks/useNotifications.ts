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
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
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
    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    if (user?.role === 'SuperAdmin') {
      // SuperAdmin gets notifications about all system activities
      const systemChannel = supabase
        .channel('superadmin_system')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        }, (payload) => {
          addNotification({
            title: 'User Management',
            message: `User ${payload.eventType === 'INSERT' ? 'registered' : 'updated'}`,
            type: 'info',
            priority: 'medium'
          });
        })
        .subscribe();

      const adminChannel = supabase
        .channel('superadmin_admins')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'users' 
        }, (payload) => {
          if (payload.new?.role === 'Admin') {
            addNotification({
              title: 'New Admin User',
              message: 'A new administrator has been added to the system',
              type: 'warning',
              priority: 'high'
            });
          }
        })
        .subscribe();

      const paymentsChannel = supabase
        .channel('superadmin_payments')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'payments' 
        }, (payload) => {
          addNotification({
            title: 'Payment Activity',
            message: `Payment ${payload.eventType === 'INSERT' ? 'processed' : 'updated'}`,
            type: 'success',
            priority: 'medium'
          });
        })
        .subscribe();

      subscriptions.push(systemChannel, adminChannel, paymentsChannel);
    }
    else if (user?.role === 'Admin') {
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
            type: 'info',
            priority: 'medium'
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
            type: 'success',
            priority: 'medium'
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
            type: 'info',
            priority: 'low'
          });
        })
        .subscribe();

      const ordersChannel = supabase
        .channel('admin_orders')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, (payload) => {
          addNotification({
            title: 'Restaurant Order',
            message: `Order ${payload.eventType === 'INSERT' ? 'placed' : 'updated'}`,
            type: 'info',
            priority: 'low'
          });
        })
        .subscribe();

      subscriptions.push(bookingsChannel, paymentsChannel, usersChannel, ordersChannel);
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
            type: 'warning',
            priority: 'high',
            actionUrl: '/kabinda-lodge/reception/guest-management'
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
            type: 'success',
            priority: 'medium',
            actionUrl: '/kabinda-lodge/reception/payment-verification'
          });
        })
        .subscribe();

      const guestsChannel = supabase
        .channel('reception_guests')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'users' 
        }, (payload) => {
          if (payload.new?.role === 'Guest') {
            addNotification({
              title: 'New Guest Registration',
              message: 'A new guest has registered',
              type: 'info',
              priority: 'medium',
              actionUrl: '/kabinda-lodge/reception/guest-management'
            });
          }
        })
        .subscribe();

      subscriptions.push(bookingsChannel, paymentsChannel, guestsChannel);
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
            type: 'info',
            priority: 'high',
            actionUrl: '/kabinda-lodge/restaurant/order-approval'
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
            type: 'info',
            priority: 'medium',
            actionUrl: '/kabinda-lodge/admin/menu-management'
          });
        })
        .subscribe();

      const tablesChannel = supabase
        .channel('restaurant_tables')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'restaurant_tables' 
        }, (payload) => {
          addNotification({
            title: 'Table Status',
            message: 'Table status has been updated',
            type: 'info',
            priority: 'low',
            actionUrl: '/kabinda-lodge/restaurant/table-management'
          });
        })
        .subscribe();

      subscriptions.push(ordersChannel, menuChannel, tablesChannel);
    }
    else if (user?.role === 'Kitchen') {
      // Kitchen staff gets notifications about orders
      const ordersChannel = supabase
        .channel('kitchen_orders')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, (payload) => {
          const status = payload.new?.status;
          if (status === 'pending' || status === 'confirmed') {
            addNotification({
              title: 'New Order',
              message: `Order #${payload.new?.tracking_number} requires preparation`,
              type: 'warning',
              priority: 'high',
              actionUrl: '/kabinda-lodge/restaurant/kitchen'
            });
          } else if (status === 'ready') {
            addNotification({
              title: 'Order Ready',
              message: `Order #${payload.new?.tracking_number} is ready for pickup`,
              type: 'success',
              priority: 'medium',
              actionUrl: '/kabinda-lodge/restaurant/kitchen'
            });
          }
        })
        .subscribe();

      const menuChannel = supabase
        .channel('kitchen_menu')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        }, (payload) => {
          addNotification({
            title: 'Menu Update',
            message: 'Menu items have been updated',
            type: 'info',
            priority: 'low',
            actionUrl: '/kabinda-lodge/admin/menu-management'
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
      if (role === 'SuperAdmin') {
        // Get system-wide statistics
        const { data: totalUsers } = await supabase
          .from('users')
          .select('id', { count: 'exact' });

        const { data: adminUsers } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .eq('role', 'Admin');

        const { data: recentPayments } = await supabase
          .from('payments')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (totalUsers && totalUsers.length > 0) {
          notifications.push({
            id: `system-users-${Date.now()}`,
            title: 'System Users',
            message: `${totalUsers.length} total users in the system`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'low'
          });
        }

        if (adminUsers && adminUsers.length > 0) {
          notifications.push({
            id: `admin-users-${Date.now()}`,
            title: 'Administrators',
            message: `${adminUsers.length} administrator accounts`,
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

        // Get new users
        const { data: newUsers } = await supabase
          .from('users')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(3);

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
            actionUrl: '/kabinda-lodge/admin/payment-management'
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
            actionUrl: '/kabinda-lodge/admin/booking-overview'
          });
        }

        if (newUsers?.length) {
          notifications.push({
            id: `new-users-${Date.now()}`,
            title: 'New Registrations',
            message: `${newUsers.length} new user${newUsers.length > 1 ? 's' : ''} registered today`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'low',
            actionUrl: '/kabinda-lodge/admin/user-management'
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
            actionUrl: '/kabinda-lodge/restaurant/order-approval'
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

        // Get recent guest registrations
        const { data: recentGuests } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'Guest')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
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
            actionUrl: '/kabinda-lodge/reception/guest-management'
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
            actionUrl: '/kabinda-lodge/reception/payment-verification'
          });
        }

        if (recentGuests?.length) {
          notifications.push({
            id: `new-guests-${Date.now()}`,
            title: 'New Guest Registrations',
            message: `${recentGuests.length} new guest${recentGuests.length > 1 ? 's' : ''} registered today`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            actionUrl: '/kabinda-lodge/reception/guest-management'
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

        // Get table status updates
        const { data: tableUpdates } = await supabase
          .from('restaurant_tables')
          .select('*')
          .gte('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false })
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
            actionUrl: '/kabinda-lodge/restaurant/order-approval'
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
            actionUrl: '/kabinda-lodge/restaurant/order-creation'
          });
        }

        if (tableUpdates?.length) {
          notifications.push({
            id: `table-updates-${Date.now()}`,
            title: 'Table Status Updates',
            message: `${tableUpdates.length} table status change${tableUpdates.length > 1 ? 's' : ''} in the last 30 minutes`,
            type: 'info',
            timestamp: new Date(),
            read: false,
            priority: 'low',
            actionUrl: '/kabinda-lodge/restaurant/table-management'
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

        // Get ready orders
        const { data: readyOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'ready')
          .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false })
          .limit(3);

        if (pendingOrders?.length) {
          notifications.push({
            id: `kitchen-pending-${Date.now()}`,
            title: 'Orders Pending',
            message: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} waiting to be prepared`,
            type: 'warning',
            timestamp: new Date(),
            read: false,
            priority: 'high',
            actionUrl: '/kabinda-lodge/restaurant/kitchen'
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
            actionUrl: '/kabinda-lodge/restaurant/kitchen'
          });
        }

        if (readyOrders?.length) {
          notifications.push({
            id: `kitchen-ready-${Date.now()}`,
            title: 'Orders Ready',
            message: `${readyOrders.length} order${readyOrders.length > 1 ? 's' : ''} ready for pickup`,
            type: 'success',
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            actionUrl: '/kabinda-lodge/restaurant/kitchen'
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
