import React, { useState, useRef, useEffect } from 'react';

interface ExerciseStatusControlProps {
  courseId: string;
  studentId: string;
  exerciseId: string;
  exerciseTitle: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export default function ExerciseStatusControl({
  courseId,
  studentId,
  exerciseId,
  exerciseTitle,
  currentStatus,
  onStatusChange,
  disabled = false
}: ExerciseStatusControlProps) {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/${courseId}/students/${studentId}/exercises/${exerciseId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update exercise status: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Exercise status updated:', result);
      
      onStatusChange(newStatus);
      setShowDropdown(false); // Close dropdown after successful update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating exercise status');
      console.error('Error updating exercise status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'reviewed':
        return 'Reviewed';
      default:
        return status;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Exercise Status:</span>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={loading || disabled}
          className={`text-xs font-medium px-2 py-1 rounded-full transition-colors hover:opacity-80 disabled:opacity-50 ${getStatusColor(currentStatus)}`}
        >
          {loading ? 'Updating...' : getStatusLabel(currentStatus)}
        </button>
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>
      
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
            <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
              <div className="text-xs text-gray-500">Auto-managed:</div>
              <div className="text-xs text-gray-400">In Progress</div>
              <div className="text-xs text-gray-400">Completed</div>
              <div className="text-xs text-gray-400">Reviewed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
