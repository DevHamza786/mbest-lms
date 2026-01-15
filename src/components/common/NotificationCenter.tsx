import { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, Info, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { commonApi, Notification as ApiNotification } from '@/lib/api/common';
import { useToast } from '@/hooks/use-toast';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string | number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  timestamp: string;
  read: boolean;
}

export function NotificationCenter() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { unreadCount, setUnreadCount } = useUnreadNotificationsCount();

  // Load notifications when component mounts or sheet opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Poll for updates when sheet is open
  useEffect(() => {
    if (!isOpen) return;

    const pollInterval = setInterval(() => {
      loadNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const apiNotifications = await commonApi.notifications.list({
        per_page: 50, // Load more notifications
      });

      // Ensure we have an array
      const notificationsArray = Array.isArray(apiNotifications) ? apiNotifications : [];

      // Map API notifications to component format
      const mappedNotifications: Notification[] = notificationsArray.map((notif: ApiNotification) => {
        // Determine notification type from API type or title
        let type: 'info' | 'warning' | 'success' | 'urgent' = 'info';
        const typeLower = (notif.type || '').toLowerCase();
        const titleLower = (notif.title || '').toLowerCase();
        
        if (typeLower.includes('urgent') || typeLower.includes('error') || titleLower.includes('urgent')) {
          type = 'urgent';
        } else if (typeLower.includes('warning') || typeLower.includes('due') || titleLower.includes('due')) {
          type = 'warning';
        } else if (typeLower.includes('success') || typeLower.includes('grade') || titleLower.includes('graded')) {
          type = 'success';
        }

        return {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: type,
          timestamp: notif.created_at,
          read: notif.is_read,
        };
      });

      setNotifications(mappedNotifications);
      
      // Update unread count from actual notifications
      const actualUnreadCount = mappedNotifications.filter(n => !n.read).length;
      if (setUnreadCount) {
        setUnreadCount(actualUnreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string | number) => {
    try {
      const notification = notifications.find(n => n.id === id);
      if (notification?.read) return; // Already read

      await commonApi.notifications.markAsRead(Number(id));
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      
      // Update unread count immediately
      if (setUnreadCount) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read.',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return; // Nothing to mark

      await commonApi.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Update unread count immediately
      if (setUnreadCount) {
        setUnreadCount(0);
      }
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read.',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
        variant: 'destructive',
      });
    }
  };

  const removeNotification = async (id: string | number) => {
    try {
      const notification = notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.read;

      await commonApi.notifications.delete(Number(id));
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Update unread count if deleted notification was unread
      if (wasUnread && setUnreadCount) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification.',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="default" 
              className="absolute -right-1 -top-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white border-blue-600"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="bg-blue-500 hover:bg-blue-600 text-white border-blue-600"
                  >
                    {unreadCount} unread
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="ml-4">
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                  <p className="text-muted-foreground">Loading notifications...</p>
                </CardContent>
              </Card>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-colors ${
                    !notification.read ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <CardTitle className="text-sm font-medium">
                          {notification.title}
                        </CardTitle>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}