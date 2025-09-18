import { useEffect } from 'react';

interface NotificationsCounterProps {
  onUnreadNotificationsChange?: (count: number) => void;
  isAuthenticated?: boolean;
}

export const NotificationsCounter: React.FC<NotificationsCounterProps> = ({
  onUnreadNotificationsChange,
  isAuthenticated = true
}) => {
  const loadUnreadNotifications = async () => {
    // Only load if authenticated
    if (!isAuthenticated) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/notifications/unread/count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.unreadCount || 0;
        
        if (onUnreadNotificationsChange) {
          onUnreadNotificationsChange(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error loading unread notifications count:', error);
    }
  };

  useEffect(() => {
    // Only start loading if authenticated
    if (isAuthenticated) {
      // Wait a bit for the token to be available
      const timer = setTimeout(() => {
        loadUnreadNotifications();
      }, 1000);
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
          loadUnreadNotifications();
        }
      }, 30000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, onUnreadNotificationsChange]);

  // This component doesn't render anything, it just manages the counter
  return null;
};

export default NotificationsCounter;
