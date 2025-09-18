import React, { useMemo, useState } from 'react';
import { Student } from '../../types/course.types';
import StudentFilterBar from '../common/StudentFilterBar';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableStudents: Student[];
  onEnrollStudent: (studentId: string) => void;
  loading?: boolean;
}

export default function AddStudentModal({ 
  isOpen, 
  onClose, 
  availableStudents, 
  onEnrollStudent,
  loading = false
}: AddStudentModalProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return availableStudents;
    const q = query.toLowerCase();
    return availableStudents.filter(s => {
      const full = `${s.name} ${s.email}`.toLowerCase();
      return full.includes(q) || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [query, availableStudents]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Add Student to Course</h3>

        {availableStudents.length > 0 && (
          <div className="mb-4">
            <StudentFilterBar
              onFilterChange={setQuery}
              placeholder="Search student by name or email..."
              className="w-full"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No available students to enroll.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filtered.map((student) => (
              <div
                key={student._id}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-600">{student.email}</div>
                </div>
                <button
                  onClick={() => onEnrollStudent(student._id)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
                >
                  {loading ? 'Enrolling...' : 'Enroll'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
