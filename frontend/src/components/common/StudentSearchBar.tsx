import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface StudentSearchBarProps<T = any> {
  students: T[];
  onStudentSelect: (student: T | null) => void;
  selectedStudent: T | null;
  placeholder?: string;
  className?: string;
}

export const StudentSearchBar = <T extends { _id: string; name: string; email: string }>({
  students,
  onStudentSelect,
  selectedStudent,
  placeholder = "Search student...",
  className = ""
}: StudentSearchBarProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<T[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter((student: T) => {
      const fullName = `${student.name} ${student.email}`.toLowerCase();
      return fullName.includes(query) || 
             student.name.toLowerCase().includes(query) ||
             student.email.toLowerCase().includes(query);
    });
    
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(true);
    
    // If input is cleared, clear selection
    if (!value.trim()) {
      onStudentSelect(null);
    }
  };

  // Handle student selection
  const handleStudentSelect = (student: T) => {
    onStudentSelect(student);
    setSearchQuery(student.name);
    setIsOpen(false);
  };

  // Handle clear selection
  const handleClear = () => {
    setSearchQuery('');
    onStudentSelect(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm">
              {searchQuery ? 'No students found' : 'Type to search...'}
            </div>
          ) : (
            <div className="py-1">
              {filteredStudents.map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleStudentSelect(student)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {highlightText(student.name, searchQuery)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {highlightText(student.email, searchQuery)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentSearchBar;
