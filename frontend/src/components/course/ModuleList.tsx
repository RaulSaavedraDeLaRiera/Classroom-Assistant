import React, { useMemo, useCallback, useState } from 'react';
import { CourseModule, CourseExercise } from '../../services/courseApi';
import ExerciseCompletion from './ExerciseCompletion';
import StudentExerciseManagement from '../students/StudentExerciseManagement';
import { downloadExercisePDF } from '../../utils/pdfGenerator';

interface ModuleListProps {
  courseModules: CourseModule[];
  courseExercises: CourseExercise[];
  courseId: string;
  selectedStudentId?: string;
  onMoveModule: (moduleId: string, direction: 'up' | 'down') => void;
  onMoveExercise: (exerciseId: string, direction: 'up' | 'down', getOrderedExercises: (moduleId: string) => CourseExercise[], courseId?: string, selectedStudentId?: string) => void;
  onEditModule: (module: CourseModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onEditExercise: (exercise: CourseExercise) => void;
  onDeleteExercise: (exerciseId: string, courseId?: string, selectedStudentId?: string, moduleId?: string) => void;
  onAddExercise: (moduleId: string) => void;
  editingModule: string | null;
  editModuleData: any;
  onEditModuleDataChange: (data: any) => void;
  onUpdateModule: (moduleId: string) => void;
  onCancelEditModule: () => void;
  onExerciseCompletionChange?: (exerciseId: string, completed: boolean, score?: number) => void;
  onExerciseStatusChange?: (exerciseId: string, newStatus: string) => void;
  onExerciseMaxScoreChange?: (exerciseId: string, newMaxScore: number) => void;
  onModuleStatusChange?: (moduleId: string, status: 'active' | 'inactive') => void;
}

export default function ModuleList({
  courseModules,
  courseExercises,
  courseId,
  selectedStudentId,
  onMoveModule,
  onMoveExercise,
  onEditModule,
  onDeleteModule,
  onEditExercise,
  onDeleteExercise,
  onAddExercise,
  editingModule,
  editModuleData,
  onEditModuleDataChange,
  onUpdateModule,
  onCancelEditModule,
  onExerciseCompletionChange,
  onExerciseStatusChange,
  onExerciseMaxScoreChange,
  onModuleStatusChange
}: ModuleListProps) {
  const [editingMaxScore, setEditingMaxScore] = useState<string | null>(null);
  const [tempMaxScore, setTempMaxScore] = useState<string>('');

  const handleDownloadPDF = (exercise: CourseExercise) => {
    try {
      const exerciseData = {
        title: exercise.title,
        content: exercise.content || 'No content available',
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

  // Memoize sorting functions to avoid recalculations
  const getOrderedModules = useMemo(() => {
    if (!courseModules || courseModules.length === 0) return [];
    
    // Check for duplicate IDs
    const moduleIds = courseModules.map(m => m._id);
    const uniqueIds = new Set(moduleIds);
    if (moduleIds.length !== uniqueIds.size) {
      console.error('Duplicate module IDs found:', moduleIds);
      // Remove duplicates by keeping only the first occurrence
      const seenIds = new Set<string>();
      const deduplicatedModules = courseModules.filter(m => {
        if (seenIds.has(m._id)) {
          return false;
        }
        seenIds.add(m._id);
        return true;
      });
      console.log('Deduplicated modules:', deduplicatedModules.map(m => m._id));
      return deduplicatedModules;
    }

    // Find head module (no previousModuleId)
    const headModule = courseModules.find(m => !m.previousModuleId);
    if (!headModule) {
      console.error('No head module found');
      return courseModules; // Return as-is if no head found
    }

    // Build ordered list starting from head
    const orderedModules: CourseModule[] = [];
    let currentModule: CourseModule | undefined = headModule;
    
    while (currentModule) {
      orderedModules.push(currentModule);
      const nextModule = courseModules.find(m => m.previousModuleId === currentModule!._id);
      currentModule = nextModule;
    }

    console.log('Ordered modules:', orderedModules.map(m => m._id));
    return orderedModules;
  }, [courseModules]);

  // Calculate total points for a module
  const getModuleTotalPoints = useCallback((moduleId: string): number => {
    let moduleExercises;
    
    if (selectedStudentId) {
      // When student is selected, filter by studentModuleId or courseModuleId
      moduleExercises = courseExercises.filter(ex => {
        // For student exercises, check studentModuleId
        if ((ex as any).studentModuleId) {
          return (ex as any).studentModuleId === moduleId;
        }
        // For regular exercises, check courseModuleId
        return ex.courseModuleId === moduleId;
      });
    } else {
      // When no student selected, filter by courseModuleId
      moduleExercises = courseExercises.filter(ex => ex.courseModuleId === moduleId);
    }
    
    return moduleExercises.reduce((total, exercise) => {
      return total + (exercise.maxScore || 10);
    }, 0);
  }, [courseExercises, selectedStudentId]);

  // Calculate total time for a module
  const getModuleTotalTime = useCallback((moduleId: string): number => {
    let moduleExercises;
    
    if (selectedStudentId) {
      // When student is selected, filter by studentModuleId or courseModuleId
      moduleExercises = courseExercises.filter(ex => {
        // For student exercises, check studentModuleId
        if ((ex as any).studentModuleId) {
          return (ex as any).studentModuleId === moduleId;
        }
        // For regular exercises, check courseModuleId
        return ex.courseModuleId === moduleId;
      });
    } else {
      // When no student selected, filter by courseModuleId
      moduleExercises = courseExercises.filter(ex => ex.courseModuleId === moduleId);
    }
    
    return moduleExercises.reduce((total, exercise) => {
      return total + (exercise.estimatedTime || 0);
    }, 0);
  }, [courseExercises, selectedStudentId]);

  const getOrderedExercises = useCallback((moduleId: string): CourseExercise[] => {
    console.log(`getOrderedExercises called for module ${moduleId}:`);

    // Filter exercises for this module
    let moduleExercises;

    if (selectedStudentId) {
      // When student is selected, filter by studentModuleId or courseModuleId
      moduleExercises = courseExercises.filter(ex => {
        // For student exercises, check studentModuleId
        if ((ex as any).studentModuleId) {
          return (ex as any).studentModuleId === moduleId;
        }
        // For regular exercises, check courseModuleId
        return ex.courseModuleId === moduleId;
      });
      console.log(`- Student mode: filtering by studentModuleId or courseModuleId`);
    } else {
      // When no student selected, filter by courseModuleId
      moduleExercises = courseExercises.filter(ex => ex.courseModuleId === moduleId);
      console.log(`- Course mode: filtering by courseModuleId`);
    }

    console.log(`- Total exercises: ${courseExercises.length}`);
    console.log(`- Filtered moduleExercises: ${moduleExercises.length}`);
    console.log(`- Exercises:`, courseExercises);
    console.log(`- Module exercises:`, moduleExercises.map(ex => ex._id || ex._id));

    if (moduleExercises.length === 0) {
      console.log(`- No exercises found for module ${moduleId}`);
      return [];
    }

    // Check for duplicate IDs
    const exerciseIds = moduleExercises.map(ex => ex._id);
    const uniqueIds = new Set(exerciseIds);
    if (exerciseIds.length !== uniqueIds.size) {
      console.error('Duplicate exercise IDs found:', exerciseIds);
      // Remove duplicates by keeping only the first occurrence
      const seenIds = new Set<string>();
      const deduplicatedExercises = moduleExercises.filter(ex => {
        if (seenIds.has(ex._id)) {
          return false;
        }
        seenIds.add(ex._id);
        return true;
      });
      console.log('Deduplicated exercises:', deduplicatedExercises.map(ex => ex._id));
      return deduplicatedExercises;
    }

    // For student exercises, use linked list ordering (same as course exercises)
    if (selectedStudentId) {
      console.log(`[getOrderedExercises] Module ${moduleId}: Sorting ${moduleExercises.length} student exercises by linked list`);
      
      // Find head exercise (no previousExerciseId)
      const headExercise = moduleExercises.find(ex => !ex.previousExerciseId);
      
      if (!headExercise) {
        console.warn(`No head exercise found for student module ${moduleId}, using fallback ordering`);
        // Fallback: return exercises sorted by creation date or ID
        return moduleExercises.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return a._id.localeCompare(b._id);
        });
      }

      // Build ordered list by following the linked list
      const orderedExercises = [];
      const processedIds = new Set();
      let current: any = headExercise;
      
      while (current && !processedIds.has(current._id)) {
        orderedExercises.push(current);
        processedIds.add(current._id);
        
        const nextExercise = moduleExercises.find(ex => 
          ex.previousExerciseId && ex.previousExerciseId.toString() === current._id.toString()
        );
        current = nextExercise || null;
      }

      // Add any remaining exercises that weren't in the linked list (orphaned exercises)
      const orphanedExercises = moduleExercises.filter(ex => !processedIds.has(ex._id));
      if (orphanedExercises.length > 0) {
        console.warn(`Found ${orphanedExercises.length} orphaned exercises in module ${moduleId}, adding them to the end`);
        orderedExercises.push(...orphanedExercises);
      }
      
      console.log(`[getOrderedExercises] Student exercises sorted by linked list:`, orderedExercises.map(ex => ({ 
        id: ex._id, 
        title: ex.title, 
        prev: ex.previousExerciseId,
        next: ex.nextExerciseId
      })));
      return orderedExercises;
    }

    // Find head exercise (no previousExerciseId)
    const headExercise = moduleExercises.find(ex => !ex.previousExerciseId);
    if (!headExercise) {
      console.error(`No head exercise found for module ${moduleId}`);
      return moduleExercises; // Return as-is if no head found
    }

    // Build ordered list starting from head
    const orderedExercises: CourseExercise[] = [];
    let currentExercise: CourseExercise | undefined = headExercise;

    while (currentExercise) {
      orderedExercises.push(currentExercise);
      const nextExercise = moduleExercises.find(ex => ex.previousExerciseId === currentExercise!._id);
      currentExercise = nextExercise;
    }

    console.log(`Module ${moduleId}: Ordered ${orderedExercises.length} exercises from ${moduleExercises.length} total`);

    // Final validation
    if (orderedExercises.length !== moduleExercises.length) {
      console.error(`Mismatch: ordered ${orderedExercises.length} but should have ${moduleExercises.length}`);
    }

    return orderedExercises;
  }, [courseExercises]);

  if (!courseModules || courseModules.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">No modules available.</p>
        <p className="text-sm mt-2">Add modules to organize your course content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {getOrderedModules.map((module, index) => (
        <div key={module._id} className="bg-white border border-gray-200 rounded-lg p-6">
          {editingModule === module._id ? (
            // Edit mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module Title</label>
                <input
                  type="text"
                  value={editModuleData.title || ''}
                  onChange={(e) => onEditModuleDataChange({...editModuleData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editModuleData.description || ''}
                  onChange={(e) => onEditModuleDataChange({...editModuleData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onUpdateModule(module._id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEditModule}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-gray-600 mt-1">{module.description}</p>
                  <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                    <span>Type: {module.type}</span>
                    <span>Time: {getModuleTotalTime(module._id)} min</span>
                    <span>Status: {module.status}</span>
                    <span className="font-medium text-blue-600">
                      Total Points: {getModuleTotalPoints(module._id)}
                    </span>
                  </div>
                  
                  {/* Module Status Control - only show when no student is selected */}
                  {!selectedStudentId && onModuleStatusChange && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Module Status:</span>
                        <select
                          value={module.status}
                          onChange={(e) => onModuleStatusChange(module._id, e.target.value as 'active' | 'inactive')}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="inactive">Inactive</option>
                          <option value="active">Active</option>
                        </select>
                        <span className="text-xs text-gray-500">
                          {module.status === 'active' 
                            ? 'Students can access exercises' 
                            : 'Students cannot access exercises'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  {/* Only show reorder buttons when no student is selected */}
                  {!selectedStudentId && (
                    <>
                      <button
                        onClick={() => onMoveModule(module._id, 'up')}
                        disabled={index === 0}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50 px-2 py-1 border rounded text-xs"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => onMoveModule(module._id, 'down')}
                        disabled={index === getOrderedModules.length - 1}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50 px-2 py-1 border rounded text-xs"
                      >
                        ↓
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onEditModule(module)}
                    className="text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-600 rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteModule(module._id)}
                    className="text-red-600 hover:text-red-800 px-2 py-1 border border-red-600 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Exercises */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-800">Exercises</h4>
                  <button
                    onClick={() => onAddExercise(module._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Add Exercise
                  </button>
                </div>

                {getOrderedExercises(module._id).length === 0 ? (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    No exercises available for this module.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getOrderedExercises(module._id).map((exercise, exIndex) => (
                      <div key={exercise._id}>
                        <div className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-center gap-2">
                              <div className="font-medium text-gray-900 line-clamp-2 leading-tight text-center flex-1">{exercise.title}</div>
                              {selectedStudentId && !(exercise as any).courseExerciseId && (
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                  Extra
                                </span>
                              )}
                            </div>
                            <div className="text-gray-600 text-sm mt-1">{exercise.description || 'No description available'}</div>
                            <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                              <span>Type: {exercise.type}</span>
                              <span>Difficulty: {exercise.difficulty}</span>
                              <span>Time: {exercise.estimatedTime} min</span>
                              {!selectedStudentId && (
                                <div className="flex items-center gap-1">
                                  <span>Max Score:</span>
                                  {editingMaxScore === exercise._id ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={tempMaxScore}
                                        onChange={(e) => setTempMaxScore(e.target.value)}
                                        min="1"
                                        max="100"
                                        className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                      <button
                                        onClick={() => {
                                          const newMaxScore = parseInt(tempMaxScore);
                                          if (newMaxScore >= 1 && newMaxScore <= 100 && onExerciseMaxScoreChange) {
                                            onExerciseMaxScoreChange(exercise._id, newMaxScore);
                                            setEditingMaxScore(null);
                                          }
                                        }}
                                        className="px-1 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingMaxScore(null);
                                          setTempMaxScore('');
                                        }}
                                        className="px-1 py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium text-blue-600">{exercise.maxScore || 10}</span>
                                      <button
                                        onClick={() => {
                                          setEditingMaxScore(exercise._id);
                                          setTempMaxScore((exercise.maxScore || 10).toString());
                                        }}
                                        className="px-1 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => onMoveExercise(exercise._id, 'up', getOrderedExercises, courseId, selectedStudentId)}
                              disabled={exIndex === 0}
                              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 px-2 py-1 border rounded text-xs"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => onMoveExercise(exercise._id, 'down', getOrderedExercises, courseId, selectedStudentId)}
                              disabled={exIndex === getOrderedExercises(module._id).length - 1}
                              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 px-2 py-1 border rounded text-xs"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(exercise)}
                              className="text-green-600 hover:text-green-800 px-2 py-1 border border-green-600 rounded text-xs"
                              title="Download exercise as PDF"
                            >
                              Download PDF
                            </button>
                            <button
                              onClick={() => onEditExercise(exercise)}
                              className="text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-600 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteExercise(exercise._id, selectedStudentId ? courseId : undefined, selectedStudentId, selectedStudentId ? module._id : undefined)}
                              className="text-red-600 hover:text-red-800 px-2 py-1 border border-red-600 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Student Exercise Management - Only show if a student is selected */}
                        {selectedStudentId && (
                          <StudentExerciseManagement
                            courseId={courseId}
                            studentId={selectedStudentId}
                            exerciseId={exercise._id}
                            exerciseTitle={exercise.title}
                            isCompleted={selectedStudentId ? (exercise as any).status === 'completed' : false}
                            exerciseStatus={selectedStudentId ? (exercise as any).status : 'pending'}
                            currentScore={selectedStudentId ? (exercise as any).score : undefined}
                            maxScore={exercise.maxScore || 10}
                            hasCourseExercise={!!(exercise as any).courseExerciseId}
                            onCompletionChange={(completed, score) => {
                              console.log(`Exercise ${exercise._id} marked as ${completed ? 'completed' : 'not completed'} with score:`, score);
                              if (onExerciseCompletionChange) {
                                onExerciseCompletionChange(exercise._id, completed, score);
                              }
                            }}
                            onStatusChange={onExerciseStatusChange}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
