import React from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
  titleGradient?: string;
  headerHeight?: 'h-16' | 'h-20';
  showLogout?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backButtonText = 'Back',
  onBackClick,
  titleGradient = 'from-blue-600 to-purple-600',
  headerHeight = 'h-20',
  showLogout = false
}) => {
  const { user, logout } = useAuth();
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between ${headerHeight}`}>
          <div className={showBackButton ? "flex items-center space-x-4" : ""}>
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className="btn btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" />
                <ArrowLeft className="w-3 h-3 sm:hidden" />
                <span className="hidden sm:inline">{backButtonText}</span>
              </button>
            )}
            <div>
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1 hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>
          
          {/* Logout Button */}
          {showLogout && user && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="hidden sm:block text-sm text-gray-700">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
