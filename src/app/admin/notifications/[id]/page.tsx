'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseNotification } from '@/services/firebaseNotificationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faCalendarAlt, 
  faUser, 
  faBell
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';

export default function NotificationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [notification, setNotification] = useState<FirebaseNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  const notificationId = params.id as string;

  const markAsRead = useCallback(async () => {
    if (!notification || notification.read) return;

    setMarkingAsRead(true);
    try {
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, { read: true });
      
      setNotification((prev: FirebaseNotification | null) => prev ? { ...prev, read: true } : null);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarkingAsRead(false);
    }
  }, [notification]);

  useEffect(() => {
    const fetchNotification = async () => {
      if (!notificationId || !user) return;

      try {
        const notificationRef = doc(db, 'notifications', notificationId);
        const notificationSnap = await getDoc(notificationRef);

        if (notificationSnap.exists()) {
          const data = notificationSnap.data();
          const notification: FirebaseNotification = {
            id: notificationSnap.id,
            title: data.title,
            body: data.body,
            recipient_id: data.recipient_id,
            created_at: data.created_at,
            read: data.read,
            notification_type: data.notification_type || 'general',
            priority: data.priority || 'medium'
          };

          // Check if this notification belongs to the current user
          if (notification.recipient_id === user.uid) {
            setNotification(notification);
            
            // Mark as read if not already read
            if (!notification.read) {
              await markAsRead();
            }
          } else {
            // User doesn't have access to this notification
            router.push('/admin/notifications');
          }
        } else {
          // Notification doesn't exist
          router.push('/admin/notifications');
        }
      } catch (error) {
        console.error('Error fetching notification:', error);
        router.push('/admin/notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [notificationId, user, router, markAsRead]);

  const handleEmergencyReturn = () => {
    router.push('/admin/emergency-return');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency_alert_weather':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'system':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'general':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faBell} className="h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Not Found</h3>
          <p className="text-gray-600 text-sm">The notification you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notifications
        </Button>
      </div>

      {/* Notification Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{notification.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getPriorityColor(notification.priority || 'medium')} variant="outline">
                  {(notification.priority || 'medium').charAt(0).toUpperCase() + (notification.priority || 'medium').slice(1)}
                </Badge>
                <Badge className={getTypeColor(notification.notification_type || 'general')} variant="outline">
                  {(notification.notification_type || 'general').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Badge>
                {!notification.read && (
                  <Badge variant="secondary">Unread</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Message Content */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Message</h4>
            <div className="bg-gray-50 rounded p-3 border">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {notification.body}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-3 w-3" />
              <span>
                {notification.created_at?.toDate 
                  ? format(notification.created_at.toDate(), 'PPP p')
                  : 'Date not available'
                }
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
              <span>Recipient: {notification.recipient_id}</span>
            </div>
          </div>

          {/* Emergency Action Button */}
          {(notification.notification_type || 'general') === 'emergency_alert_weather' && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-red-600" />
                <h4 className="font-medium text-red-900 text-sm">Emergency Weather Alert</h4>
              </div>
              <p className="text-red-700 text-sm mb-3">
                This is an emergency weather alert. Take immediate action to ensure bot safety.
              </p>
              <Button 
                onClick={handleEmergencyReturn}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-3 w-3 mr-2" />
                Emergency Return Bots
              </Button>
            </div>
          )}

          {/* Mark as Read Button */}
          {!notification.read && (
            <div className="mt-3 pt-3 border-t">
              <Button 
                onClick={markAsRead}
                disabled={markingAsRead}
                variant="outline"
                size="sm"
              >
                {markingAsRead ? 'Marking as read...' : 'Mark as Read'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}