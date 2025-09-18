import React, { useState, useEffect } from 'react';
import { Course, CourseStats, Student, ActiveTab } from '../../types/course.types';
import CourseOverview from './CourseOverview';
import StudentList from '../students/StudentList';
import AddStudentModal from '../students/AddStudentModal';
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

interface CourseTabContentProps {
  activeTab: ActiveTab;
  course: Course;
  courseStats: CourseStats | null;
  enrolledStudents: Student[];
  showAddStudent: boolean;
  onShowModulesView: () => void;
  onAddStudent: () => void;
  onCloseAddStudent: () => void;
  onUnenrollStudent: (studentId: string) => void;
  onEnrollStudent: (studentId: string) => void;
  availableStudents: Student[];
  loading?: boolean;
  onOpenChatWithStudent?: (studentId: string) => void;
  onNavigateToExercise?: (exerciseId: string, studentId: string) => void;
}

export default function CourseTabContent({
  activeTab,
  course,
  courseStats,
  enrolledStudents,
  showAddStudent,
  onShowModulesView,
  onAddStudent,
  onCloseAddStudent,
  onUnenrollStudent,
  onEnrollStudent,
  availableStudents,
  loading = false,
  onOpenChatWithStudent,
  onNavigateToExercise
}: CourseTabContentProps) {
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
    // Mark as read if not already read
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'message_received') {
      // Open chat with student and switch to Course tab with selection
      onOpenChatWithStudent?.(notification.studentId._id);
    } else if (notification.type === 'exercise_completed' && notification.metadata.exerciseId) {
      // Navigate to exercise and switch to Course tab with selection
      onNavigateToExercise?.(notification.metadata.exerciseId, notification.studentId._id);
    }
  };

  useEffect(() => {
    loadNotifications(1, false);
    loadUnreadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadNotifications();
      if (notifications.length === 0) {
        loadNotifications(1, false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  if (activeTab === 'course') {
    return (
      <>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Overview</h3>
          
          {/* Notifications List */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-blue-900">Recent Notifications</h4>
              {unreadNotifications > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${
                            notification.type === 'exercise_completed' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {notification.type === 'exercise_completed' ? '✓' : '💬'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {notification.message}
                        </p>
                        <div className="text-xs text-gray-500">
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

          {/* Course Button */}
          <div className="text-center">
            <button
              onClick={onShowModulesView}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-base font-medium"
            >
              Course
            </button>
          </div>
        </div>

      </>
    );
  }

  if (activeTab === 'overview') {
    return <CourseOverview course={course} courseStats={courseStats} />;
  }

  if (activeTab === 'students') {
    return (
      <div className="space-y-6">
        <StudentList
          enrolledStudents={enrolledStudents}
          courseId={course._id}
          onAddStudent={onAddStudent}
          onUnenrollStudent={onUnenrollStudent}
          onOpenChatWithStudent={(studentId) => {
            onOpenChatWithStudent?.(studentId);
          }}
        />
        
        <AddStudentModal
          isOpen={showAddStudent}
          onClose={onCloseAddStudent}
          availableStudents={availableStudents}
          onEnrollStudent={onEnrollStudent}
          loading={loading}
        />
      </div>
    );
  }

  return null;
}
