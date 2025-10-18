'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  firebaseNotificationService, 
  FirebaseNotification 
} from '@/services/firebaseNotificationService';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<FirebaseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to notifications
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribeNotifications = firebaseNotificationService.subscribeToUserNotifications(
      user.uid,
      (notifications) => {
        console.log('useNotifications: Received notifications from service:', notifications);
        console.log('useNotifications: Number of notifications:', notifications.length);
        setNotifications(notifications);
        setLoading(false);
      },
      (error) => {
        console.error('Notification subscription error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    const unsubscribeUnreadCount = firebaseNotificationService.subscribeToUnreadCount(
      user.uid,
      (count) => {
        setUnreadCount(count);
      },
      (error) => {
        console.error('Unread count subscription error:', error);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.uid]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await firebaseNotificationService.markAsRead(notificationId);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return false;
    
    try {
      await firebaseNotificationService.markAllAsRead(user.uid);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [user?.uid]);

  // Get unread notifications
  const unreadNotifications = notifications.filter(n => !n.read);

  // Get urgent notifications
  const urgentNotifications = notifications.filter(n => 
    (n.priority || 'medium') === 'urgent' || 
    (n.notification_type || 'general').startsWith('emergency_alert')
  );

  // Get notifications by type
  const getNotificationsByType = useCallback((type: FirebaseNotification['notification_type']) => {
    return notifications.filter(n => (n.notification_type || 'general') === type);
  }, [notifications]);

  // Get recent notifications (last 24 hours)
  const recentNotifications = notifications.filter(n => {
    const notificationTime = n.created_at.toDate();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return notificationTime > twentyFourHoursAgo;
  });

  return {
    notifications,
    unreadNotifications,
    urgentNotifications,
    recentNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    getNotificationsByType,
  };
}

export default useNotifications;