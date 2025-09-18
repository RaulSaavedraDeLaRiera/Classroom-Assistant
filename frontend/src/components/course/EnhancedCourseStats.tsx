import React from 'react';
import { BookOpen, Users, Clock, CheckCircle, TrendingUp, Award } from 'lucide-react';
import ProgressIndicator from '../common/ProgressIndicator';

interface CourseStats {
  courseId: string;
  courseTitle: string;
  modulesCount: number;
  totalExercises: number;
  enrolledStudents: number;
  maxStudents: number;
  courseStatus: string;
  progress?: number;
}

interface EnhancedCourseStatsProps {
  courseStats: CourseStats;
  className?: string;
}

export const EnhancedCourseStats: React.FC<EnhancedCourseStatsProps> = ({
  courseStats,
  className = ''
}) => {
  const stats = [
    {
      title: 'Modules',
      value: courseStats.modulesCount,
      icon: BookOpen,
      color: 'blue',
      description: 'Total modules'
    },
    {
      title: 'Exercises',
      value: courseStats.totalExercises,
      icon: CheckCircle,
      color: 'green',
      description: 'Total exercises'
    },
    {
      title: 'Students',
      value: `${courseStats.enrolledStudents}/${courseStats.maxStudents}`,
      icon: Users,
      color: 'purple',
      description: 'Enrolled students'
    },
    {
      title: 'Progress',
      value: courseStats.progress || 0,
      icon: TrendingUp,
      color: 'orange',
      description: 'Course completion',
      isPercentage: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600',
      green: 'bg-green-50 border-green-200 text-green-600',
      purple: 'bg-purple-50 border-purple-200 text-purple-600',
      orange: 'bg-orange-50 border-orange-200 text-orange-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Course Statistics</h3>
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getColorClasses(stat.color)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${getColorClasses(stat.color).replace('50', '100')}`}>
                  <IconComponent className={`w-5 h-5 ${getIconColorClasses(stat.color)}`} />
                </div>
                {stat.isPercentage && (
                  <ProgressIndicator
                    progress={stat.value as number}
                    size="sm"
                    showPercentage={false}
                    color={stat.color as any}
                  />
                )}
              </div>
              
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.isPercentage ? `${stat.value}%` : stat.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {stat.title}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Live updates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCourseStats;
