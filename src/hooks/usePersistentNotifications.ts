import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { RoutePaths } from '@/routes/paths';

export interface PersistentNotification {
  id: string;
  key: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  dismissedUntil?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export const usePersistentNotifications = () => {
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState<PersistentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    notificationFrequency: 'immediate'
  });
  const [loading, setLoading] = useState(true);

  // Generate stable notification key
  const generateNotificationKey = useCallback((
    type: string,
    relatedId?: string,
    userSpecific: boolean = false
  ): string => {
    if (userSpecific && relatedId) {
      return `${type}_${relatedId}_${user?.id}`;
    } else if (relatedId) {
      return `${type}_${relatedId}`;
    } else {
      return type;
    }
  }, [user?.id]);

  // Load user notification settings
  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notification settings:', error);
        return;
      }

      if (data) {
        setSettings({
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          notificationFrequency: data.notification_frequency as 'immediate' | 'hourly' | 'daily',
          quietHoursStart: data.quiet_hours_start,
          quietHoursEnd: data.quiet_hours_end
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, [user?.id]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!user?.id) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          email_notifications: updatedSettings.emailNotifications,
          push_notifications: updatedSettings.pushNotifications,
          notification_frequency: updatedSettings.notificationFrequency,
          quiet_hours_start: updatedSettings.quietHoursStart,
          quiet_hours_end: updatedSettings.quietHoursEnd
        });

      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved"
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      });
    }
  }, [user?.id, settings]);

  // Check if notification is dismissed
  const checkNotificationStatus = useCallback(async (key: string) => {
    if (!user?.id) return { read: false, dismissed: false };

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('is_read, is_dismissed, dismissed_until')
        .eq('user_id', user.id)
        .eq('notification_key', key)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking notification status:', error);
        return { read: false, dismissed: false };
      }

      if (!data) return { read: false, dismissed: false };

      // Check if dismissal has expired
      const dismissedUntil = data.dismissed_until ? new Date(data.dismissed_until) : null;
      const isDismissed = data.is_dismissed && (!dismissedUntil || dismissedUntil > new Date());

      return {
        read: data.is_read,
        dismissed: isDismissed
      };
    } catch (error) {
      console.error('Error checking notification status:', error);
      return { read: false, dismissed: false };
    }
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (key: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_notifications')
        .upsert({
          user_id: user.id,
          notification_key: key,
          notification_type: key.split('_')[0],
          is_read: true
        });

      setNotifications(prev => 
        prev.map(notif => 
          notif.key === key ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?.id]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id || notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await supabase
          .from('user_notifications')
          .upsert({
            user_id: user.id,
            notification_key: notification.key,
            notification_type: notification.type,
            is_read: true
          });
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );

      toast({
        title: "All notifications marked as read",
        description: `Marked ${unreadNotifications.length} notifications as read`
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  }, [user?.id, notifications]);

  // Dismiss notification
  const dismissNotification = useCallback(async (key: string, dismissUntil?: Date) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_notifications')
        .upsert({
          user_id: user.id,
          notification_key: key,
          notification_type: key.split('_')[0],
          is_dismissed: true,
          dismissed_until: dismissUntil?.toISOString()
        });

      setNotifications(prev => 
        prev.filter(notif => notif.key !== key)
      );
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, [user?.id]);

  // Add new notification with persistence check
  const addNotification = useCallback(async (
    notification: Omit<PersistentNotification, 'id' | 'timestamp' | 'read' | 'dismissed' | 'key'> & {
      key?: string;
      relatedId?: string;
      userSpecific?: boolean;
    }
  ) => {
    if (!user?.id) return;

    const notificationKey = notification.key || generateNotificationKey(
      notification.type,
      notification.relatedId,
      notification.userSpecific
    );

    // Check if notification should be shown
    const status = await checkNotificationStatus(notificationKey);
    if (status.dismissed || status.read) return;

    const newNotification: PersistentNotification = {
      id: `${Date.now()}-${Math.random()}`,
      key: notificationKey,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      timestamp: new Date().toISOString(),
      read: status.read,
      dismissed: false,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata
    };

    setNotifications(prev => {
      // Remove existing notification with same key and add new one
      const filtered = prev.filter(n => n.key !== notificationKey);
      const updated = [newNotification, ...filtered].slice(0, 50); // Keep latest 50
      return updated;
    });
  }, [user?.id, generateNotificationKey, checkNotificationStatus]);

  // Generate role-based notifications
  const generateRoleBasedNotifications = useCallback(async () => {
    if (!user?.id || !userRole) return;

    const notifications: Array<Omit<PersistentNotification, 'id' | 'timestamp' | 'read' | 'dismissed' | 'key'> & {
      key?: string;
      relatedId?: string;
      userSpecific?: boolean;
    }> = [];

    try {
      // Role-specific notification generation logic
      switch (userRole) {
        case 'SuperAdmin':
        case 'Admin': {
          // Check for pending payments
          const { data: pendingPayments } = await supabase
            .from('payments')
            .select('id, booking_id, amount')
            .eq('status', 'pending')
            .limit(5);

          if (pendingPayments && pendingPayments.length > 0) {
            notifications.push({
              type: 'warning',
              title: 'Pending Payments',
              message: `${pendingPayments.length} payment${pendingPayments.length > 1 ? 's' : ''} require verification`,
              priority: 'high',
              actionUrl: RoutePaths.Admin.Payments,
              relatedId: 'pending_payments'
            });
          }

          // Check for new users requiring approval
          const { data: newUsers } = await supabase
            .from('users')
            .select('id, name, email, created_at')
            .eq('role', 'Guest')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(5);

          if (newUsers && newUsers.length > 0) {
            notifications.push({
              type: 'info',
              title: 'New User Registrations',
              message: `${newUsers.length} new user${newUsers.length > 1 ? 's' : ''} registered in the last 24 hours`,
              priority: 'medium',
              actionUrl: RoutePaths.Admin.Users,
              relatedId: 'new_users_24h'
            });
          }

          // Check for reported maintenance requests
          const { data: reportedMaintenance } = await supabase
            .from('maintenance_requests')
            .select('id, room_number, issue_type, priority')
            .eq('status', 'reported')
            .order('created_at', { ascending: false })
            .limit(5);

          if (reportedMaintenance && reportedMaintenance.length > 0) {
            const urgentCount = reportedMaintenance.filter(m => m.priority === 'urgent' || m.priority === 'high').length;
            notifications.push({
              type: urgentCount > 0 ? 'warning' : 'info',
              title: 'New Maintenance Requests',
              message: `${reportedMaintenance.length} maintenance request${reportedMaintenance.length > 1 ? 's' : ''} reported${urgentCount > 0 ? ` (${urgentCount} urgent/high priority)` : ''}`,
              priority: urgentCount > 0 ? 'high' : 'medium',
              actionUrl: RoutePaths.Admin.Maintenance,
              relatedId: 'reported_maintenance_requests'
            });
          }
          break;
        }

        case 'Receptionist': {
          // Check for service requests
          const { data: serviceRequests } = await supabase
            .from('guest_service_requests')
            .select('id, request_type, status')
            .eq('status', 'pending')
            .limit(5);

          if (serviceRequests && serviceRequests.length > 0) {
            notifications.push({
              type: 'warning',
              title: 'Pending Service Requests',
              message: `${serviceRequests.length} guest service request${serviceRequests.length > 1 ? 's' : ''} need attention`,
              priority: 'high',
              actionUrl: RoutePaths.Reception.Services,
              relatedId: 'pending_service_requests'
            });
          }

          // Check for check-ins today
          const today = new Date().toISOString().split('T')[0];
          const { data: todayCheckIns } = await supabase
            .from('bookings')
            .select('id, user_id, room_id')
            .eq('start_date', today)
            .eq('status', 'booked')
            .limit(5);

          if (todayCheckIns && todayCheckIns.length > 0) {
            notifications.push({
              type: 'info',
              title: 'Today\'s Check-ins',
              message: `${todayCheckIns.length} guest${todayCheckIns.length > 1 ? 's' : ''} checking in today`,
              priority: 'medium',
              actionUrl: RoutePaths.Reception.Rooms,
              relatedId: `checkins_${today}`
            });
          }
          break;
        }

        case 'RestaurantLead': {
          // Check for pending orders
          const { data: pendingOrders } = await supabase
            .from('orders')
            .select('id, status, created_at')
            .eq('status', 'pending')
            .limit(5);

          if (pendingOrders && pendingOrders.length > 0) {
            notifications.push({
              type: 'warning',
              title: 'Pending Orders',
              message: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} awaiting approval`,
              priority: 'high',
              actionUrl: RoutePaths.Restaurant.Orders,
              relatedId: 'pending_orders'
            });
          }
          break;
        }

        case 'Kitchen': {
          // Check for orders to prepare
          const { data: preparingOrders } = await supabase
            .from('orders')
            .select('id, status, estimated_completion_time')
            .eq('status', 'preparing')
            .limit(5);

          if (preparingOrders && preparingOrders.length > 0) {
            notifications.push({
              type: 'info',
              title: 'Orders in Preparation',
              message: `${preparingOrders.length} order${preparingOrders.length > 1 ? 's' : ''} currently being prepared`,
              priority: 'medium',
              actionUrl: RoutePaths.Restaurant.Kitchen,
              relatedId: 'preparing_orders'
            });
          }
          break;
        }

        case 'Guest': {
          // Check for booking confirmations needed
          const { data: userBookings } = await supabase
            .from('bookings')
            .select('id, status, start_date')
            .eq('user_id', user.id)
            .eq('status', 'pending_payment')
            .limit(3);

          if (userBookings && userBookings.length > 0) {
            notifications.push({
              type: 'warning',
              title: 'Payment Required',
              message: `You have ${userBookings.length} booking${userBookings.length > 1 ? 's' : ''} awaiting payment`,
              priority: 'high',
              actionUrl: RoutePaths.Guest.MyBookings,
              relatedId: 'pending_payment_bookings',
              userSpecific: true
            });
          }
          break;
        }
      }

      // Add all generated notifications
      for (const notification of notifications) {
        await addNotification(notification);
      }

    } catch (error) {
      console.error('Error generating role-based notifications:', error);
    }
  }, [user?.id, userRole, addNotification]);

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Load settings and generate notifications on mount
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const initialize = async () => {
      setLoading(true);
      await loadSettings();
      await generateRoleBasedNotifications();
      setLoading(false);
    };

    initialize();
  }, [user?.id, userRole, loadSettings, generateRoleBasedNotifications]);

  // Setup real-time subscriptions for new data changes
  useEffect(() => {
    if (!user?.id || !userRole) return;

    const channels: any[] = [];

    // Subscribe to relevant table changes based on role
    const tables = ['payments', 'bookings', 'guest_service_requests', 'orders'];
    
    tables.forEach(table => {
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table },
          async () => {
            // Regenerate notifications when data changes
            await generateRoleBasedNotifications();
          }
        )
        .subscribe();
      
      channels.push(channel);
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user?.id, userRole, generateRoleBasedNotifications]);

  const getNotificationsByPriority = useCallback(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...notifications].sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    settings,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    updateSettings,
    getNotificationsByPriority,
    generateRoleBasedNotifications
  };
};