import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  _id: string;
  type: 'exercise_completed' | 'message_received';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata: {
    exerciseId?: string;
    exerciseTitle?: string;
    chatId?: string;
    messageId?: string;
    studentName?: string;
    courseTitle?: string;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  courseId: {
    _id: string;
    title: string;
  };
}

interface NotificationsTabProps {
  onOpenChatWithStudent?: (studentId: string) => void;
  onShowModulesView: () => void;
  onNavigateToExercise?: (exerciseId: string, studentId: string) => void;
  onUnreadNotificationsChange?: (count: number) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  onOpenChatWithStudent,
  onShowModulesView,
  onNavigateToExercise,
  onUnreadNotificationsChange
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const loadNotifications = async (page: number = 1, append: boolean = false) => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/notifications?page=${page}&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        
        setHasMoreNotifications(newNotifications.length === 5);
        setNotificationsPage(page);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/notifications/unread/count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const loadMoreNotifications = () => {
    if (!loadingNotifications && hasMoreNotifications) {
      loadNotifications(notificationsPage + 1, true);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }

    if (notification.type === 'message_received') {
      onOpenChatWithStudent?.(notification.studentId._id);
    } else if (notification.type === 'exercise_completed' && notification.metadata.exerciseId) {
      onNavigateToExercise?.(notification.metadata.exerciseId, notification.studentId._id);
    }
  };

  useEffect(() => {
    loadNotifications(1, false);
    loadUnreadNotifications();
    
    const interval = setInterval(() => {
      loadUnreadNotifications();
      if (notifications.length === 0) {
        loadNotifications(1, false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Notify parent component when unread notifications count changes
  useEffect(() => {
    if (onUnreadNotificationsChange) {
      onUnreadNotificationsChange(unreadNotifications);
    }
  }, [unreadNotifications, onUnreadNotificationsChange]);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-blue-900">Recent Notifications</h4>
          </div>
          {unreadNotifications > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full w-fit">
              {unreadNotifications} unread
            </span>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <p className="text-blue-700">No notifications at this time.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  !notification.isRead 
                    ? 'bg-white border-blue-300 shadow-sm' 
                    : 'bg-gray-50 border-gray-200'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${
                        notification.type === 'exercise_completed' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {notification.type === 'exercise_completed' ? '✓' : '💬'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1 break-words">
                      {notification.message}
                    </p>
                    <div className="text-xs text-gray-500 break-words">
                      {notification.courseId.title} • {notification.studentId.name} • {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMoreNotifications && (
              <div className="text-center pt-3">
                <button
                  onClick={loadMoreNotifications}
                  disabled={loadingNotifications}
                  className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  {loadingNotifications ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
