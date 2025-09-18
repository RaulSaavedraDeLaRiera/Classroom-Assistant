import React from 'react';
import { ActiveTab } from '../../types/course.types';

interface CourseTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  enrolledStudentsCount: number;
}

export default function CourseTabs({ activeTab, onTabChange, enrolledStudentsCount }: CourseTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('course')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'course'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Course
        </button>
        <button
          onClick={() => onTabChange('overview')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onTabChange('students')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'students'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Students ({enrolledStudentsCount})
        </button>
      </nav>
    </div>
  );
}
