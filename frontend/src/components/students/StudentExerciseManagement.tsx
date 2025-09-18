import React, { useState, useEffect } from 'react';
import ExerciseCompletion from '../course/ExerciseCompletion';
import ExerciseStatusControl from './ExerciseStatusControl';
import { CorrectionPreview } from './CorrectionEditor';
import TeacherService from '../../services/teacher.service';
import CoursesService from '../../services/courses.service';

interface StudentExerciseManagementProps {
  courseId: string;
  studentId: string;
  exerciseId: string;
  exerciseTitle: string;
  isCompleted: boolean;
  exerciseStatus?: string; // Add exercise status prop
  currentScore?: number;
  maxScore?: number;
  hasCourseExercise?: boolean; // If exercise has courseExerciseId (not editable)
  onCompletionChange: (completed: boolean, score?: number) => void;
  onStatusChange?: (exerciseId: string, newStatus: string) => void;
  disabled?: boolean;
}

export default function StudentExerciseManagement({
  courseId,
  studentId,
  exerciseId,
  exerciseTitle,
  isCompleted,
  exerciseStatus = 'pending',
  currentScore,
  maxScore = 10,
  hasCourseExercise = false,
  onCompletionChange,
  onStatusChange,
  disabled = false
}: StudentExerciseManagementProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [editingMaxScore, setEditingMaxScore] = useState(false);
  const [tempMaxScore, setTempMaxScore] = useState(maxScore.toString());
  const [showCorrectionPreview, setShowCorrectionPreview] = useState(false);
  const [exerciseContent, setExerciseContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  // Load exercise content when component mounts
  useEffect(() => {
    console.log(`[StudentExerciseManagement] Loading exercise content for exerciseId: ${exerciseId}, courseId: ${courseId}`);

    const loadExerciseContent = async () => {
      try {
        setLoadingContent(true);

        // For student exercises, we need to get the student exercise content (with professor corrections)
        // The exerciseId passed is the student exercise ID, not the course exercise ID

        // 1. Get student exercise by ID
        const { courseApiService } = await import('../../services/courseApi');
        const studentExercise = await courseApiService.getStudentExerciseById(courseId, exerciseId);

        // 2. Use the student exercise content (which includes professor corrections)
        // If no content in student exercise, fall back to original course exercise
        if (studentExercise.content && studentExercise.content.trim() !== '') {
          setExerciseContent(studentExercise.content);
        } else if (studentExercise.courseExerciseId) {
          const coursesService = CoursesService.getInstance();
          // Extract the ID from the populated object or use the string directly
          const courseExerciseId = typeof studentExercise.courseExerciseId === 'object' 
            ? studentExercise.courseExerciseId._id || studentExercise.courseExerciseId.id
            : studentExercise.courseExerciseId;
          const courseExercise = await coursesService.getCourseExerciseById(courseExerciseId);
          setExerciseContent(courseExercise.content || 'No content available');
        } else {
          setExerciseContent('No associated course exercise found');
        }

      } catch (error) {
        console.error('Error loading student exercise content:', error);
        setExerciseContent('Error loading exercise content');
      } finally {
        setLoadingContent(false);
      }
    };

    if (exerciseId) {
      loadExerciseContent();
    }
  }, [exerciseId]); // Removed courseId dependency to prevent unnecessary re-executions

  return (
    <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-semibold text-blue-900">Student Exercise Management</h4>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {exerciseTitle}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {onStatusChange ? (
              <ExerciseStatusControl
                courseId={courseId}
                studentId={studentId}
                exerciseId={exerciseId}
                exerciseTitle={exerciseTitle}
                currentStatus={exerciseStatus}
                onStatusChange={(newStatus) => onStatusChange(exerciseId, newStatus)}
                disabled={disabled}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">Status:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  isCompleted 
                    ? 'bg-green-100 text-green-800' 
                    : exerciseStatus === 'ready'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isCompleted ? 'Completed' : exerciseStatus === 'ready' ? 'Ready' : 'Pending'}
                </span>
              </div>
            )}
            
            {isCompleted && currentScore !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">Score:</span>
                <span className="text-sm font-medium text-blue-900">
                  {currentScore}/{maxScore} ({Math.round((currentScore / maxScore) * 100)}%)
                </span>
              </div>
            )}
            
            {!isCompleted && !hasCourseExercise && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">Max Score:</span>
                {editingMaxScore ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempMaxScore}
                      onChange={(e) => setTempMaxScore(e.target.value)}
                      min="1"
                      max="100"
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newMaxScore = parseInt(tempMaxScore);
                        if (newMaxScore >= 1 && newMaxScore <= 100) {
                          // TODO: Update maxScore in backend for manual exercises
                          setEditingMaxScore(false);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setTempMaxScore(maxScore.toString());
                        setEditingMaxScore(false);
                      }}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-900">{maxScore}</span>
                    <button
                      onClick={() => setEditingMaxScore(true)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {!isCompleted && hasCourseExercise && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">Max Score:</span>
                <span className="text-sm font-medium text-blue-900">{maxScore}</span>
                <span className="text-xs text-gray-500">(from course exercise)</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showDetails ? 'Hide' : 'Manage'}
          </button>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Exercise Actions</h5>
              <p className="text-xs text-blue-700 mb-3">
                Mark this exercise as completed or reset it for the student.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <ExerciseCompletion
                courseId={courseId}
                studentId={studentId}
                exerciseId={exerciseId}
                isCompleted={isCompleted}
                currentScore={currentScore}
                maxScore={maxScore}
                onCompletionChange={onCompletionChange}
                disabled={disabled}
              />
              
              <button
                onClick={() => {
                  if (exerciseContent && exerciseContent !== 'No content available' && exerciseContent !== 'Error loading exercise content') {
                    setShowCorrectionPreview(true);
                  }
                }}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                title="Open correction view to provide feedback and grade student work"
                disabled={loadingContent || !exerciseContent || exerciseContent === 'No content available' || exerciseContent === 'Error loading exercise content'}
              >
                {loadingContent ? 'Loading...' : 'Grade & Evaluate'}
              </button>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-white rounded border border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium text-gray-700">Exercise ID:</span>
                <span className="ml-2 text-gray-600 font-mono">{exerciseId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Student ID:</span>
                <span className="ml-2 text-gray-600 font-mono">{studentId}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Correction Preview Modal */}
      {showCorrectionPreview && exerciseContent && exerciseContent !== 'No content available' && exerciseContent !== 'Error loading exercise content' && (
        <CorrectionPreview
          content={exerciseContent}
          onSave={async (correctedContent) => {
            try {
              console.log('Saving corrected content for student:', correctedContent);

              // Save to student exercise using the new API method
              const { courseApiService } = await import('../../services/courseApi');
              await courseApiService.updateStudentExerciseContent(courseId, exerciseId, correctedContent);

              // Update local state
              setExerciseContent(correctedContent);
              setShowCorrectionPreview(false);

              console.log('Student exercise content saved successfully');
            } catch (error) {
              console.error('Error saving corrected content:', error);
              alert('Error saving corrected content. Please try again.');
            }
          }}
          onCancel={() => setShowCorrectionPreview(false)}
          isOpen={true}
        />
      )}
    </div>
  );
}
