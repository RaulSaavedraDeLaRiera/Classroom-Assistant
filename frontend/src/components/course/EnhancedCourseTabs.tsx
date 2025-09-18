import React from 'react';
import { BookOpen, Users, Bell, Settings } from 'lucide-react';

export type EnhancedActiveTab = 'modules' | 'students' | 'notifications' | 'data';

interface EnhancedCourseTabsProps {
  activeTab: EnhancedActiveTab;
  onTabChange: (tab: EnhancedActiveTab) => void;
  enrolledStudentsCount: number;
  unreadNotificationsCount?: number;
  modulesCount?: number;
  exercisesCount?: number;
}

export const EnhancedCourseTabs: React.FC<EnhancedCourseTabsProps> = ({
  activeTab,
  onTabChange,
  enrolledStudentsCount,
  unreadNotificationsCount = 0,
  modulesCount = 0,
  exercisesCount = 0
}) => {
  const tabs = [
    {
      id: 'modules' as EnhancedActiveTab,
      label: 'Course',
      icon: BookOpen,
      color: 'green'
    },
    {
      id: 'students' as EnhancedActiveTab,
      label: 'Students',
      icon: Users,
      color: 'purple'
    },
    {
      id: 'notifications' as EnhancedActiveTab,
      label: 'Notifications',
      icon: Bell,
      color: 'orange',
      badge: unreadNotificationsCount,
      showBadge: unreadNotificationsCount > 0
    },
    {
      id: 'data' as EnhancedActiveTab,
      label: 'Data',
      icon: Settings,
      color: 'blue'
    }
  ];

  const getTabClasses = (tab: typeof tabs[0]) => {
    const baseClasses = "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group";
    const isActive = activeTab === tab.id;
    
    const colorClasses: Record<string, string> = {
      blue: isActive 
        ? 'bg-blue-50 border-blue-200 text-blue-700' 
        : 'hover:bg-blue-50 hover:text-blue-700 text-gray-600',
      green: isActive 
        ? 'bg-green-50 border-green-200 text-green-700' 
        : 'hover:bg-green-50 hover:text-green-700 text-gray-600',
      purple: isActive 
        ? 'bg-purple-50 border-purple-200 text-purple-700' 
        : 'hover:bg-purple-50 hover:text-purple-700 text-gray-600',
      orange: isActive 
        ? 'bg-orange-50 border-orange-200 text-orange-700' 
        : 'hover:bg-orange-50 hover:text-orange-700 text-gray-600',
      gray: isActive 
        ? 'bg-gray-50 border-gray-200 text-gray-700' 
        : 'hover:bg-gray-50 hover:text-gray-700 text-gray-600'
    };

    return `${baseClasses} ${colorClasses[tab.color]} ${isActive ? 'border-2' : 'border-2 border-transparent'}`;
  };

  const getIconClasses = (tab: typeof tabs[0]) => {
    const isActive = activeTab === tab.id;
    const colorClasses: Record<string, string> = {
      blue: isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
      green: isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600',
      purple: isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-600',
      orange: isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600',
      gray: isActive ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-600'
    };

    return `w-5 h-5 ${colorClasses[tab.color]}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-4">
      <div className="flex items-center justify-center space-x-1 sm:space-x-4 overflow-x-auto">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <div
              key={tab.id}
              className={`
                flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group flex-shrink-0
                ${activeTab === tab.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
              onClick={() => onTabChange(tab.id)}
            >
              <div className="relative">
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                {tab.showBadge && tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              
              {/* Label al lado del icono - Responsive */}
              <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'block' : 'hidden sm:block'
              }`}>
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedCourseTabs;
