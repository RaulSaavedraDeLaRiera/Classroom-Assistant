import React, { useState, useRef, useEffect } from 'react';

interface ModuleStatusControlProps {
  courseId: string;
  studentId: string;
  moduleId: string;
  moduleTitle: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export default function ModuleStatusControl({
  courseId,
  studentId,
  moduleId,
  moduleTitle,
  currentStatus,
  onStatusChange,
  disabled = false
}: ModuleStatusControlProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/courses/${courseId}/students/${studentId}/modules/${moduleId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update module status: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Module status updated:', result);
      
      onStatusChange(newStatus);
      setShowDropdown(false); // Close dropdown after successful update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating module status');
      console.error('Error updating module status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'ready':
        return 'Ready';
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading || disabled}
        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors hover:opacity-80 disabled:opacity-50 ${getStatusColor(currentStatus)}`}
      >
        {loading ? 'Updating...' : getStatusLabel(currentStatus)}
      </button>
      {error && (
        <span className="text-xs text-red-600 ml-2">{error}</span>
      )}
      
      {showDropdown && (
        <div className="absolute top-8 left-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px]">
          <div className="py-1">
            <button
              onClick={() => handleStatusChange('pending')}
              disabled={loading || disabled || currentStatus === 'pending'}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 disabled:opacity-50 ${
                currentStatus === 'pending' ? 'bg-yellow-50 text-yellow-800' : 'text-gray-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusChange('ready')}
              disabled={loading || disabled || currentStatus === 'ready'}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 disabled:opacity-50 ${
                currentStatus === 'ready' ? 'bg-blue-50 text-blue-800' : 'text-gray-700'
              }`}
            >
              Ready
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={loading || disabled || currentStatus === 'completed'}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 disabled:opacity-50 ${
                currentStatus === 'completed' ? 'bg-green-50 text-green-800' : 'text-gray-700'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => handleStatusChange('in_progress')}
              disabled={loading || disabled || currentStatus === 'in_progress'}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 disabled:opacity-50 ${
                currentStatus === 'in_progress' ? 'bg-orange-50 text-orange-800' : 'text-gray-700'
              }`}
            >
              In Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
