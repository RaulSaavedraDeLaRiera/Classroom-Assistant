import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import UsersService from '../../../../services/users.service';
import { ArrowLeft, GraduationCap, User, ChevronRight, BookOpen } from 'lucide-react';

interface StudentDetails {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  tags: string[];
  profile: Record<string, any>;
  teacher: any;
  courses: any[];
  progress: Record<string, any>;
}

export default function StudentDetailsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isAuthorized && id) {
      loadStudentDetails();
    }
  }, [isAuthorized, id]);

  const loadStudentDetails = async () => {
    try {
      setLoading(true);
      const usersService = UsersService.getInstance();
      const studentData = await usersService.getUserDetails(id as string);
      setStudent(studentData);
    } catch (error) {
      console.error('Error loading student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!student) return;
    
    const action = student.active ? 'deactivate' : 'activate';
    const confirmMessage = student.active 
      ? 'Are you sure you want to deactivate this student? They will not be able to access the platform.'
      : 'Are you sure you want to activate this student? They will be able to access the platform.';
    
    if (!confirm(confirmMessage)) return;

    try {
      setUpdating(true);
      const usersService = UsersService.getInstance();
      await usersService.updateUserStatus(id as string, !student.active);
      setStudent(prev => prev ? { ...prev, active: !prev.active } : null);
    } catch (error) {
      console.error('Error updating student status:', error);
      alert('Failed to update student status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl" aria-hidden>×</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Student Not Found</h2>
          <p className="text-text-secondary mb-4">The requested student could not be found.</p>
          <button
            onClick={() => router.push('/admin/users/students')}
            className="btn-primary"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between animate-slide-in">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/users/students')}
                className="btn-ghost btn-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Students
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Student Details</h1>
                <p className="text-text-secondary text-sm">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-700 rounded-xl flex items-center justify-center animate-bounce-in">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-text-primary">Basic Information</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Name</label>
                    <p className="text-text-primary font-medium">{student.name}</p>
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <p className="text-text-primary font-medium">{student.email}</p>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${student.active ? 'badge-success' : 'badge-error'}`}>
                        {student.active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={handleToggleStatus}
                        disabled={updating}
                        className={`btn btn-sm ${student.active ? 'btn-error' : 'btn-success'}`}
                      >
                        {updating ? (
                          <div className="loading-spinner w-4 h-4 mr-1"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={student.active ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"} />
                          </svg>
                        )}
                        {student.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Joined</label>
                    <p className="text-text-primary font-medium">{new Date(student.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Teacher */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-text-primary">Assigned Teacher</h2>
              </div>
              <div className="card-body">
                {student.teacher ? (
                  <div 
                    className="flex items-center space-x-4 p-4 bg-surface-secondary rounded-lg hover:bg-surface-tertiary cursor-pointer transition-colors duration-200"
                    onClick={() => router.push(`/admin/users/teachers/${student.teacher._id}`)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary hover:text-brand-600 transition-colors">{student.teacher.name}</h3>
                      <p className="text-sm text-text-secondary">{student.teacher.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-text-tertiary">No teacher assigned yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enrolled Courses */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-text-primary">
                  Enrolled Courses ({student.courses.filter((course, index, self) => 
                    index === self.findIndex(c => 
                      (c._id && course._id && c._id === course._id) || 
                      (c.id && course.id && c.id === course.id) ||
                      (c.title && course.title && c.title === course.title)
                    )
                  ).length})
                </h2>
              </div>
              <div className="card-body">
                {student.courses.length > 0 ? (
                  <div className="space-y-4">
                    {student.courses
                      .filter((course, index, self) => 
                        // Remove duplicates based on course ID or title
                        index === self.findIndex(c => 
                          (c._id && course._id && c._id === course._id) || 
                          (c.id && course.id && c.id === course.id) ||
                          (c.title && course.title && c.title === course.title)
                        )
                      )
                      .map((course, index) => {
                        const courseId = course._id || course.id;
                        // Use progress from course object first, then fallback to progress object
                        const courseProgress = course.progress || (courseId ? (student.progress[courseId.toString()] || 0) : 0) || 0;
                        return (
                          <div key={courseId || `course-${index}`} className="p-4 bg-surface-secondary rounded-lg">
                            <h3 className="font-medium text-text-primary mb-1">{course.title || `Course ${index + 1}`}</h3>
                            <p className="text-sm text-text-secondary mb-3">{course.description || 'No description available'}</p>
                            
                          {/* Progress for this specific course */}
                          <div className="mt-3 pt-3 border-t border-border-primary">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-text-tertiary">Progress</span>
                              <span className="text-xs font-semibold text-brand-600">
                                {courseProgress > 0 ? `${courseProgress}%` : 'Not started'}
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  courseProgress > 0 
                                    ? 'bg-gradient-to-r from-brand-500 to-brand-600' 
                                    : 'bg-neutral-300'
                                }`}
                                style={{ width: `${Math.max(courseProgress, 2)}%` }}
                              ></div>
                            </div>
                            {courseProgress === 0 && (
                              <p className="text-xs text-text-tertiary mt-1">No progress recorded yet</p>
                            )}
                          </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-text-tertiary">No courses enrolled yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">

            {/* Quick Stats */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-text-primary">Quick Stats</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-tertiary">Courses Enrolled</span>
                    <span className="font-semibold text-text-primary">
                      {student.courses.filter((course, index, self) => 
                        index === self.findIndex(c => 
                          (c._id && course._id && c._id === course._id) || 
                          (c.id && course.id && c.id === course.id) ||
                          (c.title && course.title && c.title === course.title)
                        )
                      ).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-tertiary">Account Status</span>
                    <span className={`text-sm font-medium ${student.active ? 'text-success-600' : 'text-error-600'}`}>
                      {student.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-tertiary">Member Since</span>
                    <span className="text-sm font-medium text-text-primary">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
