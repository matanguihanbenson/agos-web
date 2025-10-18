'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Check, CheckCheck, Clock } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faRobot,
  faCog,
  faWrench,
  faBullhorn
} from '@fortawesome/free-solid-svg-icons';
import { 
  firebaseNotificationService, 
  FirebaseNotification 
} from '@/services/firebaseNotificationService';
import { notificationService } from '@/services/notificationService';
import useNotifications from '@/hooks/useNotifications';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: FirebaseNotification) => {
    try {
      // Navigate to notification details page
      router.push(`/admin/notifications/${notification.id}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
      notificationService.error('Failed to process notification');
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      const success = await markAsRead(notificationId);
      if (success) {
        notificationService.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      notificationService.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead();
      if (success) {
        notificationService.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      notificationService.error('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (notification: FirebaseNotification) => {
    switch (notification.notification_type || 'general') {
      case 'emergency_alert':
      case 'emergency_alert_weather':
      case 'emergency_alert_storm':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-red-500" />;
      case 'bot_status':
        return <FontAwesomeIcon icon={faRobot} className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <FontAwesomeIcon icon={faCog} className="h-4 w-4 text-gray-500" />;
      case 'maintenance':
        return <FontAwesomeIcon icon={faWrench} className="h-4 w-4 text-orange-500" />;
      default:
        return <FontAwesomeIcon icon={faBullhorn} className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority?: FirebaseNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded border border-gray-200 shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  router.push('/admin/notifications');
                  setIsOpen(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600 text-sm">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-6 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 20).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-l-4 ${
                      !notification.read ? 'bg-blue-50' : 'bg-white'
                    } ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            {firebaseNotificationService.requiresAction(notification) && (
                              <FontAwesomeIcon icon={faExclamationTriangle} className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {firebaseNotificationService.formatTime(notification.created_at)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              notification.priority === 'urgent' 
                                ? 'bg-red-100 text-red-800' 
                                : notification.priority === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : notification.priority === 'medium'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.priority}
                            </span>
                            
                            {!notification.read && (
                              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <span className="text-xs text-gray-600">
                  Showing {Math.min(notifications.length, 20)} of {notifications.length} notifications
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}