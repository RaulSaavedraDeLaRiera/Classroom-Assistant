import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Settings, Database, BarChart3, ChevronRight, Shield, Activity, AlertTriangle } from 'lucide-react';

export default function AdminSystemPage() {
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
                <h1 className="text-3xl font-bold text-gradient">System Configuration</h1>
                <p className="text-text-secondary">Manage system configuration and monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-warning-500 to-warning-700 rounded-xl flex items-center justify-center animate-bounce-in">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* General Settings */}
          <div className="card-interactive">
            <div className="card-body">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">General Settings</h3>
                  <p className="text-text-tertiary">System parameters</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">
                Configure general system parameters, security settings and global preferences.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm text-text-tertiary">
                  <span>Configuration</span>
                  <span>•</span>
                  <span>Security</span>
                </div>
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-brand-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="card-interactive">
            <div className="card-body">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-700 rounded-2xl flex items-center justify-center">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">Backup & Restore</h3>
                  <p className="text-text-tertiary">Manage system backups</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">
                Manage automatic and manual backups, data restoration and backup policies.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm text-text-tertiary">
                  <span>Backup</span>
                  <span>•</span>
                  <span>Restore</span>
                </div>
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          {/* System Logs */}
          <div className="card-interactive">
            <div className="card-body">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-warning-500 to-warning-700 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">System Logs</h3>
                  <p className="text-text-tertiary">View activity logs</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">
                Monitor system activity, errors, access and important events for diagnostics.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm text-text-tertiary">
                  <span>Logs</span>
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

        {/* Notice */}
        <div className="mt-8 animate-fade-in">
          <div className="alert alert-warning">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-3" />
              <div>
                <p className="font-medium">Note:</p>
                <p className="text-sm mt-1">System configuration functionality is not yet implemented. This is a preview of the interface.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
