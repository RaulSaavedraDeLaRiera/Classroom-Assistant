import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import TemplatesService from '../../services/templates.service';
import { ArrowLeft, BookOpen, Layers, FileText, Plus, Edit, Trash2, X, Check, Filter, Clock, Users, Calendar } from 'lucide-react';

interface TemplateCourse {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  estimatedTime: number;
  isPublic: boolean;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateModule {
  _id: string;
  title: string;
  description: string;
  templateCourseId: string;
  order: number;
  status: string;
  visible: boolean;
  tags: string[];
  type?: string;
  estimatedTime?: number;
  content?: {
    exercises?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface TemplateExercise {
  _id: string;
  title: string;
  description: string;
  templateModuleId: string;
  type: string;
  difficulty: string;
  visible: boolean;
  tags: string[];
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTemplatesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [courseTemplates, setCourseTemplates] = useState<TemplateCourse[]>([]);
  const [moduleTemplates, setModuleTemplates] = useState<TemplateModule[]>([]);
  const [exerciseTemplates, setExerciseTemplates] = useState<TemplateExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'modules' | 'exercises'>('courses');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        loadAllTemplates();
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const { tab } = router.query;
    if (tab && ['courses', 'modules', 'exercises'].includes(tab as string)) {
      setActiveTab(tab as 'courses' | 'modules' | 'exercises');
    }
  }, [router.query]);

  const loadAllTemplates = async () => {
    try {
      setLoading(true);
      const templatesService = TemplatesService.getInstance();
      
      // Load all three types of templates
      const [courses, modules, exercises] = await Promise.all([
        templatesService.getTemplateCourses(),
        templatesService.getTemplateModules(),
        templatesService.getTemplateExercises()
      ]);
      
      setCourseTemplates(courses);
      setModuleTemplates(modules);
      setExerciseTemplates(exercises);
      
      // Extract all unique tags
      const allTagsSet = new Set<string>();
      [...courses, ...modules, ...exercises].forEach(template => {
        if (template.tags && Array.isArray(template.tags)) {
          template.tags.forEach((tag: string) => allTagsSet.add(tag));
        }
      });
      setAllTags(Array.from(allTagsSet).sort());

      // Extract unique difficulties from exercises
      const difficultiesSet = new Set<string>();
      exercises.forEach(exercise => {
        if (exercise.difficulty) {
          difficultiesSet.add(exercise.difficulty);
        }
      });
      setAvailableDifficulties(Array.from(difficultiesSet).sort());

      // Extract unique types from exercises
      const typesSet = new Set<string>();
      exercises.forEach(exercise => {
        if (exercise.type) {
          typesSet.add(exercise.type);
        }
      });
      setAvailableTypes(Array.from(typesSet).sort());
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = (type: 'courses' | 'modules' | 'exercises') => {
    router.push(`/admin/templates/${type}/create`);
  };

  const handleFilterByTag = (tag: string) => {
    setSelectedTagFilter(tag);
    
    if (!tag) {
      loadAllTemplates();
      return;
    }
    
    // Filter templates by tag
    const filteredCourses = courseTemplates.filter(template => 
      template.tags && template.tags.includes(tag)
    );
    const filteredModules = moduleTemplates.filter(template => 
      template.tags && template.tags.includes(tag)
    );
    const filteredExercises = exerciseTemplates.filter(template => 
      template.tags && template.tags.includes(tag)
    );
    
    setCourseTemplates(filteredCourses);
    setModuleTemplates(filteredModules);
    setExerciseTemplates(filteredExercises);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSelectedDifficulty('');
    setSelectedType('');
    setSortBy('createdAt');
    setSortOrder('desc');
    loadAllTemplates();
  };

  const getFilteredTemplates = (templates: any[], type: string) => {
    let filtered = [...templates];

    // Filter by selected tags (exclusive - must have ALL selected tags)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(template => 
        template.tags && selectedTags.every(tag => template.tags.includes(tag))
      );
    }

    // Filter by difficulty (for exercises)
    if (type === 'exercises' && selectedDifficulty) {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // Filter by type (for exercises)
    if (type === 'exercises' && selectedType) {
      filtered = filtered.filter(template => template.type === selectedType);
    }

    // Sort templates
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortBy === 'difficulty') {
        // Custom order for difficulty
        const difficultyOrder = ['easy', 'medium', 'hard'];
        aValue = difficultyOrder.indexOf(aValue) !== -1 ? difficultyOrder.indexOf(aValue) : 999;
        bValue = difficultyOrder.indexOf(bValue) !== -1 ? difficultyOrder.indexOf(bValue) : 999;
      } else if (sortBy === 'type') {
        // Alphabetical order for type
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      } else if (sortBy === 'estimatedTime') {
        // Numeric order for duration
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        // String comparison for other fields
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return <span className="text-text-tertiary text-sm">No tags</span>;
    
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="badge badge-primary"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  const handleEditTemplate = (type: 'courses' | 'modules' | 'exercises', id: string) => {
    router.push(`/admin/templates/${type}/${id}`);
  };

  const handleDeleteTemplate = async (type: 'courses' | 'modules' | 'exercises', id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        const templatesService = TemplatesService.getInstance();
        
        switch (type) {
          case 'courses':
            await templatesService.deleteTemplateCourse(id);
            break;
          case 'modules':
            await templatesService.deleteTemplateModule(id);
            break;
          case 'exercises':
            await templatesService.deleteTemplateExercise(id);
            break;
        }
        
        loadAllTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between animate-slide-in">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="btn-ghost btn-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gradient">Template Management</h1>
                <p className="text-text-secondary">Manage course, module and exercise templates</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center animate-bounce-in">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Template Type Tabs */}
        <div className="card mb-8 animate-fade-in">
          <div className="card-body">
            <nav className="flex space-x-1 bg-surface-tertiary p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'courses'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Course Templates</span>
                  <span className="badge badge-primary">{courseTemplates.length}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('modules')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'modules'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Layers className="w-5 h-5" />
                  <span>Module Templates</span>
                  <span className="badge badge-primary">{moduleTemplates.length}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('exercises')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'exercises'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Exercise Templates</span>
                  <span className="badge badge-primary">{exerciseTemplates.length}</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="card mb-8 animate-fade-in">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Tags Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-3">Filter by Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-surface-tertiary text-text-secondary hover:bg-surface-primary hover:text-text-primary'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise-specific filters */}
              {activeTab === 'exercises' && (
                <>
                  <div className="lg:w-48">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Difficulty
                      {availableDifficulties.length === 0 && (
                        <span className="text-xs text-text-tertiary ml-1">(No data)</span>
                      )}
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="input w-full"
                      disabled={availableDifficulties.length === 0}
                    >
                      <option value="">All difficulties</option>
                      {availableDifficulties.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:w-48">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Type
                      {availableTypes.length === 0 && (
                        <span className="text-xs text-text-tertiary ml-1">(No data)</span>
                      )}
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="input w-full"
                      disabled={availableTypes.length === 0}
                    >
                      <option value="">All types</option>
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Sort Options */}
              <div className="lg:w-48">
                <label className="block text-sm font-medium text-text-primary mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input w-full"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="updatedAt">Updated Date</option>
                  <option value="title">Title</option>
                  {activeTab === 'courses' && <option value="estimatedTime">Duration</option>}
                  {activeTab === 'exercises' && availableDifficulties.length > 0 && <option value="difficulty">Difficulty</option>}
                  {activeTab === 'exercises' && availableTypes.length > 0 && <option value="type">Type</option>}
                </select>
              </div>
              <div className="lg:w-32">
                <label className="block text-sm font-medium text-text-primary mb-2">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="input w-full"
                >
                  <option value="desc">Newest</option>
                  <option value="asc">Oldest</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary btn-sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedTags.length > 0 || selectedDifficulty || selectedType) && (
              <div className="mt-4 pt-4 border-t border-border-primary">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-text-tertiary">Active filters:</span>
                  {selectedTags.map((tag) => (
                    <span key={tag} className="badge badge-primary">
                      {tag}
                      <button
                        onClick={() => handleTagToggle(tag)}
                        className="ml-1 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedDifficulty && (
                    <span className="badge badge-warning">
                      Difficulty: {selectedDifficulty}
                      <button
                        onClick={() => setSelectedDifficulty('')}
                        className="ml-1 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedType && (
                    <span className="badge badge-success">
                      Type: {selectedType}
                      <button
                        onClick={() => setSelectedType('')}
                        className="ml-1 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Templates Content */}
        {loading ? (
            <div className="text-center py-12 animate-fade-in">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading templates...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
              {/* Course Templates */}
              {activeTab === 'courses' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <button
                        onClick={() => handleCreateTemplate('courses')}
                        className="btn-primary btn-lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Course Template
                      </button>
                    </div>
                    <div className="text-sm text-text-tertiary">
                      {getFilteredTemplates(courseTemplates, 'courses').length} template{getFilteredTemplates(courseTemplates, 'courses').length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                  {getFilteredTemplates(courseTemplates, 'courses').length === 0 ? (
                    <div className="card">
                      <div className="card-body text-center py-12">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No course templates</h3>
                        <p className="text-text-secondary mb-6">Create your first course template to get started</p>
                        <button
                          onClick={() => handleCreateTemplate('courses')}
                          className="btn-primary"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Create First Template
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {getFilteredTemplates(courseTemplates, 'courses').map((template) => (
                        <div key={template._id} className="card-interactive">
                          <div className="card-body">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-text-primary mb-2">{template.title}</h3>
                                <p className="text-text-secondary text-sm line-clamp-2">{template.description}</p>
                              </div>
                              <div className="flex items-center space-x-1 ml-4">
                                {template.isPublic ? (
                                  <span className="badge badge-success">Public</span>
                                ) : (
                                  <span className="badge badge-neutral">Private</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-text-tertiary">Estimated duration:</span>
                                <span className="font-medium text-text-primary">{template.estimatedTime ? `${template.estimatedTime}min` : 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-text-tertiary">Created:</span>
                                <span className="font-medium text-text-primary">{new Date(template.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            {/* Course Tags */}
                            <div className="mb-4">
                              {renderTags(template.tags)}
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditTemplate('courses', template._id)}
                                className="btn-secondary btn-sm flex-1"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate('courses', template._id)}
                                className="btn-error btn-sm flex-1"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Module Templates */}
            {activeTab === 'modules' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      onClick={() => handleCreateTemplate('modules')}
                      className="btn-primary btn-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Module Template
                    </button>
                  </div>
                  <div className="text-sm text-text-tertiary">
                    {getFilteredTemplates(moduleTemplates, 'modules').length} template{getFilteredTemplates(moduleTemplates, 'modules').length !== 1 ? 's' : ''} found
                  </div>
                </div>
                
                {getFilteredTemplates(moduleTemplates, 'modules').length === 0 ? (
                  <div className="card">
                    <div className="card-body text-center py-12">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Layers className="w-8 h-8 text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">No module templates</h3>
                      <p className="text-text-secondary mb-6">Create your first module template to get started</p>
                      <button
                        onClick={() => handleCreateTemplate('modules')}
                        className="btn-primary"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Template
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getFilteredTemplates(moduleTemplates, 'modules').map((template) => (
                      <div key={template._id} className="card-interactive">
                        <div className="card-body">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-text-primary mb-2">{template.title}</h3>
                              <p className="text-text-secondary text-sm line-clamp-2">{template.description}</p>
                            </div>
                            <div className="flex items-center space-x-1 ml-4">
                              <span className="badge badge-primary">
                                {template.type || 'Module'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">Exercises:</span>
                              <span className="font-medium text-text-primary">{template.content?.exercises ? template.content.exercises.length : 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">Duration:</span>
                              <span className="font-medium text-text-primary">{template.estimatedTime ? `${template.estimatedTime}min` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">Created:</span>
                              <span className="font-medium text-text-primary">{new Date(template.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Module Tags */}
                          <div className="mb-4">
                            {renderTags(template.tags)}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTemplate('modules', template._id)}
                              className="btn-secondary btn-sm flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate('modules', template._id)}
                              className="btn-error btn-sm flex-1"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Exercise Templates */}
            {activeTab === 'exercises' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      onClick={() => handleCreateTemplate('exercises')}
                      className="btn-primary btn-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Exercise Template
                    </button>
                  </div>
                  <div className="text-sm text-text-tertiary">
                    {getFilteredTemplates(exerciseTemplates, 'exercises').length} template{getFilteredTemplates(exerciseTemplates, 'exercises').length !== 1 ? 's' : ''} found
                  </div>
                </div>
                
                {getFilteredTemplates(exerciseTemplates, 'exercises').length === 0 ? (
                  <div className="card">
                    <div className="card-body text-center py-12">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">No exercise templates</h3>
                      <p className="text-text-secondary mb-6">Create your first exercise template to get started</p>
                      <button
                        onClick={() => handleCreateTemplate('exercises')}
                        className="btn-primary"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Template
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getFilteredTemplates(exerciseTemplates, 'exercises').map((template) => (
                      <div key={template._id} className="card-interactive">
                        <div className="card-body">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-text-primary mb-2">{template.title}</h3>
                              <p className="text-text-secondary text-sm line-clamp-2">{template.description}</p>
                            </div>
                            <div className="flex items-center space-x-1 ml-4">
                              <span className="badge badge-primary">
                                {template.type}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">Difficulty:</span>
                              <span className={`badge ${
                                template.difficulty === 'easy' ? 'badge-success' : 
                                template.difficulty === 'medium' ? 'badge-warning' : 'badge-neutral'
                              }`}>
                                {template.difficulty}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">Duration:</span>
                              <span className="font-medium text-text-primary">{template.estimatedTime ? `${template.estimatedTime}min` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-tertiary">Created:</span>
                              <span className="font-medium text-text-primary">{new Date(template.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Exercise Tags */}
                          <div className="mb-4">
                            {renderTags(template.tags)}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTemplate('exercises', template._id)}
                              className="btn-secondary btn-sm flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate('exercises', template._id)}
                              className="btn-error btn-sm flex-1"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
