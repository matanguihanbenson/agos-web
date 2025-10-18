'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Check, 
  CheckCheck, 
  Clock, 
  Filter,
  Search,
  X
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faBell,
  faRobot,
  faCog,
  faWrench
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { FirebaseNotification } from '@/services/firebaseNotificationService';
import useNotifications from '@/hooks/useNotifications';
import { notificationService } from '@/services/notificationService';

type FilterType = 'all' | 'unread' | 'urgent' | 'emergency_alert' | 'bot_status' | 'system';

export default function NotificationsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    console.log('All notifications received:', notifications);
    console.log('Number of notifications:', notifications.length);
    
    let filtered = notifications;

    // Apply filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'urgent':
        filtered = filtered.filter(n => (n.priority || 'medium') === 'urgent');
        break;
      case 'emergency_alert':
        filtered = filtered.filter(n => (n.notification_type || 'general').startsWith('emergency_alert'));
        break;
      case 'bot_status':
        filtered = filtered.filter(n => (n.notification_type || 'general') === 'bot_status');
        break;
      case 'system':
        filtered = filtered.filter(n => (n.notification_type || 'general') === 'system');
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log('Filtered notifications:', filtered);
    return filtered;
  }, [notifications, filter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  const handleNotificationClick = async (notification: FirebaseNotification) => {
    try {
      // Navigate to notification details page
      router.push(`/admin/notifications/${notification.id}`);
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
        return <FontAwesomeIcon icon={faBell} className="h-4 w-4 text-blue-500" />;
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
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilterLabel = (filterType: FilterType) => {
    switch (filterType) {
      case 'all': return 'All Notifications';
      case 'unread': return 'Unread';
      case 'urgent': return 'Urgent';
      case 'emergency_alert': return 'Emergency Alerts';
      case 'bot_status': return 'Bot Status';
      case 'system': return 'System';
      default: return 'All Notifications';
    }
  };

    const getFilterCount = (filterType: FilterType) => {
    switch (filterType) {
      case 'all': return notifications.length;
      case 'unread': return notifications.filter(n => !n.read).length;
      case 'urgent': return notifications.filter(n => (n.priority || 'medium') === 'urgent').length;
      case 'emergency_alert': return notifications.filter(n => (n.notification_type || 'general').startsWith('emergency_alert')).length;
      case 'bot_status': return notifications.filter(n => (n.notification_type || 'general') === 'bot_status').length;
      case 'system': return notifications.filter(n => (n.notification_type || 'general') === 'system').length;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-600 font-medium">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faBell} className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">View All Notifications</h1>
                  <p className="text-gray-600 text-sm">Manage your system notifications</p>
                </div>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button 
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read ({unreadCount})
              </Button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border border-gray-200 mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-w-36">
                      <Filter className="h-4 w-4 mr-2" />
                      {getFilterLabel(filter)}
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                        {getFilterCount(filter)}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setFilter('all')}>
                      All Notifications ({getFilterCount('all')})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('unread')}>
                      Unread ({getFilterCount('unread')})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('urgent')}>
                      Urgent ({getFilterCount('urgent')})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('emergency_alert')}>
                      Emergency Alerts ({getFilterCount('emergency_alert')})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('bot_status')}>
                      Bot Status ({getFilterCount('bot_status')})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('system')}>
                      System ({getFilterCount('system')})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {getFilterLabel(filter)} ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faBell} className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600 text-sm">
                  {searchTerm ? 'Try adjusting your search terms.' : 'You\'re all caught up!'}
                </p>
                {/* Debug info */}
                <div className="mt-4 text-xs text-gray-500">
                  <p>Debug info:</p>
                  <p>Total notifications: {notifications.length}</p>
                  <p>Filtered notifications: {filteredNotifications.length}</p>
                  <p>Current filter: {filter}</p>
                  <p>Search term: &quot;{searchTerm}&quot;</p>
                  <p>Loading: {loading.toString()}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-l-4 ${
                      !notification.read ? 'bg-blue-50' : 'bg-white'
                    } ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-2 leading-relaxed text-sm">
                          {notification.body}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(notification.created_at)}</span>
                            </div>
                            <span className="capitalize">
                              {(notification.notification_type || 'general').replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              (notification.priority || 'medium') === 'urgent' 
                                ? 'bg-red-100 text-red-800' 
                                : (notification.priority || 'medium') === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : (notification.priority || 'medium') === 'medium'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.priority || 'medium'}
                            </span>
                            
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}