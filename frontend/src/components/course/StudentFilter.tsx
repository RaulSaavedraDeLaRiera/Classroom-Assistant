import React from 'react';
import { StudentAvatar } from '../common/StudentAvatar';
import { Users, Filter, X } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  enrollmentId?: string;
  progress?: number;
  lastExercise?: {
    moduleTitle: string;
    exerciseTitle: string;
    completedAt: string;
  };
}

interface StudentFilterProps {
  students: Student[];
  selectedStudentId: string | null;
  onStudentSelect: (studentId: string | null) => void;
  showAllOption?: boolean;
  className?: string;
}

export const StudentFilter: React.FC<StudentFilterProps> = ({
  students,
  selectedStudentId,
  onStudentSelect,
  showAllOption = true,
  className = ''
}) => {
  const handleStudentClick = (studentId: string | null) => {
    onStudentSelect(studentId);
  };

  const getStudentProgress = (student: Student) => {
    return student.progress || 0;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filter by Student</h3>
        </div>
        {selectedStudentId && (
          <button
            onClick={() => handleStudentClick(null)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
            <span>Clear filter</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* All Students Option */}
        {showAllOption && (
          <div
            className={`
              flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${selectedStudentId === null 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => handleStudentClick(null)}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">All Students</h4>
              <p className="text-sm text-gray-500">View all students' progress</p>
            </div>
            <div className="text-sm text-gray-500">
              {students.length} students
            </div>
          </div>
        )}

        {/* Individual Students */}
        {students.map((student) => (
          <div
            key={student._id}
            className={`
              flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${selectedStudentId === student._id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => handleStudentClick(student._id)}
          >
            <StudentAvatar
              name={student.name}
              size="md"
              isSelected={selectedStudentId === student._id}
              showProgress={true}
              progress={getStudentProgress(student)}
            />
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {student.name}
              </h4>
              <p className="text-sm text-gray-500 truncate">
                {student.email}
              </p>
              {student.lastExercise && (
                <p className="text-xs text-gray-400 truncate">
                  Last: {student.lastExercise.exerciseTitle} in {student.lastExercise.moduleTitle}
                </p>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {Math.round(getStudentProgress(student))}%
              </div>
              <div className="text-xs text-gray-500">complete</div>
            </div>
          </div>
        ))}

        {students.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No students enrolled yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFilter;
