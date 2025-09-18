import React, { useState, useEffect } from 'react';

interface StudentProgressData {
  progress: number;
  totalExercises: number;
  completedExercises: number;
  totalModules: number;
  completedModules: number;
  averageScore: number;
  totalPoints: number;
  earnedPoints: number;
  exerciseScores: number[];
  completedExerciseIds: string[];
  completedModuleIds: string[];
}

interface StudentProgressProps {
  courseId: string;
  studentId: string;
  onRefresh?: () => void;
}

export default function StudentProgress({ courseId, studentId, onRefresh: _onRefresh }: StudentProgressProps) {
  const [progressData, setProgressData] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      console.log('[Frontend] Fetching progress for:', { courseId, studentId, token: token ? 'exists' : 'missing' });
      
      const response = await fetch(`/api/courses/enrollments/${courseId}/students/${studentId}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Frontend] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('[Frontend] Error response:', errorText);
        throw new Error(`Failed to fetch student progress: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[Frontend] Progress data received:', data);
      setProgressData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading progress');
      console.error('Error fetching student progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && studentId) {
      fetchProgress();
    }
  }, [courseId, studentId]);

  // Removed manual update and enrollment check actions for a cleaner UI

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Error loading progress</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={fetchProgress}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No progress data available</p>
      </div>
    );
  }

  const exerciseProgressPercentage = progressData.totalExercises > 0 
    ? Math.round((progressData.completedExercises / progressData.totalExercises) * 100)
    : 0;

  const moduleProgressPercentage = progressData.totalModules > 0 
    ? Math.round((progressData.completedModules / progressData.totalModules) * 100)
    : 0;

  const gradePercentage = progressData.totalPoints > 0 
    ? Math.round((progressData.earnedPoints / progressData.totalPoints) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Student Progress</h3>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-blue-600">{progressData.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressData.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Exercises */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Exercises</h4>
            <span className="text-xs text-gray-500">{exerciseProgressPercentage}%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progressData.completedExercises}/{progressData.totalExercises}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exerciseProgressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Modules */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Modules</h4>
            <span className="text-xs text-gray-500">{moduleProgressPercentage}%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progressData.completedModules}/{progressData.totalModules}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${moduleProgressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Average Score</h4>
            <span className="text-xs text-gray-500">Normalized</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progressData.averageScore.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressData.averageScore}%` }}
            ></div>
          </div>
        </div>

        {/* Points */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Points</h4>
            <span className="text-xs text-gray-500">{gradePercentage}%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progressData.earnedPoints}/{progressData.totalPoints}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${gradePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Exercise Scores Detail */}
      {progressData.exerciseScores.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Exercise Scores</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {progressData.exerciseScores.map((score, index) => (
              <div
                key={index}
                className={`p-2 rounded text-center text-xs font-medium ${
                  score >= 80 ? 'bg-green-100 text-green-800' :
                  score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  score > 0 ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-500'
                }`}
                title={`Exercise ${index + 1}: ${score.toFixed(1)}%`}
              >
                {score > 0 ? `${score.toFixed(0)}%` : 'N/A'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
