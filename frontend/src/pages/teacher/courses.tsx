import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/layout';
import { BookOpen, CheckCircle, Zap } from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  estimatedTime: number;
  status: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  modulesCount?: number;
  exercisesCount?: number;
  progress?: number;
  enrolledStudents?: number;
  unreadNotifications?: number;
}

interface Notification {
  _id: string;
  courseId: { _id: string; title: string };
  isRead: boolean;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function TeacherCoursesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalUnreadNotifications, setTotalUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        loadCourses();
      }
    } else if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/notifications?limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Call the backend to get teacher's courses
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const teacherCourses: Course[] = await response.json();

      // Load statistics for each course
      const coursesWithStats = await Promise.all(
        teacherCourses.map(async (course: Course) => {
          try {
            const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/${course._id}/stats`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              return {
                ...course,
                modulesCount: stats.modulesCount || 0,
                exercisesCount: stats.totalExercises || 0,
                progress: stats.progress || 0,
                enrolledStudents: stats.enrolledStudents || 0
              };
            }
            return course;
          } catch (error) {
            console.error(`Error loading stats for course ${course._id}:`, error);
            return course;
          }
        })
      );

      // Load notifications first to count unread per course
      const notificationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/notifications?limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      let allNotifications: Notification[] = [];
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        allNotifications = notificationsData.notifications || [];
      }
      
      // Add unread notifications count to each course
      const coursesWithNotifications = coursesWithStats.map((course: Course) => {
        const courseNotifications = allNotifications.filter(notification => 
          notification.courseId._id === course._id
        );
        const unreadCount = courseNotifications.filter(notification => 
          notification.isRead === false
        ).length;
        
        console.log(`Course ${course.title} (${course._id}):`, {
          totalNotifications: courseNotifications.length,
          unreadCount: unreadCount,
          notifications: courseNotifications.map(n => ({ id: n._id, isRead: n.isRead, title: n.title }))
        });
        
        return {
          ...course,
          unreadNotifications: unreadCount
        };
      });

      setCourses(coursesWithNotifications);
      
      // Calculate total unread notifications
      const totalUnread = allNotifications.filter(notification => notification.isRead === false).length;
      setTotalUnreadNotifications(totalUnread);
      
      // Extract all unique tags
      const allTagsSet = new Set<string>();
      coursesWithNotifications.forEach((course: Course) => {
        if (course.tags && Array.isArray(course.tags)) {
          course.tags.forEach((tag: string) => allTagsSet.add(tag));
        }
      });
      setAllTags(Array.from(allTagsSet).sort());
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };


  // Course statistics loading - commented out for general view
  // const loadCourseStats = async () => {
  //   try {
  //     const stats: {[key: string]: any} = {};
  //     let totalModules = 0;
  //     let totalExercises = 0;
  //     
  //     for (const course of courses) {
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/${course._id}/stats`, {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });
  //       
  //       if (response.ok) {
  //         const courseStats = await response.json();
  //         totalModules += courseStats.modulesCount || 0;
  //         totalExercises += courseStats.totalExercises || 0;
  //       }
  //     }
  //     
  //     setCourseStats(stats);
  //     
  //     // Update the dashboard with totals
  //     const dashboardStats = document.querySelectorAll('[data-stat]');
  //     dashboardStats.forEach((element) => {
  //       const statType = element.getAttribute('data-stat');
  //       if (statType === 'total-modules') {
  //         totalModules.toString();
  //       } else if (statType === 'statType === 'total-exercises') {
  //         totalExercises.toString();
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error loading course stats:', error);
  //   }
  // };

  const handleCreateCourse = () => {
    router.push('/teacher/courses/create');
  };


  const handleFilterByTag = (tag: string) => {
    setSelectedTagFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTagFilters([]);
  };

  const getFilteredCourses = () => {
    let filtered = [...courses];

    // Apply tag filter (exclusive - must have ALL selected tags)
    if (selectedTagFilters.length > 0) {
      filtered = filtered.filter(course => 
        course.tags && selectedTagFilters.every(tag => course.tags.includes(tag))
      );
    }

    return filtered;
  };

  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return <span className="text-gray-400">No tags</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  const handleEditCourse = (id: string) => {
    router.push(`/teacher/courses/${id}`);
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete course');
        }
        
        alert('Course deleted successfully');
        loadCourses(); // Reload the courses list
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course. Please try again.');
      }
    }
  };


  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  const filteredCourses = getFilteredCourses();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with Dot Texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        <div className="absolute inset-0 bg-white/50"></div>
      </div>

      <div className="relative z-10">
      <PageHeader
        title="Course Management"
        subtitle="Create and manage your courses"
        showBackButton={true}
        backButtonText="Back to Teacher"
        onBackClick={() => router.push('/teacher')}
        titleGradient="from-blue-600 to-blue-700"
        showLogout={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          {/* Course Statistics */}
          {courses.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Courses</p>
                      <p className="text-2xl font-bold text-blue-900">{courses.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Total Notifications</p>
                      <p className="text-2xl font-bold text-green-900">{totalUnreadNotifications}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleFilterByTag(tag)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTagFilters.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTagFilters.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Courses List */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="text-center py-8">Loading courses...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No courses found</p>
                <p className="text-sm">Create your first course to get started!</p>
                <button
                  onClick={handleCreateCourse}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <div
                    key={course._id}
                    className="w-full border-2 border-blue-300 rounded-lg p-6 hover:shadow-lg transition-all duration-200 bg-white/90 backdrop-blur-sm cursor-pointer hover:border-blue-400"
                    onClick={() => handleEditCourse(course._id)}
                  >
                    {/* Header with title and notifications */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{course.description}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Notifications badge */}
                        <div className="relative">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          {(course.unreadNotifications || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {course.unreadNotifications || 0}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="mb-6">
                      {renderTags(course.tags)}
                    </div>
                    
                    {/* Course Stats Grid - 3x2 */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* Left column: Empty, Duration and Progress */}
                      <div className="space-y-4">
                        <div className="h-16"></div>
                        
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-600">Duration</span>
                            <span className="text-xl font-bold text-blue-900">{course.estimatedTime || 0}h</span>
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-orange-600">Progress</span>
                            <span className="text-xl font-bold text-orange-900">{course.progress || 0}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right column: Students, Modules and Exercises */}
                      <div className="space-y-4">
                        <div className="bg-indigo-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-indigo-600">Students</span>
                            <span className="text-xl font-bold text-indigo-900">{course.enrolledStudents || 0}</span>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">Modules</span>
                            <span className="text-xl font-bold text-green-900">{course.modulesCount || 0}</span>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-600">Exercises</span>
                            <span className="text-xl font-bold text-purple-900">{course.exercisesCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer with creation date */}
                    <div className="pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500">
                        Created: {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New Course Button - Bottom */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-center">
              <button
                onClick={handleCreateCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Create New Course
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
