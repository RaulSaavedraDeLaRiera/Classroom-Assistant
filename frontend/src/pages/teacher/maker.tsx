import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import TeacherService from '../../services/teacher.service';
import TemplatesService from '../../services/templates.service';
import ContentList from '../../components/ContentList';
import ContentModal from '../../components/ContentModal';
import ContentViewer from '../../components/ContentViewer';

interface TeacherModule {
  _id: string;
  title: string;
  description: string;
  order: number;
  status: string;
  visible: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  teacherId: string;
}

interface TeacherExercise {
  _id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  visible: boolean;
  tags: string[];
  teacherModuleId?: string;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
}

interface AdminTemplate {
  _id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  visible: boolean;
  tags: string[];
  templateModuleId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TeacherMakerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'exercises' | 'modules' | 'templates'>('exercises');
  const [exercises, setExercises] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedModuleExercises, setSelectedModuleExercises] = useState<any[]>([]);
  const [selectedModuleTitle, setSelectedModuleTitle] = useState('');
  const [showModuleExercises, setShowModuleExercises] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        loadContent();
        loadTemplates();
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const { tab } = router.query;
    if (tab && ['modules', 'exercises', 'templates'].includes(tab as string)) {
      setActiveTab(tab as 'modules' | 'exercises' | 'templates');
    }
  }, [router.query]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const teacherService = TeacherService.getInstance();
      const templatesService = TemplatesService.getInstance();
      
      const [teacherModules, teacherExercises, adminTemplatesData] = await Promise.all([
        teacherService.getTeacherModules(),
        teacherService.getTeacherExercises(),
        templatesService.getTemplateExercises()
      ]);
      
      setModules(teacherModules);
      setExercises(teacherExercises);
      setTemplates(adminTemplatesData);
      
      // Extract all unique tags
      const allTagsSet = new Set<string>();
      [...teacherModules, ...teacherExercises, ...adminTemplatesData].forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => allTagsSet.add(tag));
        }
      });
      setAllTags(Array.from(allTagsSet).sort());
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      // Load both template modules and exercises
      const [templateModules, templateExercises] = await Promise.all([
        TemplatesService.getInstance().getTemplateModules(),
        TemplatesService.getInstance().getTemplateExercises()
      ]);
      
      // Combine and format templates
      const allTemplates = [
        ...templateModules.map(module => ({
          ...module,
          type: 'module',
          description: module.description || 'No description available'
        })),
        ...templateExercises.map(exercise => ({
          ...exercise,
          type: 'exercise',
          description: exercise.description || 'No description available'
        }))
      ];
      
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateModule = () => {
    router.push('/teacher/creator/modules/create');
  };

  const handleCreateExercise = () => {
    router.push('/teacher/creator/exercises/create');
  };

  const handleFilterByTag = (tag: string) => {
    setSelectedTagFilter(tag);
    
    if (!tag) {
      loadContent();
      loadTemplates();
      return;
    }
    
    // TODO: Implement proper filtering
    // For now, just reload all content
    loadContent();
    loadTemplates();
  };

  const handleEditModule = (id: string) => {
    router.push(`/teacher/creator/modules/${id}`);
  };

  const handleEditExercise = (id: string) => {
    router.push(`/teacher/creator/exercises/${id}`);
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm('Are you sure you want to delete this module?')) {
      try {
        const teacherService = TeacherService.getInstance();
        await teacherService.deleteTeacherModule(id);
        loadContent();
      } catch (error) {
        console.error('Error deleting module:', error);
      }
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      try {
        const teacherService = TeacherService.getInstance();
        await teacherService.deleteTeacherExercise(id);
        loadContent();
      } catch (error) {
        console.error('Error deleting exercise:', error);
      }
    }
  };

  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateForm(true);
  };

  const handleViewModuleExercises = async (module: any) => {
    try {
      console.log('Loading exercises for module:', module);
      // Get the full module data with exercises
      const fullModule = await TemplatesService.getInstance().getTemplateModuleById(module._id);
      console.log('Full module data:', fullModule);
      console.log('Module exercises:', fullModule.content?.exercises);
      
      // Get exercise IDs from module
      const exerciseIds = fullModule.content?.exercises || [];
      
      // Find exercises in the already loaded templates
      const moduleExercises = exerciseIds.map((exerciseId: string) => 
        templates.find(template => template._id === exerciseId)
      ).filter(Boolean); // Remove undefined items
      
      console.log('Found exercises:', moduleExercises);
      
      setSelectedModuleExercises(moduleExercises);
      setSelectedModuleTitle(module.title);
      setShowModuleExercises(true);
    } catch (error) {
      console.error('Error loading module exercises:', error);
      // Fallback to empty array
      setSelectedModuleExercises([]);
      setSelectedModuleTitle(module.title);
      setShowModuleExercises(true);
    }
  };

  const handleCopyFromTemplate = async (templateId: string, type: 'module' | 'exercise') => {
    try {
      const teacherService = TeacherService.getInstance();
      await teacherService.copyFromTemplate(templateId, type);
      alert(`${type === 'module' ? 'Module' : 'Exercise'} copied successfully!`);
      setShowTemplateForm(false);
      setSelectedTemplate(null);
      loadContent();
    } catch (error) {
      console.error(`Error copying ${type}:`, error);
      alert(`Error copying ${type}. Please try again.`);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Content Maker</h1>
            <button
              onClick={() => router.push('/teacher')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Content Type Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('modules')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'modules'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Modules ({modules.length})
              </button>
              <button
                onClick={() => setActiveTab('exercises')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exercises'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Exercises ({exercises.length})
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates ({templates.length})
              </button>
            </nav>
          </div>

          {/* Content Management */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {activeTab === 'modules' ? (
                <button
                  onClick={handleCreateModule}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Create New Module
                </button>
              ) : activeTab === 'exercises' ? (
                <button
                  onClick={handleCreateExercise}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Create New Exercise
                </button>
              ) : (
                <div className="text-gray-600 text-sm">
                  Select a template to copy and customize
                </div>
              )}
              <select
                value={selectedTagFilter}
                onChange={(e) => handleFilterByTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Filter by tag</option>
                {allTags.map((tag: string) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content List */}
          {activeTab === 'templates' ? (
            <div className="space-y-4">
              {/* Template Modules */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Template Modules</h3>
                {loading ? (
                  <div className="text-center py-4">Loading template modules...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates
                      .filter(template => template.type === 'module')
                      .map((template) => (
                        <div key={template._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Module
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {template.difficulty}
                                </span>
                                {template.tags && template.tags.map((tag: string) => (
                                  <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="text-sm text-gray-500">
                                Time: {template.estimatedTime || 0} minutes
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 mt-3">
                            <button
                              onClick={() => handleViewTemplate(template)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleViewModuleExercises(template)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                            >
                              View Exercises
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Template Exercises */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Template Exercises</h3>
                {loading ? (
                  <div className="text-center py-4">Loading template exercises...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates
                      .filter(template => template.type === 'exercise')
                      .map((template) => (
                        <div key={template._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Exercise
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {template.difficulty}
                                </span>
                                {template.tags && template.tags.map((tag: string) => (
                                  <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="text-sm text-gray-500">
                                Time: {template.estimatedTime || 0} minutes
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewTemplate(template)}
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                          >
                            View Template
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* No templates message */}
              {templates.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No public templates available
                </div>
              )}
            </div>
          ) : (
            <ContentList
              items={activeTab === 'modules' ? modules : exercises}
              type={activeTab === 'modules' ? 'modules' : 'exercises'}
              loading={loading}
              onEdit={activeTab === 'modules' ? handleEditModule : handleEditExercise}
              onDelete={activeTab === 'modules' ? handleDeleteModule : handleDeleteExercise}
              onCreate={activeTab === 'modules' ? handleCreateModule : handleCreateExercise}
              allTags={allTags}
              selectedTagFilter={selectedTagFilter}
              onFilterChange={handleFilterByTag}
            />
          )}
        </div>
      </div>

      {/* Template View Modal */}
      {showTemplateForm && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Template Details</h2>
              <button
                onClick={() => setShowTemplateForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTemplate.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTemplate.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTemplate.difficulty || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estimated Time</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTemplate.estimatedTime || 0} minutes</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-sm text-gray-900">{selectedTemplate.description || 'No description available'}</p>
                </div>

                {/* Tags */}
                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map((tag: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Content Button - Only for exercises */}
                {selectedTemplate.type === 'exercise' && selectedTemplate.content && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <button
                      onClick={() => setIsContentModalOpen(true)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      View Content
                    </button>
                  </div>
                )}

                {/* Module-specific information */}
                {selectedTemplate.type === 'module' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Module Information</label>
                    <div className="bg-gray-50 p-4 rounded-md border">
                      <p className="text-sm text-gray-700">
                        This module template can be copied to your modules and customized as needed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t flex-shrink-0">
              <div className="flex justify-end space-x-3 p-4">
                <button
                  onClick={() => {
                    setShowTemplateForm(false);
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleCopyFromTemplate(selectedTemplate._id, selectedTemplate.type)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Copy to My {selectedTemplate.type === 'module' ? 'Modules' : 'Exercises'}
                </button>
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
          type={selectedTemplate.type === 'exercise' ? 'exercise' : 'module'}
        />
      )}

      {/* Module Exercises Modal */}
      {showModuleExercises && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Module Exercises: {selectedModuleTitle}
              </h2>
              <button
                onClick={() => setShowModuleExercises(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedModuleExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-2">No exercises found in this module</p>
                  <p className="text-sm">This module template doesn't contain any exercises yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedModuleExercises.map((exercise, index) => (
                    <div key={exercise._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {index + 1}. {exercise.title}
                          </h3>
                          <p className="text-gray-600 mb-3">{exercise.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {exercise.type || 'Exercise'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {exercise.difficulty || 'Not specified'}
                            </span>
                            {exercise.tags && exercise.tags.map((tag: string) => (
                              <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="text-sm text-gray-500">
                            Time: {exercise.estimatedTime || 0} minutes | Score: {exercise.maxScore || 0} points
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => {
                              setSelectedTemplate(exercise);
                              setIsContentModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            View Content
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setShowModuleExercises(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
