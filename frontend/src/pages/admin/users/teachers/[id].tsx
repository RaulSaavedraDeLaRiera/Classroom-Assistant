import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import UsersService from '../../../../services/users.service';
import { ArrowLeft, User, BookOpen, ChevronRight, GraduationCap } from 'lucide-react';

interface TeacherDetails {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  tags: string[];
  profile: Record<string, any>;
  courses: any[];
  students: any[];
}

export default function TeacherDetailsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teacher, setTeacher] = useState<TeacherDetails | null>(null);
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
      loadTeacherDetails();
    }
  }, [isAuthorized, id]);

  const loadTeacherDetails = async () => {
    try {
      setLoading(true);
      const usersService = UsersService.getInstance();
      const teacherData = await usersService.getUserDetails(id as string);
      setTeacher(teacherData);
    } catch (error) {
      console.error('Error loading teacher details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!teacher) return;
    
    const action = teacher.active ? 'deactivate' : 'activate';
    const confirmMessage = teacher.active 
      ? 'Are you sure you want to deactivate this teacher? They will not be able to access the platform.'
      : 'Are you sure you want to activate this teacher? They will be able to access the platform.';
    
    if (!confirm(confirmMessage)) return;

    try {
      setUpdating(true);
      const usersService = UsersService.getInstance();
      await usersService.updateUserStatus(id as string, !teacher.active);
      setTeacher(prev => prev ? { ...prev, active: !prev.active } : null);
    } catch (error) {
      console.error('Error updating teacher status:', error);
      alert('Failed to update teacher status. Please try again.');
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
          <p className="text-text-secondary">Loading teacher details...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Teacher Not Found</h2>
          <p className="text-text-secondary mb-4">The requested teacher could not be found.</p>
          <button
            onClick={() => router.push('/admin/users/teachers')}
            className="btn-primary"
          >
            Back to Teachers
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
                onClick={() => router.push('/admin/users/teachers')}
                className="btn-ghost btn-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Teachers
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Teacher Details</h1>
                <p className="text-text-secondary text-sm">{teacher.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center animate-bounce-in">
                <User className="w-6 h-6 text-white" />
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
                    <p className="text-text-primary font-medium">{teacher.name}</p>
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <p className="text-text-primary font-medium">{teacher.email}</p>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${teacher.active ? 'badge-success' : 'badge-error'}`}>
                        {teacher.active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={handleToggleStatus}
                        disabled={updating}
                        className={`btn btn-sm ${teacher.active ? 'btn-error' : 'btn-success'}`}
                      >
                        {updating ? (
                          <div className="loading-spinner w-4 h-4 mr-1"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={teacher.active ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"} />
                          </svg>
                        )}
                        {teacher.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Joined</label>
                    <p className="text-text-primary font-medium">{new Date(teacher.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Section */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-text-primary">
                  Courses ({teacher.courses.filter((course, index, self) => 
                    index === self.findIndex(c => 
                      (c._id && course._id && c._id === course._id) || 
                      (c.id && course.id && c.id === course.id) ||
                      (c.title && course.title && c.title === course.title)
                    )
                  ).length})
                </h2>
              </div>
              <div className="card-body">
                {teacher.courses.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.courses
                      .filter((course, index, self) => 
                        // Remove duplicates based on course ID or title
                        index === self.findIndex(c => 
                          (c._id && course._id && c._id === course._id) || 
                          (c.id && course.id && c.id === course.id) ||
                          (c.title && course.title && c.title === course.title)
                        )
                      )
                      .map((course, index) => (
                        <div key={course._id || course.id || `course-${index}`} className="p-4 bg-surface-secondary rounded-lg">
                          <h3 className="font-medium text-text-primary mb-1">{course.title || `Course ${index + 1}`}</h3>
                          <p className="text-sm text-text-secondary">{course.description || 'No description available'}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-text-tertiary">No courses assigned yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Students Section */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-text-primary">
                  Students ({teacher.students.filter((student, index, self) => 
                    index === self.findIndex(s => 
                      (s._id && student._id && s._id === student._id) || 
                      (s.id && student.id && s.id === student.id) ||
                      (s.email && student.email && s.email === student.email)
                    )
                  ).length})
                </h2>
              </div>
              <div className="card-body">
                {teacher.students.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.students
                      .filter((student, index, self) => 
                        // Remove duplicates based on student ID or email
                        index === self.findIndex(s => 
                          (s._id && student._id && s._id === student._id) || 
                          (s.id && student.id && s.id === student.id) ||
                          (s.email && student.email && s.email === student.email)
                        )
                      )
                      .map((student, index) => (
                        <div 
                          key={student._id || student.id || `student-${index}`} 
                          className="p-4 bg-surface-secondary rounded-lg hover:bg-surface-tertiary cursor-pointer transition-colors duration-200"
                          onClick={() => router.push(`/admin/users/students/${student._id || student.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-text-primary mb-1 hover:text-brand-600 transition-colors">{student.name || `Student ${index + 1}`}</h3>
                              <p className="text-sm text-text-secondary">{student.email || 'No email available'}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-tertiary" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-text-tertiary">No students assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-text-primary">Quick Stats</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-tertiary">Courses Created</span>
                    <span className="font-semibold text-text-primary">
                      {teacher.courses.filter((course, index, self) => 
                        index === self.findIndex(c => 
                          (c._id && course._id && c._id === course._id) || 
                          (c.id && course.id && c.id === course.id) ||
                          (c.title && course.title && c.title === course.title)
                        )
                      ).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-tertiary">Students Assigned</span>
                    <span className="font-semibold text-text-primary">
                      {teacher.students.filter((student, index, self) => 
                        index === self.findIndex(s => 
                          (s._id && student._id && s._id === student._id) || 
                          (s.id && student.id && s.id === student.id) ||
                          (s.email && student.email && s.email === student.email)
                        )
                      ).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-tertiary">Account Status</span>
                    <span className={`text-sm font-medium ${teacher.active ? 'text-success-600' : 'text-error-600'}`}>
                      {teacher.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-tertiary">Member Since</span>
                    <span className="text-sm font-medium text-text-primary">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-text-primary">Activity Summary</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="p-4 bg-surface-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">Teaching Activity</span>
                      <span className="text-xs text-text-tertiary">This month</span>
                    </div>
                    <div className="text-2xl font-bold text-brand-600">
                      {teacher.courses.filter((course, index, self) => 
                        index === self.findIndex(c => 
                          (c._id && course._id && c._id === course._id) || 
                          (c.id && course.id && c.id === course.id) ||
                          (c.title && course.title && c.title === course.title)
                        )
                      ).length}
                    </div>
                    <p className="text-xs text-text-tertiary">Active courses</p>
                  </div>
                  
                  <div className="p-4 bg-surface-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">Student Engagement</span>
                      <span className="text-xs text-text-tertiary">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-success-600">
                      {teacher.students.filter((student, index, self) => 
                        index === self.findIndex(s => 
                          (s._id && student._id && s._id === student._id) || 
                          (s.id && student.id && s.id === student.id) ||
                          (s.email && student.email && s.email === student.email)
                        )
                      ).length}
                    </div>
                    <p className="text-xs text-text-tertiary">Students assigned</p>
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
