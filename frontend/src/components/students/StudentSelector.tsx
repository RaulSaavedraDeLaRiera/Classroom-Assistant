import React from 'react';
import { Student } from '../../types/course.types';
import { MessageCircle } from 'lucide-react';

interface StudentSelectorProps {
  students: Student[];
  selectedStudentId: string | null;
  onStudentSelect: (studentId: string | null) => void;
  disabled?: boolean;
  courseId?: string;
  enrollmentId?: string;
  onOpenChat?: () => void;
}

export default function StudentSelector({ 
  students, 
  selectedStudentId, 
  onStudentSelect, 
  disabled = false,
  courseId,
  enrollmentId,
  onOpenChat
}: StudentSelectorProps) {
  const selectedStudent = students.find(s => s._id === selectedStudentId);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Management</h3>
          <p className="text-sm text-gray-600">
            Select a student to manage their course progress, exercises, and corrections.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="student-select" className="text-sm font-medium text-gray-700">
              Student:
            </label>
            <select
              id="student-select"
              value={selectedStudentId || ''}
              onChange={(e) => onStudentSelect(e.target.value || null)}
              disabled={disabled}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>
          
          {selectedStudent && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Managing: <span className="font-medium text-gray-900">{selectedStudent.name}</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {selectedStudent && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Student Selected</h4>
              <p className="text-sm text-blue-700">
                You can now manage exercises, progress, and corrections for this student.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onOpenChat && courseId && enrollmentId && (
                <button
                  onClick={onOpenChat}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
              )}
              <button
                onClick={() => onStudentSelect(null)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
