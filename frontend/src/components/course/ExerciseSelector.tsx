import React from 'react';
import { SearchBar, searchContains } from '../common/SearchBar';

interface Exercise {
  _id: string;
  title: string;
  content: string;
  estimatedTime: number;
  tags: string[];
  difficulty: string;
  type: string;
}

interface ExerciseSelectorProps {
  // Teacher exercises
  availableExercises: Exercise[];
  selectedTeacherExercises: string[];
  onToggleTeacherExercise: (exerciseId: string) => void;
  teacherExercisesSearch: string;
  onTeacherExercisesSearchChange: (value: string) => void;
  
  // Template exercises
  useTemplate: boolean;
  selectedTemplateId?: string;
  selectedTemplateExercises: string[];
  onToggleTemplateExercise: (exerciseId: string) => void;
  templateExercisesSearch: string;
  onTemplateExercisesSearchChange: (value: string) => void;
  filteredTemplateExercises: Exercise[];
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  availableExercises,
  selectedTeacherExercises,
  onToggleTeacherExercise,
  teacherExercisesSearch,
  onTeacherExercisesSearchChange,
  useTemplate,
  selectedTemplateId,
  selectedTemplateExercises,
  onToggleTemplateExercise,
  templateExercisesSearch,
  onTemplateExercisesSearchChange,
  filteredTemplateExercises
}) => {
  // Filter teacher exercises based on search
  const filteredTeacherExercises = availableExercises.filter(exercise => {
    return searchContains(exercise.title, teacherExercisesSearch);
  });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Exercises (Optional)
      </label>
      
      {/* Teacher Exercises */}
      {availableExercises.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-green-900">Teacher Exercises</span>
          </div>
          
          <SearchBar
            value={teacherExercisesSearch}
            onChange={onTeacherExercisesSearchChange}
            placeholder="Search teacher exercises..."
            label="Search teacher exercises"
            inputClassName="border-green-300 bg-white"
          />
          
          {filteredTeacherExercises.length === 0 ? (
            <div className="text-center py-4 text-green-600">
              {teacherExercisesSearch ? "No teacher exercises match your search." : "No teacher exercises available."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTeacherExercises.map((exercise) => (
                <div 
                  key={exercise._id} 
                  className={`p-3 bg-white border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTeacherExercises.includes(exercise._id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-green-200 hover:border-green-300'
                  }`}
                  onClick={() => onToggleTeacherExercise(exercise._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900">{exercise.title}</h4>
                      <p className="text-sm text-green-600 mt-1">
                        Type: {exercise.type || 'Exercise'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {selectedTeacherExercises.includes(exercise._id) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            #{selectedTeacherExercises.indexOf(exercise._id) + 1}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Teacher
                        </span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedTeacherExercises.includes(exercise._id)
                        ? 'border-green-500 bg-green-500'
                        : 'border-green-300'
                    }`}>
                      {selectedTeacherExercises.includes(exercise._id) && (
                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Exercises */}
      {useTemplate && selectedTemplateId && filteredTemplateExercises.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-purple-900">Template Exercises</span>
          </div>
          
          <SearchBar
            value={templateExercisesSearch}
            onChange={onTemplateExercisesSearchChange}
            placeholder="Search template exercises..."
            label="Search template exercises"
            inputClassName="border-purple-300 bg-white"
          />
          
          {filteredTemplateExercises.length === 0 ? (
            <div className="text-center py-4 text-purple-600">
              {templateExercisesSearch ? "No template exercises match your search." : "No template exercises available."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemplateExercises.map((exercise) => (
                <div 
                  key={exercise._id} 
                  className={`p-3 bg-white border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTemplateExercises.includes(exercise._id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-purple-200 hover:border-purple-300'
                  }`}
                  onClick={() => onToggleTemplateExercise(exercise._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-900">{exercise.title}</h4>
                      <p className="text-sm text-purple-600 mt-1">
                        Type: {exercise.type || 'Exercise'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {selectedTemplateExercises.includes(exercise._id) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            #{selectedTemplateExercises.indexOf(exercise._id) + 1}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Template
                        </span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedTemplateExercises.includes(exercise._id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-purple-300'
                    }`}>
                      {selectedTemplateExercises.includes(exercise._id) && (
                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseSelector;
