import React from 'react';
import { Course } from '../../types/course.types';
import { ArrowLeft } from 'lucide-react';

interface CourseHeaderProps {
  course: Course;
  onBack: () => void;
}

export default function CourseHeader({ course, onBack }: CourseHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to Courses"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight break-words overflow-hidden">
          {course.title}
        </h1>
      </div>
    </div>
  );
}
