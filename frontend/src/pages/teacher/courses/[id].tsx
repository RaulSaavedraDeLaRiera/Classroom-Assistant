import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { useCourseDetail } from '../../../hooks/useCourseDetail';
import { useStudentManagement } from '../../../hooks/useStudentManagement';
import CourseView from '../../../components/CourseView';
import StudentChat from '../../../components/students/StudentChat';
import CourseHeader from '../../../components/course/CourseHeader';
import CourseStats from '../../../components/course/CourseStats';
import { EnhancedCourseTabs } from '../../../components/course/EnhancedCourseTabs';
import EnhancedCourseTabContent from '../../../components/course/EnhancedCourseTabContent';
import NotificationsCounter from '../../../components/course/NotificationsCounter';
import StudentFilterBar from '../../../components/common/StudentFilterBar';
import { EnhancedActiveTab } from '../../../types/course.types';

export default function CourseDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { id: courseId } = router.query;
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<EnhancedActiveTab>('modules');
  const [showModulesView, setShowModulesView] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [chatStudentId, setChatStudentId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const [navigationParams, setNavigationParams] = useState<{
    studentId?: string;
    chatOpen?: boolean;
    exerciseId?: string;
  }>({});

  // Custom hooks for data management
  const { 
    course, 
    courseModules, 
    courseExercises, 
    courseStats, 
    loading: courseLoading, 
    error: courseError 
  } = useCourseDetail(courseId);

  const {
    enrolledStudents,
    availableStudents,
    showAddStudent,
    setShowAddStudent,
    loading: studentLoading,
    error: studentError,
    enrollStudent,
    unenrollStudent
  } = useStudentManagement(courseId);

  // Filter students based on search query
  const filterStudents = (query: string) => {
    if (!query.trim()) {
      setFilteredStudents(enrolledStudents);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = enrolledStudents.filter(student => {
      const fullName = `${student.name} ${student.email}`.toLowerCase();
      return fullName.includes(searchQuery) || 
             student.name.toLowerCase().includes(searchQuery) ||
             student.email.toLowerCase().includes(searchQuery);
    });
    
    setFilteredStudents(filtered);
  };

  // Initialize filtered students when enrolledStudents changes
  useEffect(() => {
    setFilteredStudents(enrolledStudents);
  }, [enrolledStudents]);

  // Authorization check
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    } else if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || courseLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center">Course not found</div>;
  }

  if (courseError || studentError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {courseError || studentError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-0 sm:p-6">
      {showModulesView ? (
        // Full-screen modules view
        (() => {
          console.log('[Debug] Rendering CourseView with:', { course, courseModules });
          return (
            <CourseView
              course={course}
              courseModules={courseModules}
              enrolledStudents={enrolledStudents}
              onBack={() => {
                setShowModulesView(false);
                setNavigationParams({}); // Clear navigation params
              }}
              initialStudentId={navigationParams.studentId}
              initialChatOpen={navigationParams.chatOpen}
              initialExerciseId={navigationParams.exerciseId}
            />
          );
        })()
      ) : (
        // Regular course view - Full width on mobile, centered on desktop
        <div className="w-full sm:max-w-7xl sm:mx-auto">
          <div className="bg-white shadow-none sm:shadow rounded-none sm:rounded-lg p-4 sm:p-6">
            <CourseHeader 
              course={course} 
              onBack={() => router.push('/teacher/courses')} 
            />

            {courseStats && <CourseStats courseStats={courseStats} />}

            {/* Notifications Counter - Only active when authenticated */}
            <NotificationsCounter
              onUnreadNotificationsChange={setUnreadNotificationsCount}
              isAuthenticated={isAuthorized}
            />

            <EnhancedCourseTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              enrolledStudentsCount={enrolledStudents.length}
              modulesCount={courseModules.length}
              exercisesCount={courseExercises.length}
              unreadNotificationsCount={unreadNotificationsCount}
            />

            <EnhancedCourseTabContent
              activeTab={activeTab}
              course={course}
              courseStats={courseStats}
              enrolledStudents={activeTab === 'students' ? filteredStudents : enrolledStudents}
              showAddStudent={showAddStudent}
              onShowModulesView={() => setShowModulesView(true)}
              onAddStudent={() => setShowAddStudent(true)}
              onCloseAddStudent={() => setShowAddStudent(false)}
              onUnenrollStudent={unenrollStudent}
              onEnrollStudent={enrollStudent}
              availableStudents={availableStudents}
              loading={studentLoading}
              onOpenChatWithStudent={(studentId) => {
                // Open chat modal without redirecting tabs
                setChatStudentId(studentId);
                setIsChatOpen(true);
              }}
              onNavigateToExercise={(exerciseId, studentId) => {
                setNavigationParams({
                  studentId,
                  exerciseId
                });
                // Switch to Course tab and select student
                setActiveTab('modules');
              }}
              modules={courseModules}
              onUnreadNotificationsChange={setUnreadNotificationsCount}
              initialSelectedStudentId={navigationParams.studentId}
            />
          </div>
        </div>
      )}
      {/* Student Chat modal overlay at page level */}
      {isChatOpen && chatStudentId && (
        <StudentChat
          courseId={course._id}
          studentId={chatStudentId}
          enrollmentId={enrolledStudents.find(s => s._id === chatStudentId)?.enrollmentId || ''}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}
