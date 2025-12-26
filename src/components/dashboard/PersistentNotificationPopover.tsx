import React from 'react';
import { Bell, X, AlertCircle, CheckCircle, Info, AlertTriangle, CheckCheck, ExternalLink, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { usePersistentNotifications } from '@/hooks/usePersistentNotifications';
import { useNavigate } from 'react-router-dom';

export const PersistentNotificationPopover = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    getNotificationsByPriority
  } = usePersistentNotifications();
  const navigate = useNavigate();

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
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getNotificationIcon = (type: string): LucideIcon => {
    switch (type) {
      case 'error': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const handleNotificationClick = (notification: {
    id: string;
    key: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    timestamp: string | Date;
    read: boolean;
    actionUrl?: string;
  }) => {
    if (!notification.read) {
      markAsRead(notification.key);
    }

    const url = notification.actionUrl;
    if (url) {
      if (/^https?:\/\//i.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        navigate(url);
      }
    }
  };

  const sortedNotifications = getNotificationsByPriority();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-accent/50"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-6 px-2"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {sortedNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sortedNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div key={notification.id}>
                    <div
                      className={`relative p-3 rounded-lg border transition-colors cursor-pointer group ${
                        notification.read 
                          ? 'bg-background hover:bg-accent/50' 
                          : `${getNotificationBg(notification.type)} hover:opacity-80`
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Icon className={`h-4 w-4 flex-shrink-0 ${
                              notification.read ? 'text-muted-foreground' : getNotificationColor(notification.type)
                            }`} />
                            <h4 className={`text-sm font-medium truncate ${
                              notification.read ? 'text-muted-foreground' : getNotificationColor(notification.type)
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                            {notification.priority && (
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(notification.priority)}`} />
                            )}
                          </div>
                          <p className={`text-xs mt-1 ${
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {(() => {
                                try {
                                  return formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });
                                } catch (e) {
                                  return 'just now';
                                }
                              })()}
                            </p>
                            {notification.actionUrl && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.key);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-background/50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {index < sortedNotifications.length - 1 && <Separator className="my-1" />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};