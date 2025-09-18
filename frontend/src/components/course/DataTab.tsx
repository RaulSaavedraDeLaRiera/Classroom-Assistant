import React from 'react';
import { Course, CourseStats } from '../../types/course.types';
import { BookOpen, Users, TrendingUp, Settings, BarChart3, Calendar } from 'lucide-react';

interface DataTabProps {
  course: Course;
  courseStats: CourseStats | null;
  onShowModulesView: () => void;
  onAddStudent: () => void;
}

export const DataTab: React.FC<DataTabProps> = ({
  course,
  courseStats,
  onShowModulesView,
  onAddStudent
}) => {
  return (
    <div className="space-y-6">
      {/* Course Basic Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
        
        {/* Description */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
          <p className="text-gray-700 leading-relaxed">{course.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Duration</h4>
            <p className="text-lg font-semibold text-gray-900">{course.estimatedTime}min</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Created</h4>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(course.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h4>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(course.updatedAt).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {course.tags && course.tags.length > 0 ? (
                course.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">No tags</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Course Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4 p-6 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-orange-900 mb-2">Analytics</h3>
              <p className="text-orange-700 mb-2">Track student progress and course performance</p>
              <span className="inline-block px-3 py-1 bg-orange-200 text-orange-800 text-sm rounded-full font-medium">
                Not implemented yet
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-green-900 mb-2">View Events</h3>
              <p className="text-green-700 mb-2">Monitor course events and activities</p>
              <span className="inline-block px-3 py-1 bg-green-200 text-green-800 text-sm rounded-full font-medium">
                Not implemented yet
              </span>
            </div>
          </div>
        </div>
        
        {/* Config Button - Below both in horizontal */}
        <div className="mt-6">
          <div className="flex items-center space-x-4 p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Advanced Config</h3>
              <p className="text-blue-700 mb-2">Advanced course configuration and settings</p>
              <span className="inline-block px-3 py-1 bg-blue-200 text-blue-800 text-sm rounded-full font-medium">
                Not implemented yet
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions - Commented out */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onShowModulesView}
          className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <BookOpen className="w-8 h-8 text-green-600" />
          <div className="text-left">
            <h3 className="font-medium text-green-900">Manage Modules</h3>
            <p className="text-sm text-green-700">View and organize course content</p>
          </div>
        </button>
        
        <button
          onClick={onAddStudent}
          className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Users className="w-8 h-8 text-blue-600" />
          <div className="text-left">
            <h3 className="font-medium text-blue-900">Manage Students</h3>
            <p className="text-sm text-blue-700">Add or remove students</p>
          </div>
        </button>
      </div> */}
    </div>
  );
};

export default DataTab;
