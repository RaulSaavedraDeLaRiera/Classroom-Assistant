import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import UsersService from '../../../services/users.service';
import { ArrowLeft, User, Search, ChevronRight } from 'lucide-react';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  coursesCount?: number;
  studentsCount?: number;
}

export default function AdminTeachersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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
        loadTeachers();
      }
    }
  }, [user, isLoading, router]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const usersService = UsersService.getInstance();
      const teachersData = await usersService.getTeachers();
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewTeacherDetails = (teacherId: string) => {
    router.push(`/admin/users/teachers/${teacherId}`);
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
                <h1 className="text-3xl font-bold text-gradient">Teachers Management</h1>
                <p className="text-text-secondary">Manage teacher accounts and their courses</p>
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
        {/* Search Bar */}
        <div className="mb-8 animate-fade-in">
          <div className="relative max-w-4xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-tertiary" />
            </div>
            <input
              type="text"
              placeholder="Search teachers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Teachers List */}
        {loading ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading teachers...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher._id}
                className="card-interactive"
                onClick={() => viewTeacherDetails(teacher._id)}
              >
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text-primary">{teacher.name}</h3>
                          <p className="text-text-secondary">{teacher.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-text-tertiary">Courses:</span>
                          <p className="font-medium text-text-primary">
                            {teacher.coursesCount || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">Students:</span>
                          <p className="font-medium text-text-primary">
                            {teacher.studentsCount || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">Joined:</span>
                          <p className="font-medium text-text-primary">
                            {new Date(teacher.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`badge ${
                        teacher.active 
                          ? 'badge-success' 
                          : 'badge-error'
                      }`}>
                        {teacher.active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-brand-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTeachers.length === 0 && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No teachers found</h3>
            <p className="text-text-secondary">No teachers match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
