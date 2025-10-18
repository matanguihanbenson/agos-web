'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Clock, ChevronDown } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faRobot,
  faCog,
  faWrench,
  faBullhorn
} from '@fortawesome/free-solid-svg-icons';
import { FirebaseNotification } from '@/services/firebaseNotificationService';
import useNotifications from '@/hooks/useNotifications';

export default function FloatingNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { unreadNotifications, unreadCount } = useNotifications();

  // Only show on non-dashboard pages
  const isDashboard = pathname === '/admin/dashboard';

  useEffect(() => {
    if (!isDashboard && unreadCount > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
    }
  }, [isDashboard, unreadCount]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const handleNotificationClick = async (notification: FirebaseNotification) => {
    try {
      // Navigate to notification details page
      router.push(`/admin/notifications/${notification.id}`);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getNotificationIcon = (notification: FirebaseNotification) => {
    switch (notification.notification_type || 'general') {
      case 'emergency_alert':
      case 'emergency_alert_weather':
      case 'emergency_alert_storm':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case 'bot_status':
        return <FontAwesomeIcon icon={faRobot} className="h-4 w-4 text-blue-500 flex-shrink-0" />;
      case 'system':
        return <FontAwesomeIcon icon={faCog} className="h-4 w-4 text-gray-500 flex-shrink-0" />;
      case 'maintenance':
        return <FontAwesomeIcon icon={faWrench} className="h-4 w-4 text-orange-500 flex-shrink-0" />;
      default:
        return <FontAwesomeIcon icon={faBullhorn} className="h-4 w-4 text-blue-500 flex-shrink-0" />;
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

  const formatTime = (timestamp: { toDate: () => Date }) => {
    const now = new Date();
    const notificationTime = timestamp.toDate();
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

  if (!isVisible) return null;

  const displayedNotifications = unreadNotifications.slice(0, 3);
  const hasMore = unreadNotifications.length > 3;

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out"
    >
      {/* Collapsed State - Floating Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <Bell className="h-6 w-6" />
          <span className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
            {unreadCount} unread notifications
          </div>
        </button>
      )}

      {/* Expanded State - Notification List */}
      {isExpanded && (
        <div className="bg-white rounded border border-gray-200 shadow-lg w-80 max-h-80 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-56 overflow-y-auto">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-l-4 ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {notification.body}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        notification.priority === 'urgent' 
                          ? 'bg-red-100 text-red-800' 
                          : notification.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {hasMore && (
                <span className="text-xs text-gray-600">
                  +{unreadNotifications.length - 3} more notifications
                </span>
              )}
              <button
                onClick={() => {
                  router.push('/admin/notifications');
                  setIsExpanded(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}