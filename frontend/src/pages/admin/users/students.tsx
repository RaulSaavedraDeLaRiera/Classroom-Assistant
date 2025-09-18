import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import UsersService from '../../../services/users.service';
import { ArrowLeft, GraduationCap, Search, User, ChevronRight } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  teacherName?: string;
  coursesCount?: number;
  progress?: number;
}

export default function AdminStudentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        loadStudents();
      }
    }
  }, [user, isLoading, router]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const usersService = UsersService.getInstance();
      const studentsData = await usersService.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.teacherName && student.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const viewStudentDetails = (studentId: string) => {
    router.push(`/admin/users/students/${studentId}`);
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

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between animate-slide-in">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="btn-ghost btn-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gradient">Students Management</h1>
                <p className="text-text-secondary">Manage student accounts and their progress</p>
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
        {/* Search Bar */}
        <div className="mb-8 animate-fade-in">
          <div className="relative max-w-4xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-tertiary" />
            </div>
            <input
              type="text"
              placeholder="Search students by name, email or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Students List */}
        {loading ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading students...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="card-interactive"
                onClick={() => viewStudentDetails(student._id)}
              >
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-700 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text-primary">{student.name}</h3>
                          <p className="text-text-secondary">{student.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-text-tertiary">Teacher:</span>
                          <p className="font-medium text-text-primary">
                            {student.teacherName || 'Not Assigned'}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">Courses:</span>
                          <p className="font-medium text-text-primary">
                            {student.coursesCount || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">Progress:</span>
                          <p className="font-medium text-text-primary">
                            {student.progress || 0}%
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">Joined:</span>
                          <p className="font-medium text-text-primary">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`badge ${
                        student.active 
                          ? 'badge-success' 
                          : 'badge-error'
                      }`}>
                        {student.active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-success-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No students found</h3>
            <p className="text-text-secondary">No students match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
