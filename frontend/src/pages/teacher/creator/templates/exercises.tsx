import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, FileText, Search, Filter, SortAsc, SortDesc, Calendar, Clock, Tag, Eye, X, FileDown, Copy } from 'lucide-react';
import TemplatesService from '@/services/templates.service';
import TeacherService from '@/services/teacher.service';
import ContentModal from '@/components/ContentModal';
import { downloadExercisePDF } from '@/utils/pdfGenerator';

const TemplateExercises = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'difficulty' | 'estimatedTime'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [showExerciseView, setShowExerciseView] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  
  // Dynamic filter options
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [templates, searchQuery, selectedDifficulty, selectedType, selectedTagFilters, sortBy, sortOrder]);

  useEffect(() => {
    updateDynamicFilters();
  }, [templates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await TemplatesService.getInstance().getTemplateExercises();
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading template exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDynamicFilters = () => {
    const difficulties = [...new Set(
      templates
        .map(item => item.difficulty)
        .filter(difficulty => difficulty)
    )].sort();

    const types = [...new Set(
      templates
        .map(item => item.type)
        .filter(type => type)
    )].sort();

    setAvailableDifficulties(difficulties);
    setAvailableTypes(types);
  };

  const applyFilters = () => {
    let filtered = [...templates];

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

    setFilteredTemplates(filtered);
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

  const handleViewExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setShowExerciseView(true);
  };

  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsContentModalOpen(true);
  };

  const handleDownloadPDF = (template: any) => {
    try {
      const exerciseData = {
        title: template.title,
        content: template.content || '',
        type: template.type || 'exercise',
        difficulty: template.difficulty,
        estimatedTime: template.estimatedTime,
        maxScore: template.maxScore || 10,
        description: template.description
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

  const handleCopyToTeacher = async (templateId: string) => {
    try {
      const teacherService = TeacherService.getInstance();
      await teacherService.copyFromTemplate(templateId, 'exercise');
      alert('Exercise added to your exercises successfully!');
    } catch (error) {
      console.error('Error copying exercise:', error);
      alert('Error adding exercise to your collection. Please try again.');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading template exercises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/teacher/creator/templates')}
                className="btn btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" />
                <ArrowLeft className="w-3 h-3 sm:hidden" />
                <span className="hidden sm:inline">Back to Templates</span>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">Exercise Templates</h1>
                <p className="text-sm text-gray-600 mt-1 hidden sm:block">Browse and use exercise templates</p>
              </div>
            </div>
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
                  placeholder="Search exercise templates..."
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
                    {templates.some(template => template.tags && template.tags.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(templates.flatMap(template => template.tags || []))].map((tag: string) => (
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

        {/* Templates List */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Exercise Templates ({filteredTemplates.length})
          </h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="loading-spinner mx-auto"></div>
              <p className="mt-2 text-text-secondary">Loading template exercises...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div key={template._id} className="card-interactive h-full">
                  <div className="card-body h-full flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{template.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="badge badge-primary">Exercise</span>
                      {template.type && (
                        <span className="badge badge-primary">
                          {template.type.charAt(0).toUpperCase() + template.type.slice(1).replace('-', ' ')}
                        </span>
                      )}
                      {template.difficulty && (
                        <span className="badge badge-neutral capitalize">
                          {template.difficulty}
                        </span>
                      )}
                      {template.tags && template.tags.map((tag: string) => (
                        <span key={tag} className="badge badge-success">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-sm text-text-secondary mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {template.estimatedTime || 0} min
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewTemplate(template)}
                          className="btn btn-secondary flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </button>
                        <button
                          onClick={() => handleCopyToTeacher(template._id)}
                          className="btn btn-primary flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Add to your exercises
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(template)}
                          className="btn btn-neutral btn-sm"
                          title="Download PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </div>
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
              <h4 className="text-lg font-medium text-gray-900 mb-2">No exercise templates found</h4>
              <p className="text-text-secondary">
                {getActiveFiltersCount() > 0 
                  ? 'Try adjusting your filters or search terms.'
                  : 'No public exercise templates available at the moment.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Exercise View Modal */}
      {showExerciseView && selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Exercise Preview</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownloadPDF(selectedExercise)}
                    className="btn btn-secondary"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowExerciseView(false)}
                    className="btn btn-secondary"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedExercise.title}</h4>
                  <p className="text-gray-600">{selectedExercise.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type</label>
                    <p className="text-sm text-gray-600">{selectedExercise.type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <p className="text-sm text-gray-600 capitalize">{selectedExercise.difficulty || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="label">Estimated Time</label>
                    <p className="text-sm text-gray-600">{selectedExercise.estimatedTime || 0} minutes</p>
                  </div>
                  <div>
                    <label className="label">Created</label>
                    <p className="text-sm text-gray-600">{new Date(selectedExercise.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedExercise.tags && selectedExercise.tags.length > 0 && (
                  <div>
                    <label className="label">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.tags.map((tag: string) => (
                        <span key={tag} className="badge badge-success">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedExercise.content && (
                  <div>
                    <label className="label">Content</label>
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: selectedExercise.content }} />
                    </div>
                  </div>
                )}

                {selectedExercise.instructions && (
                  <div>
                    <label className="label">Instructions</label>
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: selectedExercise.instructions }} />
                    </div>
                  </div>
                )}
              </div>
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
          type="exercise"
        />
      )}
    </div>
  );
};

export default TemplateExercises;
