import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import UsersService from '../../../services/users.service';
import { PageHeader } from '../../../components/layout';
import { Calendar, BookOpen, TrendingUp, UserCheck } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  profile?: any;
  createdAt: string;
}

interface Enrollment {
  _id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  enrolledAt: string;
  completedModules: number;
  totalModules: number;
  completedExercises: number;
  totalExercises: number;
  progress: number;
  status: 'active' | 'completed' | 'inactive';
}

export default function StudentDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        if (id) {
          loadStudentData();
        }
      }
    } else if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router, id]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      if (user?.id && id) {
        // Load student basic info
        const studentData = await UsersService.getInstance().getStudentById(id as string);
        setStudent(studentData);

        // Load student enrollments and progress
        const enrollmentsData = await UsersService.getInstance().getStudentEnrollments(id as string);
        setEnrollments(enrollmentsData);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalProgress = () => {
    if (enrollments.length === 0) return 0;
    
    const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
    return Math.round(totalProgress / enrollments.length);
  };

  const getTotalModulesCompleted = () => {
    return enrollments.reduce((sum, enrollment) => sum + enrollment.completedModules, 0);
  };

  const getTotalExercisesCompleted = () => {
    return enrollments.reduce((sum, enrollment) => sum + enrollment.completedExercises, 0);
  };

  const getTotalModules = () => {
    return enrollments.reduce((sum, enrollment) => sum + enrollment.totalModules, 0);
  };

  const getTotalExercises = () => {
    return enrollments.reduce((sum, enrollment) => sum + enrollment.totalExercises, 0);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Student Not Found"
          subtitle="The requested student could not be found"
          showBackButton={true}
          backButtonText="Back to Students"
          onBackClick={() => router.push('/teacher/students')}
          titleGradient="from-gray-600 to-gray-700"
        />
      </div>
    );
  }

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
        title={`${student.name} - Student Profile`}
        subtitle="View student progress and enrollment details"
        showBackButton={true}
        backButtonText="Back to Students"
        onBackClick={() => router.push('/teacher/students')}
        titleGradient="from-purple-600 to-purple-700"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-orange-200 rounded-xl">
                <Calendar className="w-7 h-7 text-orange-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Joined</p>
                <p className="text-xl font-bold text-orange-900">
                  {new Date(student.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-orange-200 rounded-xl">
                <BookOpen className="w-7 h-7 text-orange-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Enrollments</p>
                <p className="text-xl font-bold text-orange-900">{enrollments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-orange-200 rounded-xl">
                <TrendingUp className="w-7 h-7 text-orange-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Overall Progress</p>
                <p className="text-xl font-bold text-orange-900">{getTotalProgress()}%</p>
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
              <div className="p-2 bg-blue-200 rounded-lg mr-3">
                <BookOpen className="w-5 h-5 text-blue-700" />
              </div>
              Module Progress
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Completed</span>
                <span className="text-lg font-bold text-blue-900">{getTotalModulesCompleted()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Total</span>
                <span className="text-lg font-bold text-blue-900">{getTotalModules()}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm" 
                  style={{ width: `${getTotalModules() > 0 ? (getTotalModulesCompleted() / getTotalModules()) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center">
              <div className="p-2 bg-green-200 rounded-lg mr-3">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
              Exercise Progress
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Completed</span>
                <span className="text-lg font-bold text-green-900">{getTotalExercisesCompleted()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Total</span>
                <span className="text-lg font-bold text-green-900">{getTotalExercises()}</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm" 
                  style={{ width: `${getTotalExercises() > 0 ? (getTotalExercisesCompleted() / getTotalExercises()) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments List */}
        <div className="bg-white border-2 border-purple-200 rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-purple-300 bg-gradient-to-r from-purple-100 to-purple-200">
            <h3 className="text-xl font-bold text-purple-900 flex items-center">
              <div className="p-2 bg-purple-300 rounded-lg mr-3">
                <BookOpen className="w-5 h-5 text-purple-800" />
              </div>
              Course Enrollments
            </h3>
          </div>
          <div className="p-6">
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2 font-medium">No enrollments found</p>
                <p className="text-sm">This student hasn't enrolled in any courses yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment._id}
                    className="border-2 border-purple-300 rounded-lg p-6 hover:shadow-xl transition-all duration-300 bg-white cursor-pointer hover:border-purple-400 hover:scale-105 group"
                    onClick={() => router.push(`/teacher/courses/${enrollment.courseId}`)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                          {enrollment.courseTitle}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            enrollment.status === 'active' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : enrollment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {enrollment.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600 group-hover:text-purple-700 transition-colors">{enrollment.progress}%</p>
                        <p className="text-sm text-gray-600">Complete</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Modules</p>
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.completedModules} / {enrollment.totalModules}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Exercises</p>
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.completedExercises} / {enrollment.totalExercises}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full shadow-sm transition-all duration-500 group-hover:from-purple-600 group-hover:to-purple-700" 
                        style={{ width: `${enrollment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
