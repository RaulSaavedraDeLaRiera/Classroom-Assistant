import React, { useState, useEffect } from 'react';
import ExerciseCompletion from '../course/ExerciseCompletion';
import { CorrectionPreview } from './CorrectionEditor';
import { CourseExercise } from '../../services/courseApi';
import CoursesService from '../../services/courses.service';
import { downloadExercisePDF } from '../../utils/pdfGenerator';

interface StudentExerciseUnitProps {
  exercise: CourseExercise;
  courseId: string;
  selectedStudentId?: string;
  studentExerciseStatus?: 'pending' | 'ready' | 'completed' | 'reviewed' | 'in_progress' | 'not_started';
  studentScore?: number;
  exIndex: number;
  totalExercises: number;
  onMoveExercise: (exerciseId: string, direction: 'up' | 'down', getOrderedExercises: any, courseId: string, selectedStudentId?: string) => void;
  onEditExercise: (exercise: CourseExercise) => void;
  onDeleteExercise: (exerciseId: string, courseId?: string, selectedStudentId?: string, moduleId?: string) => void;
  onExerciseStatusChange?: (exerciseId: string, newStatus: string) => void;
  onExerciseCompletionChange?: (exerciseId: string, completed: boolean, score?: number) => void;
  getOrderedExercises: (moduleId: string) => CourseExercise[];
  moduleId: string;
}

export default function StudentExerciseUnit({
  exercise,
  courseId,
  selectedStudentId,
  studentExerciseStatus = 'pending',
  studentScore,
  exIndex,
  totalExercises,
  onMoveExercise,
  onEditExercise,
  onDeleteExercise,
  onExerciseStatusChange,
  onExerciseCompletionChange,
  getOrderedExercises,
  moduleId
}: StudentExerciseUnitProps) {
  const [showCorrectionPreview, setShowCorrectionPreview] = useState(false);
  const [exerciseContent, setExerciseContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  // Load exercise content when component mounts
  useEffect(() => {
    if (selectedStudentId && exercise._id) {
      loadExerciseContent();
    }
  }, [selectedStudentId, exercise._id]);

  const loadExerciseContent = async () => {
    try {
      setLoadingContent(true);
      
      // Get student exercise by ID
      const { courseApiService } = await import('../../services/courseApi');
      const studentExercise = await courseApiService.getStudentExerciseById(courseId, exercise._id);

      // Use the student exercise content (which includes professor corrections)
      if (studentExercise.content && studentExercise.content.trim() !== '') {
        setExerciseContent(studentExercise.content);
      } else if (studentExercise.courseExerciseId) {
        const coursesService = CoursesService.getInstance();
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

  const getStatusColor = (status: 'pending' | 'ready' | 'completed' | 'reviewed' | 'in_progress' | 'not_started') => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
      default:
        return 'bg-gray-300 text-gray-900';
    }
  };

  const getStatusLabel = (status: 'pending' | 'ready' | 'completed' | 'reviewed' | 'in_progress' | 'not_started') => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'reviewed':
        return 'Reviewed';
      case 'ready':
        return 'Ready';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const handleDownloadPDF = () => {
    try {
      const exerciseData = {
        title: exercise.title,
        content: exerciseContent || exercise.content || 'No content available',
        type: exercise.type,
        difficulty: exercise.difficulty,
        estimatedTime: exercise.estimatedTime,
        maxScore: exercise.maxScore || 10,
        description: exercise.description
      };

      downloadExercisePDF(exerciseData, {
        includeMetadata: true,
        includeInstructions: true
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-center gap-2">
                <div className="font-medium text-gray-900 line-clamp-2 leading-tight text-center flex-1">{exercise.title}</div>
                
                {/* Exercise Type Indicator */}
                {selectedStudentId && (exercise as any).isExtra && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                    Extra
                  </span>
                )}
                
                {/* Status */}
                {selectedStudentId && (
                  <span 
                    onClick={() => {
                      if (onExerciseStatusChange) {
                        const newStatus = studentExerciseStatus === 'not_started' ? 'pending' :
                                        studentExerciseStatus === 'pending' ? 'ready' : 
                                        studentExerciseStatus === 'ready' ? 'in_progress' :
                                        studentExerciseStatus === 'in_progress' ? 'completed' :
                                        studentExerciseStatus === 'completed' ? 'reviewed' : 'not_started';
                        onExerciseStatusChange(exercise._id, newStatus);
                      }
                    }}
                    className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(studentExerciseStatus)}`}
                    title="Click to change status: Not Started → Pending → Ready → In Progress → Completed → Reviewed → Not Started"
                  >
                    {getStatusLabel(studentExerciseStatus)}
                  </span>
                )}
                
                {/* Points/Score */}
                {selectedStudentId && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Points:</span>
                    {studentExerciseStatus === 'completed' && studentScore !== undefined ? (
                      <span className="text-xs font-medium text-green-700">
                        {studentScore}/{exercise.maxScore || 10}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-700">{exercise.maxScore || 10}</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-gray-600 text-sm mt-1">{exercise.description || 'No description available'}</div>
              <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                <span>Type: {exercise.type}</span>
                <span>Difficulty: {exercise.difficulty}</span>
                <span>Time: {exercise.estimatedTime || 0} min</span>
                {!selectedStudentId && (
                  <div className="flex items-center gap-1">
                    <span>Points:</span>
                    <span className="text-xs font-medium text-gray-700">{exercise.maxScore || 10}</span>
                    <button
                      onClick={async () => {
                        const newScore = prompt('Enter new max score:', (exercise.maxScore || 10).toString());
                        if (newScore && !isNaN(parseInt(newScore))) {
                          const score = parseInt(newScore);
                          if (score >= 1 && score <= 100) {
                            try {
                              const response = await fetch(`/api/courses/${courseId}/exercises/${exercise._id}/max-score`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                },
                                body: JSON.stringify({ maxScore: score })
                              });
                              
                              if (response.ok) {
                                console.log(`Exercise ${exercise._id} maxScore updated to ${score}`);
                              } else {
                                console.error('Failed to update exercise maxScore');
                              }
                            } catch (error) {
                              console.error('Error updating exercise maxScore:', error);
                            }
                          } else {
                            alert('Score must be between 1 and 100');
                          }
                        }
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2 ml-4">
          {/* Top buttons: Edit, Delete, Reorder */}
          <div className="flex space-x-2">
            <button
              onClick={() => onMoveExercise(exercise._id, 'up', getOrderedExercises, courseId, selectedStudentId)}
              disabled={exIndex === 0}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 px-2 py-1 border rounded text-xs"
            >
              ↑
            </button>
            <button
              onClick={() => onMoveExercise(exercise._id, 'down', getOrderedExercises, courseId, selectedStudentId)}
              disabled={exIndex === totalExercises - 1}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 px-2 py-1 border rounded text-xs"
            >
              ↓
            </button>
            <button
              onClick={() => onEditExercise(exercise)}
              className="text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-600 rounded text-xs"
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteExercise(exercise._id, selectedStudentId ? courseId : undefined, selectedStudentId, selectedStudentId ? moduleId : undefined)}
              className="text-red-600 hover:text-red-800 px-2 py-1 border border-red-600 rounded text-xs"
            >
              Delete
            </button>
          </div>
          
          {/* Download PDF button - below Edit/Delete */}
          <button
            onClick={handleDownloadPDF}
            className="text-green-600 hover:text-green-800 px-2 py-1 border border-green-600 rounded text-xs w-fit"
            title="Download exercise as PDF"
          >
            Download PDF
          </button>
          
          {/* Bottom buttons: Student Action Buttons - Only show if a student is selected */}
          {selectedStudentId && (() => {
            const isEditable = studentExerciseStatus === 'pending' || studentExerciseStatus === 'ready' || studentExerciseStatus === 'in_progress';
            
            return isEditable ? (
              <div className="flex space-x-2">
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
                  {loadingContent ? 'Loading...' : 'Correct'}
                </button>
                <ExerciseCompletion
                  courseId={courseId}
                  studentId={selectedStudentId}
                  exerciseId={exercise._id}
                  isCompleted={(studentExerciseStatus as string) === 'completed' || (studentExerciseStatus as string) === 'reviewed'}
                  currentScore={studentScore}
                  maxScore={exercise.maxScore || 10}
                  onCompletionChange={(completed, score) => {
                    console.log(`Exercise ${exercise._id} marked as ${completed ? 'completed' : 'not completed'} with score:`, score);
                    if (onExerciseCompletionChange) {
                      onExerciseCompletionChange(exercise._id, completed, score);
                    }
                  }}
                  disabled={false}
                />
              </div>
            ) : null;
          })()}
        </div>
      </div>
      
      {/* Correction Preview Modal */}
      {showCorrectionPreview && exerciseContent && exerciseContent !== 'No content available' && exerciseContent !== 'Error loading exercise content' && (
        <CorrectionPreview
          content={exerciseContent}
          onSave={async (correctedContent) => {
            try {
              console.log('Saving corrected content for student:', correctedContent);

              // Save to student exercise using the new API method
              const { courseApiService } = await import('../../services/courseApi');
              await courseApiService.updateStudentExerciseContent(courseId, exercise._id, correctedContent);

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
