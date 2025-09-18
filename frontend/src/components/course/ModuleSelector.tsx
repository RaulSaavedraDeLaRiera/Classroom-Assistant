import React from 'react';
import { SearchBar, searchContains } from '../common/SearchBar';

interface TeacherModule {
  _id: string;
  title: string;
  estimatedTime: number;
  tags: string[];
}

interface TemplateModule {
  _id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  tags: string[];
  exercises: any[];
}

interface ModuleSelectorProps {
  // Teacher modules
  availableModules: TeacherModule[];
  selectedTeacherModules: string[];
  onToggleTeacherModule: (moduleId: string) => void;
  teacherModulesSearch: string;
  onTeacherModulesSearchChange: (value: string) => void;
  
  // Template modules
  useTemplate: boolean;
  selectedTemplateId?: string;
  templateModuleDetails: {[key: string]: any[]};
  selectedTemplateModules: string[];
  onToggleTemplateModule: (moduleId: string) => void;
  templateModulesSearch: string;
  onTemplateModulesSearchChange: (value: string) => void;
  
  // Combined modules for mixed ordering
  combinedModules: Array<{id: string, isTemplate: boolean}>;
  
  // Module reordering - now for combined modules
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
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  availableModules,
  selectedTeacherModules,
  onToggleTeacherModule,
  teacherModulesSearch,
  onTeacherModulesSearchChange,
  useTemplate,
  selectedTemplateId,
  templateModuleDetails,
  selectedTemplateModules,
  onToggleTemplateModule,
  templateModulesSearch,
  onTemplateModulesSearchChange,
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
  loadingTemplateModules
}) => {
  // Filter teacher modules based on search and filters
  const filteredTeacherModules = availableModules.filter(module => {
    // Search filter for teacher modules
    if (!searchContains(module.title, teacherModulesSearch)) {
      return false;
    }
    
    // Tag filter (multiple selection)
    if (selectedTagFilters.length > 0 && (!module.tags || !module.tags.some((tag: string) => selectedTagFilters.includes(tag)))) {
      return false;
    }
    
    // Duration filter
    if (selectedDurationFilter) {
      const duration = module.estimatedTime || 0;
      if (selectedDurationFilter === 'short' && duration > 30) return false;
      if (selectedDurationFilter === 'medium' && (duration <= 30 || duration > 60)) return false;
      if (selectedDurationFilter === 'long' && duration <= 60) return false;
    }
    
    // Difficulty filter (assuming difficulty is part of tags for now)
    if (selectedDifficultyFilter) {
      const hasDifficultyTag = module.tags && module.tags.some((tag: string) => 
        tag.toLowerCase().includes(selectedDifficultyFilter.toLowerCase())
      );
      if (!hasDifficultyTag) return false;
    }
    
    return true;
  });

  // Filter template modules based on search
  const filteredTemplateModules = useTemplate && selectedTemplateId && templateModuleDetails[selectedTemplateId]
    ? templateModuleDetails[selectedTemplateId].filter(module => {
        return searchContains(module.title, templateModulesSearch);
      })
    : [];

  // Pagination for teacher modules
  const totalPages = Math.ceil(filteredTeacherModules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeacherModules = filteredTeacherModules.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Modules *
      </label>
      
      {/* Show template modules info if using template */}
      {useTemplate && selectedTemplateId && templateModuleDetails[selectedTemplateId] && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-blue-900">Template Modules (Toggle to select/deselect)</span>
          </div>
          
          {/* Template Modules Search */}
          <SearchBar
            value={templateModulesSearch}
            onChange={onTemplateModulesSearchChange}
            placeholder="Search template modules..."
            label="Search template modules"
            inputClassName="border-blue-300 bg-white"
          />
          {filteredTemplateModules.length === 0 ? (
            <div className="text-center py-4 text-blue-600">
              {templateModulesSearch ? "No template modules match your search." : "No template modules available."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemplateModules.map((module, index) => (
              <div 
                key={index} 
                className={`p-3 bg-white border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTemplateModules.includes(module._id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-blue-200 hover:border-blue-300'
                }`}
                onClick={() => onToggleTemplateModule(module._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">{module.title}</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Duration: {Math.round(module.estimatedTime || 0)} min
                    </p>
                    {module.tags && module.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {module.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {selectedTemplateModules.includes(module._id) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          #{selectedTemplateModules.indexOf(module._id) + 1}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Template
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedTemplateModules.includes(module._id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-blue-300'
                  }`}>
                    {selectedTemplateModules.includes(module._id) && (
                      <div className="w-2 h-2 bg-white rounded-sm"></div>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
          <p className="text-sm text-blue-700 mt-2">
            Click on modules to select/deselect them. Selected modules will be copied to your modules when you create the course.
          </p>
        </div>
      )}
      
      {/* Module Filters */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Modules</h3>
        
        {/* Search Bar */}
        <SearchBar
          value={teacherModulesSearch}
          onChange={(value) => {
            onTeacherModulesSearchChange(value);
            onPageChange(1); // Reset to first page when searching
          }}
          placeholder="Search teacher modules..."
          label="Search by name"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tag Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
              {allModuleTags.map(tag => (
                <label key={tag} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTagFilters.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onTagFilterChange([...selectedTagFilters, tag]);
                      } else {
                        onTagFilterChange(selectedTagFilters.filter(t => t !== tag));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{tag}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Difficulty Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty</label>
            <select
              value={selectedDifficultyFilter}
              onChange={(e) => onDifficultyFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          {/* Duration Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
            <select
              value={selectedDurationFilter}
              onChange={(e) => onDurationFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Durations</option>
              <option value="short">Short (0-30 min)</option>
              <option value="medium">Medium (30-60 min)</option>
              <option value="long">Long (60+ min)</option>
            </select>
          </div>
        </div>
        
        {/* Clear Filters */}
        {(selectedTagFilters.length > 0 || selectedDifficultyFilter || selectedDurationFilter) && (
          <div className="mt-3">
            <button
              onClick={() => {
                onTagFilterChange([]);
                onDifficultyFilterChange('');
                onDurationFilterChange('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      
      {/* Module Selection Summary */}
      {(selectedTeacherModules.length > 0 || selectedTemplateModules.length > 0) && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-700">Selected Modules:</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {selectedTeacherModules.length} Teacher
            </span>
            {useTemplate && selectedTemplateId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {selectedTemplateModules.length} Template
              </span>
            )}
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Total: {selectedTeacherModules.length + selectedTemplateModules.length}
            </span>
          </div>
        </div>
      )}
      
      {loadingModules ? (
        <div className="text-center py-4">Loading modules...</div>
      ) : filteredTeacherModules.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          {teacherModulesSearch || selectedTagFilters.length > 0 || selectedDifficultyFilter || selectedDurationFilter
            ? "No modules match your filters."
            : useTemplate ? "No modules available for this template." : "No modules available. Create some modules first."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTeacherModules.map((module) => (
            <div
              key={module._id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                selectedTeacherModules.includes(module._id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onToggleTeacherModule(module._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{module.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {module.estimatedTime || 0} min
                  </p>
                  {module.tags && module.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {module.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {selectedTeacherModules.includes(module._id) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        #{selectedTeacherModules.indexOf(module._id) + 1}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Teacher
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedTeacherModules.includes(module._id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedTeacherModules.includes(module._id) && (
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTeacherModules.length)} of {filteredTeacherModules.length} modules
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Modules Order Preview */}
      {combinedModules.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mt-6">
          <h4 className="text-sm font-medium text-indigo-800 mb-3">
            Module Order in Course
          </h4>
          <div className="space-y-2">
            {combinedModules.map((moduleItem, index) => {
              // Find module details
              const module = moduleItem.isTemplate 
                ? (useTemplate && selectedTemplateId && templateModuleDetails[selectedTemplateId]
                    ? templateModuleDetails[selectedTemplateId].find(m => m._id === moduleItem.id)
                    : null)
                : availableModules.find(m => m._id === moduleItem.id);
              
              if (!module) return null;
              
              return (
                <div key={`${moduleItem.isTemplate ? 'template' : 'teacher'}-${moduleItem.id}`} className="flex items-center space-x-3 bg-white p-2 rounded border">
                  <span className={`flex items-center justify-center w-6 h-6 text-white text-xs font-bold rounded-full ${
                    moduleItem.isTemplate ? 'bg-purple-600' : 'bg-indigo-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{module.title}</span>
                    <span className="text-xs text-gray-500 ml-2">({Math.round(module.estimatedTime || 0)} min)</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                      moduleItem.isTemplate 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {moduleItem.isTemplate ? 'Template' : 'Teacher'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => onMoveModuleUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveModuleDown(index)}
                      disabled={index === combinedModules.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveModule(moduleItem.id, moduleItem.isTemplate)}
                      className="text-red-500 hover:text-red-700 text-sm ml-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-indigo-600 mt-2">
            Use the arrows to reorder all modules. You can mix teacher and template modules in any order.
          </p>
        </div>
      )}
    </div>
  );
};

export default ModuleSelector;
