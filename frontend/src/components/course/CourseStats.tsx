import React, { useState } from 'react';
import { CourseStats as CourseStatsType } from '../../types/course.types';
import { Clipboard, CheckCircle, Users, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

interface CourseStatsProps {
  courseStats: CourseStatsType | null;
}

export default function CourseStats({ courseStats }: CourseStatsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!courseStats) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Course Statistics</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="text-sm font-medium">
            {isExpanded ? 'Hide' : 'Show'} Statistics
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Stats Cards */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clipboard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Modules</p>
                <p className="text-2xl font-bold text-blue-900">{courseStats.modulesCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Exercises</p>
                <p className="text-2xl font-bold text-green-900">{courseStats.totalExercises}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Enrolled Students</p>
                <p className="text-2xl font-bold text-purple-900">{courseStats.enrolledStudents}/{courseStats.maxStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-orange-200"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="100.48"
                    strokeDashoffset={`${100.48 - ((courseStats.progress || 0) / 100) * 100.48}`}
                    strokeLinecap="round"
                    className="text-orange-600 transition-all duration-300"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Progress</p>
                <p className="text-2xl font-bold text-orange-900">{courseStats.progress || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
