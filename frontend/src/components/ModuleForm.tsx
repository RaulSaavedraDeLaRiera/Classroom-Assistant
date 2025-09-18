import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TeacherService from '../services/teacher.service';
import TemplatesService from '../services/templates.service';

interface ModuleFormProps {
  moduleId?: string;
  initialData?: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  context?: 'admin' | 'teacher'; // Add context prop to differentiate between admin and teacher
}

interface Exercise {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number;
  tags: string[];
}

export default function ModuleForm({ moduleId, initialData, onSave, onCancel, context = 'teacher' }: ModuleFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    estimatedTime: 0,
    selectedExercises: [] as string[],
    status: 'active', // Add status field for admin context
    type: 'all' // Add type field for module progression
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        tags: initialData.tags || [],
        estimatedTime: initialData.estimatedTime || initialData.estimatedDuration || 0,
        selectedExercises: initialData.content?.exercises || [],
        status: initialData.status || 'active',
        type: initialData.type || 'all',
      });
    }
    // Load available exercises for selection based on context
    loadExercises();
  }, [initialData, context]);

  const loadExercises = async () => {
    try {
      let exercisesData: any[] = [];
      
      if (context === 'admin') {
        // Admin sees all template exercises
        const templatesService = TemplatesService.getInstance();
        exercisesData = await templatesService.getTemplateExercises();
      } else {
        // Teacher sees their own exercises
        const teacherService = TeacherService.getInstance();
        exercisesData = await teacherService.getTeacherExercises();
        
        // If editing a module, also include exercises that are already in the module
        if (initialData && initialData.content?.exercises && initialData.content.exercises.length > 0) {

          
          // Get exercises that are already in the module but might not be in the available exercises list
          try {
            const teacherService = TeacherService.getInstance();
            const moduleExercises = await Promise.all(
              initialData.content.exercises.map(async (exerciseId: string) => {
                try {
                  const exercise = await teacherService.getTeacherExerciseById(exerciseId);
                  return {
                    _id: exercise._id,
                    title: exercise.title,
                    description: exercise.description || '',
                    estimatedTime: exercise.estimatedTime || 0,
                    tags: exercise.tags || []
                  };
                } catch (error) {
                  console.error(`Error loading module exercise ${exerciseId}:`, error);
                  return null;
                }
              })
            );
            
            // Filter out null values and avoid duplicates
            const validModuleExercises = moduleExercises.filter(ex => ex !== null);
            
            // Only add exercises that are not already in exercisesData
            const newExercises = validModuleExercises.filter(
              moduleEx => !exercisesData.some(existingEx => existingEx._id === moduleEx._id)
            );
            
            exercisesData = [...exercisesData, ...newExercises];

          } catch (error) {
            console.error('Error loading module exercises:', error);
          }
        }
      }
      
      setExercises(exercisesData.map((ex: any) => ({
        _id: ex._id,
        title: ex.title,
        description: ex.description || '',
        estimatedTime: ex.estimatedTime || 0,
        tags: ex.tags || []
      })));
    } catch (error) {
      console.error('Error loading exercises:', error);
      // Fallback to empty array if loading fails
      setExercises([]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleExerciseToggle = (exerciseId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedExercises.includes(exerciseId);
      const newSelected = isSelected
        ? prev.selectedExercises.filter(id => id !== exerciseId)
        : [...prev.selectedExercises, exerciseId];
      
      // Calculate total time
      const totalTime = exercises
        .filter(ex => newSelected.includes(ex._id))
        .reduce((sum, ex) => sum + ex.estimatedTime, 0);
      
      return {
        ...prev,
        selectedExercises: newSelected,
        estimatedTime: totalTime
      };
    });
  };

  const moveExerciseUp = (index: number) => {
    if (index === 0) return; // Can't move first item up
    
    setFormData(prev => {
      const newSelected = [...prev.selectedExercises];
      const temp = newSelected[index];
      newSelected[index] = newSelected[index - 1];
      newSelected[index - 1] = temp;
      
      return {
        ...prev,
        selectedExercises: newSelected
      };
    });
  };

  const moveExerciseDown = (index: number) => {
    if (index === formData.selectedExercises.length - 1) return; // Can't move last item down
    
    setFormData(prev => {
      const newSelected = [...prev.selectedExercises];
      const temp = newSelected[index];
      newSelected[index] = newSelected[index + 1];
      newSelected[index + 1] = temp;
      
      return {
        ...prev,
        selectedExercises: newSelected
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (onSave) {
        // Prepare data according to context - always use minutes
        const dataToSave = {
          ...formData,
          // Both admin and teacher contexts now use estimatedTime in minutes
          estimatedTime: formData.estimatedTime,
          // Always use content.exercises structure for consistency
          content: { exercises: formData.selectedExercises }
        };
        
        console.log('Submitting module data:', dataToSave);
        await onSave(dataToSave);
      } else {
        // Default save behavior
    
        // Redirect based on context
        if (context === 'admin') {
          router.push('/admin/templates?tab=modules');
        } else {
          router.push('/teacher/creator?tab=modules');
        }
      }
    } catch (error) {
      console.error('Error saving module:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Module Information</h3>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md">
            {formData.tags.map((tag, index) => (
              <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="ml-1 text-blue-800 hover:text-blue-900 focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd();
                  }
                }}
                className="flex-1 px-1 py-0.5 bg-transparent focus:outline-none"
                placeholder="Add tags (press Enter to add)"
              />
              <button
                type="button"
                onClick={handleTagAdd}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Module Type Selection */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Module Type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => {
              console.log('Type changed to:', e.target.value);
              handleInputChange('type', e.target.value);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          >
            <option value="all">All Exercises Available</option>
            <option value="progress">Progressive Unlock</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {formData.type === 'all' 
              ? 'All exercises in this module will be available to students immediately'
              : 'Only the first exercise will be available initially. Students must complete exercises in order to unlock the next ones'
            }
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Current type: {formData.type} | Context: {context}
          </p>
        </div>

        {/* Status field only for admin context */}
        {context === 'admin' && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}

      </div>

      {/* Exercise Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Exercise Selection</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">
            {context === 'admin' 
              ? 'Select exercises to include in this module template. The total estimated time will be calculated automatically.'
              : 'Select your exercises to include in this module. The total estimated time will be calculated automatically.'
            }
          </p>
          
          {exercises.length > 0 ? (
            <div className="space-y-2">
              {exercises.map((exercise) => (
                <div key={exercise._id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`exercise-${exercise._id}`}
                    checked={formData.selectedExercises.includes(exercise._id)}
                    onChange={() => handleExerciseToggle(exercise._id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor={`exercise-${exercise._id}`} className="flex-1 text-sm text-gray-900">
                    <span className="font-medium">{exercise.title}</span>
                    <span className="text-gray-500 ml-2">({exercise.estimatedTime} min)</span>
                    {formData.selectedExercises.includes(exercise._id) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        #{formData.selectedExercises.indexOf(exercise._id) + 1}
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {context === 'admin' 
                ? 'No template exercises available'
                : 'No exercises available. Create some exercises first.'
              }
            </p>
          )}
        </div>

        {/* Selected Exercises Order Preview */}
        {formData.selectedExercises.length > 0 && (
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h4 className="text-sm font-medium text-indigo-800 mb-3">
              Exercise Order in Module
            </h4>
            <div className="space-y-2">
              {formData.selectedExercises.map((exerciseId, index) => {
                const exercise = exercises.find(ex => ex._id === exerciseId);
                return exercise ? (
                  <div key={exerciseId} className="flex items-center space-x-3 bg-white p-2 rounded border">
                    <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{exercise.title}</span>
                      <span className="text-xs text-gray-500 ml-2">({exercise.estimatedTime} min)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveExerciseUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExerciseDown(index)}
                        disabled={index === formData.selectedExercises.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExerciseToggle(exerciseId)}
                        className="text-red-500 hover:text-red-700 text-sm ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
            <p className="text-xs text-indigo-600 mt-2">
              Use the arrows to reorder exercises. The order shown above is the order in which exercises will appear in the course.
            </p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Total Estimated Time:</span> {formData.estimatedTime} minutes
            </p>
            <button
              type="button"
              onClick={() => {
                const totalTime = exercises
                  .filter(ex => formData.selectedExercises.includes(ex._id))
                  .reduce((sum, ex) => sum + ex.estimatedTime, 0);
                setFormData(prev => ({ ...prev, estimatedTime: totalTime }));
              }}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
            >
              Reset to Calculated
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700">
            Manual Time Override (minutes)
          </label>
          <input
            type="number"
            id="estimatedTime"
            value={formData.estimatedTime}
            onChange={(e) => handleInputChange('estimatedTime', Number(e.target.value))}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
            placeholder="Enter time manually or use calculated time above"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel || (() => router.back())}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title.trim()}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (moduleId ? 'Update Module' : 'Create Module')}
        </button>
      </div>
    </form>
  );
}
