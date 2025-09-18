import React from 'react';
import { ModuleSelector } from './ModuleSelector';
import { ExerciseSelector } from './ExerciseSelector';

interface CreateCourseForm {
  title: string;
  description: string;
  tags: string[];
  maxStudents: number;
  estimatedTime: number;
  modules: string[];
  templateModules: string[];
  exercises: string[];
  templateExercises: string[];
  useTemplate: boolean;
  selectedTemplateId?: string;
  showForm: boolean;
}

interface TeacherModule {
  _id: string;
  title: string;
  estimatedTime: number;
  tags: string[];
}

interface CourseFormProps {
  formData: CreateCourseForm;
  onFormDataChange: (updates: Partial<CreateCourseForm>) => void;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  
  // Module selection
  availableModules: TeacherModule[];
  onToggleTeacherModule: (moduleId: string) => void;
  onToggleTemplateModule: (moduleId: string) => void;
  teacherModulesSearch: string;
  onTeacherModulesSearchChange: (value: string) => void;
  templateModulesSearch: string;
  onTemplateModulesSearchChange: (value: string) => void;
  templateModuleDetails: {[key: string]: any[]};
  
  // Combined modules for mixed ordering
  combinedModules: Array<{id: string, isTemplate: boolean}>;
  
  // Module reordering
  onMoveModuleUp: (index: number) => void;
  onMoveModuleDown: (index: number) => void;
  onRemoveModule: (moduleId: string, isTemplate: boolean) => void;
  
  // Filters
  selectedTagFilters: string[];
  onTagFilterChange: (tags: string[]) => void;
  selectedDifficultyFilter: string;
  onDifficultyFilterChange: (difficulty: string) => void;
  selectedDurationFilter: string;
  onDurationFilterChange: (duration: string) => void;
  allModuleTags: string[];
  
  // Pagination
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  
  // Loading states
  loadingModules: boolean;
  loadingTemplateModules: boolean;
  
  // Time calculation
  totalMinutes: number;
  onTimeOverride: (hours: number) => void;
  
  // Submit
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  onCancel: () => void;
}

export const CourseForm: React.FC<CourseFormProps> = ({
  formData,
  onFormDataChange,
  onTagAdd,
  onTagRemove,
  tagInput,
  onTagInputChange,
  availableModules,
  onToggleTeacherModule,
  onToggleTemplateModule,
  teacherModulesSearch,
  onTeacherModulesSearchChange,
  templateModulesSearch,
  onTemplateModulesSearchChange,
  templateModuleDetails,
  combinedModules,
  onMoveModuleUp,
  onMoveModuleDown,
  onRemoveModule,
  selectedTagFilters,
  onTagFilterChange,
  selectedDifficultyFilter,
  onDifficultyFilterChange,
  selectedDurationFilter,
  onDurationFilterChange,
  allModuleTags,
  currentPage,
  onPageChange,
  itemsPerPage,
  loadingModules,
  loadingTemplateModules,
  totalMinutes,
  onTimeOverride,
  onSubmit,
  loading,
  onCancel
}) => {
  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      onTagAdd(tagInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Template Info */}
      {formData.useTemplate && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600">✓</span>
            <span className="font-medium text-green-900">Using Public Template</span>
          </div>
          <p className="text-green-700 text-sm">
            You can customize the template content below. The course will be created with your selected modules.
          </p>
          {loadingTemplateModules && (
            <div className="mt-2 text-sm text-green-600">
              ⏳ Loading template modules...
            </div>
          )}
        </div>
      )}

      {/* Basic Course Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFormDataChange({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter course title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Students
          </label>
          <input
            type="number"
            value={formData.maxStudents}
            onChange={(e) => onFormDataChange({ maxStudents: parseInt(e.target.value) || 20 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter course description"
          required
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a tag and press Enter"
          />
          <button
            type="button"
            onClick={handleTagAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onTagRemove(tag)}
                  className="text-blue-600 hover:text-blue-800 text-lg"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Module Selection */}
      <ModuleSelector
        availableModules={availableModules}
        selectedTeacherModules={formData.modules}
        onToggleTeacherModule={onToggleTeacherModule}
        teacherModulesSearch={teacherModulesSearch}
        onTeacherModulesSearchChange={onTeacherModulesSearchChange}
        useTemplate={formData.useTemplate}
        selectedTemplateId={formData.selectedTemplateId}
        templateModuleDetails={templateModuleDetails}
        selectedTemplateModules={formData.templateModules}
        onToggleTemplateModule={onToggleTemplateModule}
        templateModulesSearch={templateModulesSearch}
        onTemplateModulesSearchChange={onTemplateModulesSearchChange}
        combinedModules={combinedModules}
        onMoveModuleUp={onMoveModuleUp}
        onMoveModuleDown={onMoveModuleDown}
        onRemoveModule={onRemoveModule}
        selectedTagFilters={selectedTagFilters}
        onTagFilterChange={onTagFilterChange}
        selectedDifficultyFilter={selectedDifficultyFilter}
        onDifficultyFilterChange={onDifficultyFilterChange}
        selectedDurationFilter={selectedDurationFilter}
        onDurationFilterChange={onDurationFilterChange}
        allModuleTags={allModuleTags}
        currentPage={currentPage}
        onPageChange={onPageChange}
        itemsPerPage={itemsPerPage}
        loadingModules={loadingModules}
        loadingTemplateModules={loadingTemplateModules}
      />


      {/* Time Calculation */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Duration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selected Modules
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {formData.modules.length + formData.templateModules.length} module{(formData.modules.length + formData.templateModules.length) !== 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Time (Auto-calculated)
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {totalMinutes > 0 ? Math.ceil(totalMinutes / 60) : 0}h ({totalMinutes} minutes)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Final Estimated Time (Hours)
            </label>
            <input
              type="number"
              value={formData.estimatedTime || Math.ceil(totalMinutes / 60) || 0}
              onChange={(e) => onTimeOverride(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              placeholder="Override if needed"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can override the auto-calculated time
            </p>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || (formData.modules.length === 0 && formData.templateModules.length === 0)}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Course'}
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
