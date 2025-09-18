import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Users, Settings, ArrowLeft, BarChart3, FileText, UserCheck, Cog, ChevronRight, LogOut } from 'lucide-react';

export default function AdminPage() {
  const { user, isLoading, logout } = useAuth();
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
        {/* Header */}
        <div className="bg-surface-primary border-b border-border-primary">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between animate-slide-in">
              <div>
                <h1 className="text-4xl font-bold text-gradient mb-2">Administration Panel</h1>
                <p className="text-text-secondary text-lg">Manage templates, users and system configuration</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center animate-bounce-in">
                  <span className="text-white font-bold text-lg">CA</span>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-text-primary">Classroom Assistant</p>
                  <p className="text-sm text-text-tertiary">System active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Main Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 animate-fade-in">
            {/* Templates Management */}
            <div className="card-interactive" onClick={() => router.push('/admin/templates')}>
              <div className="card-body">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">Templates</h3>
                    <p className="text-text-tertiary">Manage course templates</p>
                  </div>
                </div>
                <p className="text-text-secondary mb-4">
                  Create and manage course, module and exercise templates for teachers to reuse.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4 text-sm text-text-tertiary">
                    <span>Templates</span>
                    <span>•</span>
                    <span>Management</span>
                  </div>
                  <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-brand-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Users Management */}
            <div className="card-interactive" onClick={() => router.push('/admin/users')}>
              <div className="card-body">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-700 rounded-2xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">Users</h3>
                    <p className="text-text-tertiary">Manage teachers and students</p>
                  </div>
                </div>
                <p className="text-text-secondary mb-4">
                  Manage teacher and student accounts, their permissions and settings.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4 text-sm text-text-tertiary">
                    <span>Users</span>
                    <span>•</span>
                    <span>Management</span>
                  </div>
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-success-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* System Configuration */}
            <div className="card-interactive" onClick={() => router.push('/admin/system')}>
              <div className="card-body">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-warning-500 to-warning-700 rounded-2xl flex items-center justify-center">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">System</h3>
                    <p className="text-text-tertiary">System configuration</p>
                  </div>
                </div>
                <p className="text-text-secondary mb-4">
                  Configure system parameters, backups and monitor platform performance.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4 text-sm text-text-tertiary">
                    <span>Configuration</span>
                    <span>•</span>
                    <span>Monitoring</span>
                  </div>
                  <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-warning-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Logout button (small on mobile, bottom-right) */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
          <button
            onClick={logout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[1.02] flex items-center justify-center space-x-1 shadow-sm"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
