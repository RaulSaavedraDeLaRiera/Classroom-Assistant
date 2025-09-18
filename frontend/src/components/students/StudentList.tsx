import React, { useState, useEffect } from 'react';
import { Student } from '../../types/course.types';
import StudentProgress from './StudentProgress';
import StudentFilterBar from '../common/StudentFilterBar';

interface StudentListProps {
  enrolledStudents: Student[];
  courseId: string;
  onAddStudent: () => void;
  onUnenrollStudent: (studentId: string) => void;
  onOpenChatWithStudent?: (studentId: string) => void;
  initialSelectedStudentId?: string | null;
}

export default function StudentList({ enrolledStudents, courseId, onAddStudent, onUnenrollStudent, onOpenChatWithStudent, initialSelectedStudentId = null }: StudentListProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialSelectedStudentId);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(enrolledStudents);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter students based on search query
  const filterStudents = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredStudents(enrolledStudents);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = enrolledStudents.filter(student => {
      const fullName = `${student.name} ${student.email}`.toLowerCase();
      return fullName.includes(searchQuery) || 
             student.name.toLowerCase().includes(searchQuery) ||
             student.email.toLowerCase().includes(searchQuery);
    });
    
    setFilteredStudents(filtered);
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Update filtered students when enrolledStudents changes
  useEffect(() => {
    setFilteredStudents(enrolledStudents);
  }, [enrolledStudents]);

  // Sync external initial selection
  useEffect(() => {
    if (initialSelectedStudentId) {
      setSelectedStudentId(initialSelectedStudentId);
    }
  }, [initialSelectedStudentId]);
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Enrolled Students ({enrolledStudents.length})
        </h3>
        <button
          onClick={onAddStudent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full sm:w-auto"
        >
          Add Student
        </button>
      </div>

      {/* Student Search */}
      {enrolledStudents.length > 0 && (
        <div className="mb-6">
          <StudentFilterBar
            onFilterChange={filterStudents}
            placeholder="Search student by name or email..."
            className="w-full max-w-md"
            showResults={true}
            students={enrolledStudents}
            onStudentSelect={(student) => {
              // Optional: scroll to student or highlight
            }}
          />
        </div>
      )}

      {enrolledStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No students enrolled yet.</p>
          <p className="text-sm mt-2">Click "Add Student" to enroll students in this course.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No students found</p>
          <p className="text-sm">Try another search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div key={student._id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {highlightText(student.name, searchQuery)}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {highlightText(student.email, searchQuery)}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    <span>Role: {student.role}</span>
                    <span>Status: {student.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                  {onOpenChatWithStudent && (
                    <button
                      onClick={() => onOpenChatWithStudent(student._id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs w-full sm:w-auto"
                    >
                      Chat
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedStudentId(selectedStudentId === student._id ? null : student._id)}
                    className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 text-xs w-full sm:w-auto"
                  >
                    {selectedStudentId === student._id ? 'Hide Progress' : 'View Progress'}
                  </button>
                  <button
                    onClick={() => onUnenrollStudent(student._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs w-full sm:w-auto"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {selectedStudentId === student._id && (
                <div className="mt-4">
                  <StudentProgress
                    courseId={courseId}
                    studentId={selectedStudentId}
                    onRefresh={() => {}
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
