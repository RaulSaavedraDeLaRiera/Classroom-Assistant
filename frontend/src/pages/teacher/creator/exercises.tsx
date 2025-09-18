import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Plus, FileText, Search, Filter, SortAsc, SortDesc, Calendar, Clock, Tag, Edit, Eye, X, FileDown } from 'lucide-react';
import TeacherService from '@/services/teacher.service';
import { downloadExercisePDF } from '@/utils/pdfGenerator';
import ContentModal from '@/components/ContentModal';

const TeacherExercises = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'difficulty' | 'estimatedTime'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  
  // Dynamic filter options
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exercises, searchQuery, selectedDifficulty, selectedType, selectedTagFilters, sortBy, sortOrder]);

  useEffect(() => {
    updateDynamicFilters();
  }, [exercises]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const exercisesData = await TeacherService.getInstance().getTeacherExercises();
      setExercises(exercisesData || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDynamicFilters = () => {
    const difficulties = [...new Set(
      exercises
        .map(item => item.difficulty)
        .filter(difficulty => difficulty)
    )].sort();

    const types = [...new Set(
      exercises
        .map(item => item.type)
        .filter(type => type)
    )].sort();

    setAvailableDifficulties(difficulties);
    setAvailableTypes(types);
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(item => item.difficulty === selectedDifficulty);
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
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
          bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
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

    setFilteredExercises(filtered);
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
    setSelectedDifficulty('');
    setSelectedType('');
    setSelectedTagFilters([]);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedDifficulty) count++;
    if (selectedType) count++;
    if (selectedTagFilters.length > 0) count++;
    return count;
  };

  const handleEditExercise = (id: string) => {
    router.push(`/teacher/creator/exercises/${id}`);
  };

  const handleDeleteExercise = async (id: string) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      try {
        await TeacherService.getInstance().deleteTeacherExercise(id);
        await loadExercises();
      } catch (error) {
        console.error('Error deleting exercise:', error);
      }
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

  const handleDownloadPDF = (exercise: any) => {
    try {
      const exerciseData = {
        title: exercise.title,
        content: exercise.content || '',
        type: exercise.type || 'exercise',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading exercises...</p>
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
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">My Exercises</h1>
                <p className="text-sm text-gray-600 mt-1 hidden sm:block">Manage your created exercises</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/teacher/creator/exercises/create')}
              className="btn btn-primary btn-lg w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Exercise
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
                  placeholder="Search exercises..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Difficulty Filter */}
                  {availableDifficulties.length > 0 && (
                    <div>
                      <label className="label">Difficulty</label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="input"
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
                    {exercises.some(exercise => exercise.tags && exercise.tags.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(exercises.flatMap(exercise => exercise.tags || []))].map((tag: string) => (
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
                        {availableDifficulties.length > 0 && (
                          <option value="difficulty">Difficulty</option>
                        )}
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
              {selectedDifficulty && (
                <span className="badge badge-primary">
                  Difficulty: {selectedDifficulty}
                  <button
                    onClick={() => setSelectedDifficulty('')}
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

        {/* Exercises List */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            My Exercises ({filteredExercises.length})
          </h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="loading-spinner mx-auto"></div>
              <p className="mt-2 text-text-secondary">Loading exercises...</p>
            </div>
          ) : filteredExercises.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map((exercise) => (
                <div key={exercise._id} className="card-interactive">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{exercise.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{exercise.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {exercise.type && (
                        <span className="badge badge-primary">
                          {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1).replace('-', ' ')}
                        </span>
                      )}
                      {exercise.difficulty && (
                        <span className="badge badge-neutral capitalize">
                          {exercise.difficulty}
                        </span>
                      )}
                      {exercise.tags && exercise.tags.map((tag: string) => (
                        <span key={tag} className="badge badge-success">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-sm text-text-secondary mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {exercise.estimatedTime || 0} min
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(exercise.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewExercise(exercise)}
                        className="btn btn-secondary flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditExercise(exercise._id)}
                        className="btn btn-primary flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(exercise)}
                        className="btn btn-neutral btn-sm"
                        title="Download PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise._id)}
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
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No exercises found</h4>
              <p className="text-text-secondary">
                {getActiveFiltersCount() > 0 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first exercise to get started.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

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

export default TeacherExercises;
