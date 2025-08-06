import React from 'react';
import { Bell, X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { usePersistentNotifications } from '@/hooks/usePersistentNotifications';

export const PersistentNotificationPopover = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    getNotificationsByPriority
  } = usePersistentNotifications();

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50';
      case 'warning': return 'bg-yellow-50';
      case 'success': return 'bg-green-50';
      default: return 'bg-blue-50';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.key);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const sortedNotifications = getNotificationsByPriority();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h4 className="font-semibold">Notifications</h4>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {sortedNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="space-y-1">
              {sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative cursor-pointer border-b p-3 hover:bg-muted/50 ${
                    !notification.read ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.key);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(notification.timestamp), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};