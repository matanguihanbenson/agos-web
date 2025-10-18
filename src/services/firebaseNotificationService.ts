'use client';

import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FirebaseNotification {
  id: string;
  title: string;
  body: string; // Changed from 'message' to match your DB
  notification_type?: 'general' | 'emergency_alert' | 'emergency_alert_weather' | 'emergency_alert_storm' | 'system' | 'bot_status' | 'maintenance';
  recipient_id: string;
  sender_id?: string;
  read: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  created_at: Timestamp;
  read_at?: Timestamp;
  metadata?: {
    bot_ids?: string[];
    location?: string;
    action_required?: boolean;
    weather_type?: 'storm' | 'flood' | 'extreme_heat' | 'severe_wind';
    alert_level?: 1 | 2 | 3 | 4 | 5;
    [key: string]: unknown;
  };
}

export type NotificationCallback = (notifications: FirebaseNotification[]) => void;
export type ErrorCallback = (error: Error) => void;

class FirebaseNotificationService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();
  
  /**
   * Subscribe to real-time notifications for a specific user
   */
  subscribeToUserNotifications(
    userId: string, 
    callback: NotificationCallback,
    errorCallback?: ErrorCallback
  ): () => void {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipient_id', '==', userId)
        // Temporarily remove orderBy to avoid index requirement
        // orderBy('created_at', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          console.log('Firebase notifications snapshot received:', snapshot.size, 'notifications');
          const notifications: FirebaseNotification[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Raw notification data from Firestore:', {
              id: doc.id,
              data: data,
              hasBody: !!data.body,
              hasMessage: !!data.message,
              hasTitle: !!data.title,
              hasRecipientId: !!data.recipient_id,
              hasCreatedAt: !!data.created_at
            });
            
            // Map the data to match our interface, handling missing fields
            const notification: FirebaseNotification = {
              id: doc.id,
              title: data.title || 'Untitled Notification',
              body: data.body || data.message || 'No content', // Handle both 'body' and 'message' fields
              notification_type: data.notification_type || 'general',
              recipient_id: data.recipient_id,
              sender_id: data.sender_id,
              read: data.read || false,
              priority: data.priority || 'medium',
              created_at: data.created_at,
              read_at: data.read_at,
              metadata: data.metadata
            };
            
            console.log('Mapped notification object:', notification);
            notifications.push(notification);
          });
          
          console.log('Processed notifications:', notifications.length);
          
          // Sort notifications by created_at in descending order since we removed orderBy
          notifications.sort((a, b) => {
            const aTime = a.created_at?.toDate?.()?.getTime() || 0;
            const bTime = b.created_at?.toDate?.()?.getTime() || 0;
            return bTime - aTime; // Descending order (newest first)
          });
          
          callback(notifications);
        },
        (error) => {
          console.error('Error listening to notifications:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );

      // Store the unsubscribe function
      this.unsubscribeCallbacks.set(userId, unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return () => {};
    }
  }

  /**
   * Subscribe to unread notifications count for a specific user
   */
  subscribeToUnreadCount(
    userId: string, 
    callback: (count: number) => void,
    errorCallback?: ErrorCallback
  ): () => void {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipient_id', '==', userId),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          callback(snapshot.size);
        },
        (error) => {
          console.error('Error listening to unread notifications count:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up unread count subscription:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return () => {};
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        read_at: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      const promises = notificationIds.map(id => this.markAsRead(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipient_id', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await new Promise<QuerySnapshot<DocumentData>>((resolve, reject) => {
        const unsubscribe = onSnapshot(q, resolve, reject);
        // Clean up the listener after getting the snapshot
        setTimeout(() => unsubscribe(), 100);
      });

      const promises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          read: true,
          read_at: Timestamp.now()
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from notifications for a specific user
   */
  unsubscribeFromUser(userId: string): void {
    const unsubscribe = this.unsubscribeCallbacks.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeCallbacks.delete(userId);
    }
  }

  /**
   * Unsubscribe from all notification listeners
   */
  unsubscribeAll(): void {
    this.unsubscribeCallbacks.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeCallbacks.clear();
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type?: FirebaseNotification['notification_type']): string {
    switch (type) {
      case 'emergency_alert':
      case 'emergency_alert_weather':
      case 'emergency_alert_storm':
        return '🚨';
      case 'bot_status':
        return '🤖';
      case 'system':
        return '⚙️';
      case 'maintenance':
        return '🔧';
      default:
        return '📢';
    }
  }

  /**
   * Get notification color based on priority
   */
  getNotificationColor(priority?: FirebaseNotification['priority']): string {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'medium':
        return 'bg-blue-100 border-blue-500 text-blue-900';
      case 'low':
        return 'bg-gray-100 border-gray-500 text-gray-900';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  }

  /**
   * Check if notification requires immediate action
   */
  requiresAction(notification: FirebaseNotification): boolean {
    return (
      notification.priority === 'urgent' ||
      (notification.notification_type && notification.notification_type.startsWith('emergency_alert')) ||
      notification.metadata?.action_required === true
    );
  }

  /**
   * Format notification time
   */
  formatTime(timestamp: Timestamp): string {
    try {
      const now = new Date();
      const notificationTime = timestamp.toDate();
      const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

      console.log('formatTime debug:', {
        now: now.toISOString(),
        notificationTime: notificationTime.toISOString(),
        diffInMinutes
      });

      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInMinutes < 1440) { // 24 hours
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h ago`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `${days}d ago`;
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Unknown time';
    }
  }
}

export const firebaseNotificationService = new FirebaseNotificationService();