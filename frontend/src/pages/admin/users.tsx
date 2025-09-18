import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Users, UserCheck, Settings, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

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
                onClick={() => router.push('/admin')}
                className="btn-ghost btn-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gradient">User Management</h1>
                <p className="text-text-secondary">Manage teachers and students in the system</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-700 rounded-xl flex items-center justify-center animate-bounce-in">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Teachers Management */}
          <div className="card-interactive" onClick={() => router.push('/admin/users/teachers')}>
            <div className="card-body">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">Teachers</h3>
                  <p className="text-text-tertiary">Manage teacher accounts</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">
                Manage teacher accounts, their permissions, assigned courses and profile settings.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm text-text-tertiary">
                  <span>Teachers</span>
                  <span>•</span>
                  <span>Management</span>
                </div>
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-brand-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Students Management */}
          <div className="card-interactive" onClick={() => router.push('/admin/users/students')}>
            <div className="card-body">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-700 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">Students</h3>
                  <p className="text-text-tertiary">Manage student accounts</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">
                Manage student accounts, their progress, enrolled courses and profile settings.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm text-text-tertiary">
                  <span>Students</span>
                  <span>•</span>
                  <span>Management</span>
                </div>
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-success-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
