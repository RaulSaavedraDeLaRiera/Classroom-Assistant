import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Clock, Tag, FileText, Star } from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  moduleId: string | null;
  onClose: () => void;
  teacherExercises: any[];
  templateExercises: any[];
  onAddExercise: (exerciseId: string, moduleId: string) => void;
}

export default function AddExerciseModal({ 
  isOpen, 
  moduleId,
  onClose, 
  teacherExercises, 
  templateExercises, 
  onAddExercise 
}: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredTeacherExercises, setFilteredTeacherExercises] = useState<any[]>([]);
  const [filteredTemplateExercises, setFilteredTemplateExercises] = useState<any[]>([]);

  // Get all available difficulties, types and tags
  const allExercises = [...teacherExercises, ...templateExercises];
  const availableDifficulties = [...new Set(allExercises.map(e => e.difficulty).filter(Boolean))].sort();
  const availableTypes = [...new Set(allExercises.map(e => e.type).filter(Boolean))].sort();
  const availableTags = [...new Set(allExercises.flatMap(e => e.tags || []))].sort();

  // Apply filters
  useEffect(() => {
    const applyFilters = (exercises: any[]) => {
      return exercises.filter(exercise => {
        // Search filter
        if (searchQuery) {
          const matchesSearch = 
            exercise.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());
          if (!matchesSearch) return false;
        }

        // Difficulty filter
        if (selectedDifficulty && exercise.difficulty !== selectedDifficulty) {
          return false;
        }

        // Type filter
        if (selectedType && exercise.type !== selectedType) {
          return false;
        }

        // Tag filter (must have ALL selected tags)
        if (selectedTagFilters.length > 0) {
          const hasAllTags = selectedTagFilters.every(tag => 
            exercise.tags && exercise.tags.includes(tag)
          );
          if (!hasAllTags) return false;
        }

        return true;
      });
    };

    setFilteredTeacherExercises(applyFilters(teacherExercises));
    setFilteredTemplateExercises(applyFilters(templateExercises));
  }, [teacherExercises, templateExercises, searchQuery, selectedDifficulty, selectedType, selectedTagFilters]);

  const handleFilterByTag = (tag: string) => {
    setSelectedTagFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('');
    setSelectedType('');
    setSelectedTagFilters([]);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedDifficulty) count++;
    if (selectedType) count++;
    if (selectedTagFilters.length > 0) count++;
    return count;
  };

  if (!isOpen || !moduleId) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Add Exercise to Module</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Difficulty Filter */}
                  {availableDifficulties.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All difficulties</option>
                        {availableDifficulties.map((difficulty) => (
                          <option key={difficulty} value={difficulty}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Type Filter */}
                  {availableTypes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All types</option>
                        {availableTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tag Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    {availableTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleFilterByTag(tag)}
                            className={`px-3 py-1 text-xs rounded-full ${
                              selectedTagFilters.includes(tag) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No tags available</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedDifficulty && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Difficulty: {selectedDifficulty}
                    <button
                      onClick={() => setSelectedDifficulty('')}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedType && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Type: {selectedType}
                    <button
                      onClick={() => setSelectedType('')}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedTagFilters.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Tag: {tag}
                    <button
                      onClick={() => handleFilterByTag(tag)}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Teacher Exercises Section */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Your Exercises ({filteredTeacherExercises.length})
            </h4>
            {filteredTeacherExercises.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {teacherExercises.length === 0 
                    ? 'No teacher exercises available.' 
                    : 'No exercises match your current filters.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTeacherExercises.map((exercise) => (
                  <div
                    key={exercise._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{exercise.title}</h5>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{exercise.description || 'No description available'}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {exercise.type && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {exercise.type}
                            </span>
                          )}
                          {exercise.difficulty && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              exercise.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {exercise.difficulty}
                            </span>
                          )}
                          {exercise.tags && exercise.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {exercise.estimatedTime || 0} min
                          {exercise.maxScore && (
                            <>
                              <span className="mx-2">•</span>
                              <Star className="w-3 h-3 mr-1" />
                              {exercise.maxScore} pts
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddExercise(exercise._id, moduleId)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Add to Module
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template Exercises Section */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-green-600" />
              Template Exercises ({filteredTemplateExercises.length})
            </h4>
            {filteredTemplateExercises.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {templateExercises.length === 0 
                    ? 'No template exercises available.' 
                    : 'No exercises match your current filters.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplateExercises.map((exercise) => (
                  <div
                    key={exercise._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{exercise.title}</h5>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{exercise.description || 'No description available'}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {exercise.type && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {exercise.type}
                            </span>
                          )}
                          {exercise.difficulty && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              exercise.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {exercise.difficulty}
                            </span>
                          )}
                          {exercise.tags && exercise.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {exercise.estimatedTime || 0} min
                          {exercise.maxScore && (
                            <>
                              <span className="mx-2">•</span>
                              <Star className="w-3 h-3 mr-1" />
                              {exercise.maxScore} pts
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddExercise(exercise._id, moduleId)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Add to Module
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
