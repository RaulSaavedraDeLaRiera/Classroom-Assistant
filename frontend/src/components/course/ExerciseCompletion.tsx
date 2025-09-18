import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface ExerciseCompletionProps {
  courseId: string;
  studentId: string;
  exerciseId: string;
  isCompleted: boolean;
  currentScore?: number;
  maxScore?: number;
  onCompletionChange: (completed: boolean, score?: number) => void;
  disabled?: boolean;
}

export default function ExerciseCompletion({
  courseId,
  studentId,
  exerciseId,
  isCompleted,
  currentScore,
  maxScore = 10,
  onCompletionChange,
  disabled = false
}: ExerciseCompletionProps) {
  const [loading, setLoading] = useState(false);
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [score, setScore] = useState<string>(currentScore?.toString() || '');

  const handleMarkCompleted = async () => {
    if (disabled) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const requestBody: any = {};
      
      if (showScoreInput && score) {
        requestBody.score = parseFloat(score);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/enrollments/${courseId}/students/${studentId}/exercises/${exerciseId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to mark exercise as completed');
      }

      const result = await response.json();
      onCompletionChange(true, requestBody.score);
      setShowScoreInput(false);
    } catch (error) {
      console.error('Error marking exercise as completed:', error);
      alert('Error marking exercise as completed');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotCompleted = async () => {
    if (disabled) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/enrollments/${courseId}/students/${studentId}/exercises/${exerciseId}/uncomplete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark exercise as not completed');
      }

      onCompletionChange(false);
      setScore('');
    } catch (error) {
      console.error('Error marking exercise as not completed:', error);
      alert('Error marking exercise as not completed');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score && !isNaN(parseFloat(score))) {
      handleMarkCompleted();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isCompleted ? (
        <div className="flex items-center gap-2">
          {!showScoreInput && (
            <button
              onClick={() => setShowScoreInput(!showScoreInput)}
              disabled={disabled || loading}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Mark Complete'}
            </button>
          )}
          
          {showScoreInput && (
            <form onSubmit={handleScoreSubmit} className="flex items-center gap-2">
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Score"
                min="0"
                max={maxScore}
                step="0.1"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-xs text-gray-500">/ {maxScore}</span>
              <button
                type="submit"
                disabled={disabled || loading || !score}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowScoreInput(false);
                  setScore('');
                }}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="w-4 h-4" />
            Completed
            {currentScore !== undefined && (
              <span className="font-medium">({currentScore}/{maxScore})</span>
            )}
          </span>
          <button
            onClick={handleMarkNotCompleted}
            disabled={disabled || loading}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Undo'}
          </button>
        </div>
      )}
    </div>
  );
}
