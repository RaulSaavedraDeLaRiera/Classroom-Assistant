import React from 'react';
import { Course, CourseStats } from '../../types/course.types';

interface CourseOverviewProps {
  course: Course;
  courseStats: CourseStats | null;
}

export default function CourseOverview({ course, courseStats }: CourseOverviewProps) {
  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return <span className="text-gray-400">No tags</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Course Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Title</p>
            <p className="text-gray-900">{course.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Description</p>
            <p className="text-gray-900">{course.description}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Duration</p>
            <p className="text-gray-900">{course.estimatedTime} hours</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Status</p>
            <p className="text-gray-900 capitalize">{course.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Created</p>
            <p className="text-gray-900">{new Date(course.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Last Updated</p>
            <p className="text-gray-900">{new Date(course.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Tags</p>
          <div className="mt-2">{renderTags(course.tags)}</div>
        </div>
      </div>

      {/* Quick Stats */}
      {courseStats && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{courseStats.modulesCount}</p>
              <p className="text-sm text-blue-700">Modules</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{courseStats.totalExercises}</p>
              <p className="text-sm text-blue-700">Exercises</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{courseStats.enrolledStudents}</p>
              <p className="text-sm text-blue-700">Students</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
