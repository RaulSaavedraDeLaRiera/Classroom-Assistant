import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Plus, Layers, Search, Filter, SortAsc, SortDesc, Calendar, Clock, Tag, Edit, Eye, X } from 'lucide-react';
import TeacherService from '@/services/teacher.service';
import ContentModal from '@/components/ContentModal';

const TeacherModules = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<any[]>([]);
  const [filteredModules, setFilteredModules] = useState<any[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'estimatedTime'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showModuleExercises, setShowModuleExercises] = useState(false);
  const [moduleExercises, setModuleExercises] = useState<any[]>([]);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Dynamic filter options
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [modules, searchQuery, selectedType, selectedTagFilters, sortBy, sortOrder]);

  useEffect(() => {
    updateDynamicFilters();
  }, [modules]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const modulesData = await TeacherService.getInstance().getTeacherModules();
      
      // Count exercises for each module based on content.exercises array
      const modulesWithCount = modulesData.map(module => ({
        ...module,
        exerciseCount: module.content?.exercises?.length || 0
      }));
      
      setModules(modulesWithCount || []);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDynamicFilters = () => {
    const types = [...new Set(
      modules
        .map(item => item.type)
        .filter(type => type)
    )].sort();

    setAvailableTypes(types);
  };

  const applyFilters = () => {
    let filtered = [...modules];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Apply tag filter (exclusive - must have ALL selected tags)
    if (selectedTagFilters.length > 0) {
      filtered = filtered.filter(item => 
        item.tags && selectedTagFilters.every(tag => item.tags.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'estimatedTime':
          aValue = a.estimatedTime || 0;
          bValue = b.estimatedTime || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredModules(filtered);
  };

  const handleFilterByTag = (tag: string) => {
    setSelectedTagFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedTagFilters([]);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedType) count++;
    if (selectedTagFilters.length > 0) count++;
    return count;
  };

  const handleEditModule = (id: string) => {
    router.push(`/teacher/creator/modules/${id}`);
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm('Are you sure you want to delete this module?')) {
      try {
        await TeacherService.getInstance().deleteTeacherModule(id);
        await loadModules();
      } catch (error) {
        console.error('Error deleting module:', error);
      }
    }
  };

  const handleViewModuleExercises = async (module: any) => {
    try {
      console.log('Loading exercises for module:', module);
      setSelectedModule(module);
      
      // Get exercise IDs from module's content
      const exerciseIds = module.content?.exercises || [];
      console.log('Module exercise IDs:', exerciseIds);
      
      // Load each exercise individually
      const teacherService = TeacherService.getInstance();
      const moduleExercises = await Promise.all(
        exerciseIds.map(async (exerciseId: string) => {
          try {
            const exercise = await teacherService.getTeacherExerciseById(exerciseId);
            return {
              _id: exercise._id,
              title: exercise.title,
              description: exercise.description || '',
              type: exercise.type || 'exercise',
              difficulty: exercise.difficulty || 'Not specified',
              estimatedTime: exercise.estimatedTime || 0,
              maxScore: exercise.maxScore || 0,
              tags: exercise.tags || [],
              content: exercise.content || '',
              createdAt: exercise.createdAt
            };
          } catch (error) {
            console.error(`Error loading teacher exercise ${exerciseId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null values
      const validExercises = moduleExercises.filter(ex => ex !== null);
      console.log('Found exercises:', validExercises);
      
      setModuleExercises(validExercises);
      setShowModuleExercises(true);
    } catch (error) {
      console.error('Error loading module exercises:', error);
      setModuleExercises([]);
      setShowModuleExercises(true);
    }
  };

  const handleViewExercise = (exercise: any) => {
    const exerciseWithType = {
      ...exercise,
      type: exercise.type || 'exercise'
    };
    setSelectedTemplate(exerciseWithType);
    setIsContentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <button
                onClick={() => router.push('/teacher/creator')}
                className="btn btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" />
                <ArrowLeft className="w-3 h-3 sm:hidden" />
                <span className="hidden sm:inline">Back to Creator</span>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">My Modules</h1>
                <p className="text-sm text-gray-600 mt-1 hidden sm:block">Manage your created modules</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/teacher/creator/modules/create')}
              className="btn btn-primary btn-lg w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Module
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="badge badge-primary ml-2">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="card mt-4">
              <div className="card-body p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Type Filter */}
                  {availableTypes.length > 0 && (
                    <div>
                      <label className="label">Type</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="input"
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
                    <label className="label">Tags</label>
                    {modules.some(module => module.tags && module.tags.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(modules.flatMap(module => module.tags || []))].map((tag: string) => (
                          <button
                            key={tag}
                            onClick={() => handleFilterByTag(tag)}
                            className={`badge ${
                              selectedTagFilters.includes(tag) ? 'badge-primary' : 'badge-secondary'
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

                  {/* Sort Options */}
                  <div>
                    <label className="label">Sort by</label>
                    <div className="flex space-x-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="input flex-1"
                      >
                        <option value="createdAt">Date Created</option>
                        <option value="title">Title</option>
                        <option value="estimatedTime">Duration</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="btn btn-secondary px-3"
                      >
                        {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={clearFilters}
                    className="btn btn-secondary"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <span className="badge badge-primary">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedType && (
                <span className="badge badge-primary">
                  Type: {selectedType}
                  <button
                    onClick={() => setSelectedType('')}
                    className="ml-2 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedTagFilters.map((tag) => (
                <span key={tag} className="badge badge-primary">
                  Tag: {tag}
                  <button
                    onClick={() => handleFilterByTag(tag)}
                    className="ml-2 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modules List */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            My Modules ({filteredModules.length})
          </h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="loading-spinner mx-auto"></div>
              <p className="mt-2 text-text-secondary">Loading modules...</p>
            </div>
          ) : filteredModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModules.map((module) => (
                <div key={module._id} className="card-interactive">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{module.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {module.type && (
                        <span className="badge badge-primary">
                          {module.type.charAt(0).toUpperCase() + module.type.slice(1).replace('-', ' ')}
                        </span>
                      )}
                      {module.tags && module.tags.map((tag: string) => (
                        <span key={tag} className="badge badge-success">
                          {tag}
                        </span>
                      ))}
                    </div>

                        <div className="text-sm text-text-secondary mb-4">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Layers className="w-3 h-3 mr-1" />
                              {module.exerciseCount || 0} exercises
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {module.estimatedTime || 0} min
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(module.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewModuleExercises(module)}
                        className="btn btn-secondary flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Exercises
                      </button>
                      <button
                        onClick={() => handleEditModule(module._id)}
                        className="btn btn-primary flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module._id)}
                        className="btn btn-error btn-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No modules found</h4>
              <p className="text-text-secondary">
                {getActiveFiltersCount() > 0 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first module to get started.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Module Exercises Modal */}
      {showModuleExercises && selectedModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Module Exercises</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedModule.title}</p>
                </div>
                <button
                  onClick={() => setShowModuleExercises(false)}
                  className="btn btn-secondary"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {moduleExercises.length} exercise{moduleExercises.length !== 1 ? 's' : ''} in this module
                </p>
              </div>

              {moduleExercises.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moduleExercises.map((exercise) => (
                    <div key={exercise._id} className="card">
                      <div className="card-body">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{exercise.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{exercise.description}</p>
                          </div>
                        </div>
                        
                        <div className="text-sm text-text-secondary mb-4">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {exercise.estimatedTime || 0} min
                            </span>
                            {exercise.difficulty && (
                              <span className="badge badge-neutral capitalize">
                                {exercise.difficulty}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewExercise(exercise)}
                          className="w-full btn btn-secondary"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Content
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Layers className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No exercises in this module</h4>
                  <p className="text-text-secondary">
                    This module doesn't have any exercises yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {selectedTemplate && (
        <ContentModal
          isOpen={isContentModalOpen}
          onClose={() => setIsContentModalOpen(false)}
          content={selectedTemplate.content || 'No content available'}
          title={selectedTemplate.title}
          type={selectedTemplate.type === 'exercise' ? 'exercise' : 'module'}
        />
      )}
    </div>
  );
};

export default TeacherModules;
