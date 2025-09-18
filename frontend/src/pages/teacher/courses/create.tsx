import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../../../components/layout';
import { CourseCreationOptions } from '../../../components/course/CourseCreationOptions';
import { TemplateSelector } from '../../../components/course/TemplateSelector';
import { CourseForm } from '../../../components/course/CourseForm';
import TeacherService from '../../../services/teacher.service';
import CoursesService from '../../../services/courses.service';
import TemplatesService from '../../../services/templates.service';

interface CreateCourseForm {
  title: string;
  description: string;
  tags: string[];
  maxStudents: number;
  estimatedTime: number;
  modules: string[]; // Teacher modules
  templateModules: string[]; // Template modules
  combinedModules: Array<{id: string, isTemplate: boolean}>; // Mixed order of all modules
  exercises: string[]; // Teacher exercises
  templateExercises: string[]; // Template exercises
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

interface TemplateCourse {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  estimatedDuration: number;
  modules: any[];
  isPublic: boolean;
  content?: { // Added content property
    modules: string[];
  };
}

interface TemplateModule {
  _id: string;
  title: string;
  description: string;
  estimatedDuration: number; // Changed from estimatedTime to match backend
  tags: string[];
  exercises: any[];
}

interface TemplateExercise {
  _id: string;
  title: string;
  content: string;
  estimatedTime: number;
  tags: string[];
  difficulty: string;
  type: string;
}

export default function CreateCoursePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState<CreateCourseForm>({
    title: '',
    description: '',
    maxStudents: 20,
    tags: [],
    estimatedTime: 0,
    modules: [], // Teacher modules
    templateModules: [], // Template modules
    combinedModules: [], // Mixed order of all modules
    exercises: [], // Teacher exercises
    templateExercises: [], // Template exercises
    useTemplate: false,
    selectedTemplateId: undefined,
    showForm: false
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableModules, setAvailableModules] = useState<TeacherModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [adminTemplates, setAdminTemplates] = useState<TemplateCourse[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateModules, setTemplateModules] = useState<TemplateModule[]>([]);
  const [loadingTemplateModules, setLoadingTemplateModules] = useState(false);
  const [templateModuleDetails, setTemplateModuleDetails] = useState<{[key: string]: any[]}>({});
  
  // Filter states
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('');
  const [selectedDurationFilter, setSelectedDurationFilter] = useState<string>('');
  const [allModuleTags, setAllModuleTags] = useState<string[]>([]);
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage] = useState(6); // 6 for all modules
  
  // Search states for different sections
  const [teacherModulesSearch, setTeacherModulesSearch] = useState('');
  const [templateModulesSearch, setTemplateModulesSearch] = useState('');

  // Monitor templateModuleDetails changes
  useEffect(() => {
    
  }, [templateModuleDetails, adminTemplates]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [teacherModulesSearch, selectedTagFilters, selectedDifficultyFilter, selectedDurationFilter]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        loadTeacherModules();
        loadAdminTemplates();
      }
    }
  }, [user, isLoading, router]);

  // Auto-update final time when modules change
  useEffect(() => {
    // Calculate total time from both teacher modules and template modules
    const teacherModulesTime = availableModules
      .filter(module => formData.modules.includes(module._id))
      .reduce((sum, module) => sum + (module.estimatedTime || 0), 0);
    
    const templateModulesTime = formData.useTemplate && formData.selectedTemplateId && templateModuleDetails[formData.selectedTemplateId]
      ? templateModuleDetails[formData.selectedTemplateId]
          .filter(module => formData.modules.includes(module._id))
          .reduce((sum, module) => sum + (module.estimatedTime || 0), 0)
      : 0;
    
    const totalMinutes = teacherModulesTime + templateModulesTime;
    const autoCalculatedHours = Math.ceil(totalMinutes / 60);
    
    // Always update to match the auto-calculated time
    setFormData(prev => ({ ...prev, estimatedTime: autoCalculatedHours }));
  }, [availableModules, formData.modules, templateModuleDetails, formData.useTemplate, formData.selectedTemplateId]);

  const loadTeacherModules = async () => {
    try {
      setLoadingModules(true);
      const modules = await TeacherService.getInstance().getTeacherModules();
      setAvailableModules(modules);
      
      // Extract all unique tags from modules
      const allTags = new Set<string>();
      modules.forEach(module => {
        if (module.tags && Array.isArray(module.tags)) {
          module.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      setAllModuleTags(Array.from(allTags).sort());
      
    } catch (error) {
      console.error('Error loading teacher modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  const loadAdminTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const templates = await TemplatesService.getInstance().getTemplateCourses();
      const publicTemplates = templates.filter(t => t.isPublic);
      setAdminTemplates(publicTemplates);
      
      // Load module details for each template
      if (publicTemplates.length > 0) {
        await loadTemplateModuleDetails(publicTemplates);
      }
    } catch (error) {
      console.error('Error loading admin templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplateModuleDetails = async (templates: TemplateCourse[]) => {
    try {
      const details: {[key: string]: any[]} = {};
      
      for (const template of templates) {
        // Use content.modules instead of modules directly
        const templateModules = template.content?.modules || [];
        
        if (templateModules && templateModules.length > 0) {
          const moduleDetails = await Promise.all(
            templateModules.map(async (moduleId: string) => {
              try {
                const module = await TemplatesService.getInstance().getTemplateModuleById(moduleId);
                
                
                // Load exercises for this module if they exist (check both module.exercises and module.content.exercises)
                const exercisesArray = module.exercises || module.content?.exercises;
                
                if (exercisesArray && Array.isArray(exercisesArray) && exercisesArray.length > 0) {

                  const exercises = await Promise.all(
                    exercisesArray.map(async (exerciseId: string) => {
                      try {
                        const exercise = await TemplatesService.getInstance().getTemplateExerciseById(exerciseId);
  
                        return exercise;
                      } catch (error) {
                        console.error(`❌ Error loading exercise ${exerciseId}:`, error);
                        return null;
                      }
                    })
                  );
                  
                  const validExercises = exercises.filter(exercise => exercise !== null);
                  
                  return { ...module, exercises: validExercises };
                } else {

                  return { ...module, exercises: [] };
                }
              } catch (error) {
                console.error(`Error loading module ${moduleId}:`, error);
                return null;
              }
            })
          );
          
          const validModules = moduleDetails.filter(module => module !== null);
          details[template._id] = validModules;

        }
      }
      
      setTemplateModuleDetails(details);
    } catch (error) {
      console.error('Error loading template module details:', error);
    }
  };

  const loadTemplateModules = async (templateId: string) => {
    try {
      setLoadingTemplateModules(true);
      const template = await TemplatesService.getInstance().getTemplateCourseById(templateId);
      
      if (template.content?.modules && template.content.modules.length > 0) {
        // Load each module with its exercises
        const modulesWithExercises = await Promise.all(
          template.content.modules.map(async (moduleId: string) => {
            try {
              const module = await TemplatesService.getInstance().getTemplateModuleById(moduleId);
              if (module.exercises && module.exercises.length > 0) {
                const exercises = await Promise.all(
                  module.exercises.map(async (exerciseId: string) => {
                    return await TemplatesService.getInstance().getTemplateExerciseById(exerciseId);
                  })
                );
                return { ...module, exercises };
              }
              return module;
            } catch (error) {
              console.error(`Error loading module ${moduleId}:`, error);
              return null;
            }
          })
        );
        setTemplateModules(modulesWithExercises);
        
        // Auto-select all template modules
        const moduleIds = modulesWithExercises
          .filter(module => module !== null)
          .map(module => module._id);
        setFormData(prev => ({
          ...prev,
          templateModules: moduleIds
        }));
      } else {
        setTemplateModules([]);
      }
    } catch (error) {
      console.error('Error loading template modules:', error);
      setTemplateModules([]);
    } finally {
      setLoadingTemplateModules(false);
    }
  };


  const handleTemplateSelect = async (template: TemplateCourse) => {
    try {
      setLoadingTemplateModules(true);
      
      // Clear any existing template modules from formData when switching templates
      setFormData(prev => ({
        ...prev,
        modules: prev.modules.filter(moduleId => {
          // Keep only teacher modules when switching templates
          return availableModules.find(m => m._id === moduleId);
        })
      }));
      
      // Check if template modules are already loaded in templateModuleDetails
      const templateModulesData = templateModuleDetails[template._id];
      
      if (templateModulesData && templateModulesData.length > 0) {
        // Set form data with template info (don't copy template module IDs yet)
        setFormData(prev => ({
          ...prev,
          title: template.title,
          description: template.description,
          tags: template.tags || [],
          estimatedTime: 0, // Let it be calculated automatically from modules
          modules: [], // Don't copy template module IDs yet - they'll be copied when creating the course
          useTemplate: true,
          selectedTemplateId: template._id
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          title: template.title,
          description: template.description,
          tags: template.tags || [],
          estimatedTime: template.estimatedDuration || 0,
          modules: [],
          useTemplate: true,
          selectedTemplateId: template._id
        }));
      }
      
      setShowTemplateSelector(false);
      
      if (templateModulesData && templateModulesData.length > 0) {
      }
    } catch (error) {
      console.error('Error processing template:', error);
      alert('Error loading template. Please try again.');
    } finally {
      setLoadingTemplateModules(false);
    }
  };

  const handleCreateFromScratch = () => {
    setFormData(prev => ({
      ...prev,
      title: '',
      description: '',
      tags: [],
      estimatedTime: 0,
      modules: [],
      useTemplate: false,
      selectedTemplateId: undefined
    }));
    setShowTemplateSelector(false);
    // Hide the buttons by setting a flag to show the form
    setFormData(prev => ({ ...prev, showForm: true }));
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
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

  const handleFormDataChange = (updates: Partial<CreateCourseForm>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => {
      const isSelected = prev.modules.includes(moduleId);
      const newModules = isSelected
        ? prev.modules.filter(id => id !== moduleId)
        : [...prev.modules, moduleId];
      
      // Update combined modules
      const newCombinedModules = isSelected
        ? prev.combinedModules.filter(item => !(item.id === moduleId && !item.isTemplate))
        : [...prev.combinedModules, { id: moduleId, isTemplate: false }];
      
      // Calculate total time from selected modules (in minutes)
      const totalMinutes = availableModules
        .filter(module => newModules.includes(module._id))
        .reduce((sum, module) => sum + (module.estimatedTime || 0), 0);
      
      // Convert to hours and round up for display
      const totalHours = Math.ceil(totalMinutes / 60);
      
      return {
        ...prev,
        modules: newModules,
        combinedModules: newCombinedModules,
        estimatedTime: totalHours
      };
    });
  };


  const handleTimeOverride = (hours: number) => {
    setFormData(prev => ({
      ...prev,
      estimatedTime: hours
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    if (formData.modules.length === 0 && formData.templateModules.length === 0) {
      alert('Please select at least one module for the course');
      return;
    }

    setLoading(true);
    try {
      // Build final modules array combining teacher and template modules
      const finalModules = [...formData.modules, ...formData.templateModules];
      
      // Validate that we have valid modules to send
      if (finalModules.length === 0) {
        throw new Error('No valid modules found. Please check your module selection.');
      }
      
      // Count module types for display
      const teacherModulesCount = finalModules.filter(id => availableModules.find(m => m._id === id)).length;
      const templateModulesCount = finalModules.filter(id => !availableModules.find(m => m._id === id)).length;
      
      const course = await CoursesService.getInstance().createCompleteCourse({
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        maxStudents: formData.maxStudents,
        estimatedTime: formData.estimatedTime,
        modules: finalModules,
      });
      alert('Course created successfully!');
      router.push(`/teacher/courses/${course.course._id || course.course._id}`);
    } catch (error: any) {
      console.error('Error creating course:', error);
      alert(`Error creating course: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateModuleToggle = (moduleId: string) => {
    setFormData(prev => {
      const isSelected = prev.templateModules.includes(moduleId);
      const newTemplateModules = isSelected
        ? prev.templateModules.filter(id => id !== moduleId)
        : [...prev.templateModules, moduleId];
      
      // Update combined modules
      const newCombinedModules = isSelected
        ? prev.combinedModules.filter(item => !(item.id === moduleId && item.isTemplate))
        : [...prev.combinedModules, { id: moduleId, isTemplate: true }];
      
      return {
        ...prev,
        templateModules: newTemplateModules,
        combinedModules: newCombinedModules
      };
    });
  };

  const moveModuleUp = (index: number) => {
    if (index === 0) return; // Can't move first item up
    
    setFormData(prev => {
      const newCombinedModules = [...prev.combinedModules];
      
      // Swap items
      const temp = newCombinedModules[index];
      newCombinedModules[index] = newCombinedModules[index - 1];
      newCombinedModules[index - 1] = temp;
      
      // Update separate arrays based on combined order
      const newTeacherModules = newCombinedModules
        .filter(item => !item.isTemplate)
        .map(item => item.id);
      const newTemplateModules = newCombinedModules
        .filter(item => item.isTemplate)
        .map(item => item.id);
      
      return {
        ...prev,
        combinedModules: newCombinedModules,
        modules: newTeacherModules,
        templateModules: newTemplateModules
      };
    });
  };

  const moveModuleDown = (index: number) => {
    if (index === formData.combinedModules.length - 1) return; // Can't move last item down
    
    setFormData(prev => {
      const newCombinedModules = [...prev.combinedModules];
      
      // Swap items
      const temp = newCombinedModules[index];
      newCombinedModules[index] = newCombinedModules[index + 1];
      newCombinedModules[index + 1] = temp;
      
      // Update separate arrays based on combined order
      const newTeacherModules = newCombinedModules
        .filter(item => !item.isTemplate)
        .map(item => item.id);
      const newTemplateModules = newCombinedModules
        .filter(item => item.isTemplate)
        .map(item => item.id);
      
      return {
        ...prev,
        combinedModules: newCombinedModules,
        modules: newTeacherModules,
        templateModules: newTemplateModules
      };
    });
  };

  const handleRemoveModule = (moduleId: string, isTemplate: boolean) => {
    if (isTemplate) {
      handleTemplateModuleToggle(moduleId);
    } else {
      handleModuleToggle(moduleId);
    }
  };


  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  // Calculate total time from both teacher modules and template modules
  const selectedTeacherModules = availableModules.filter(module => 
    formData.modules.includes(module._id)
  );

  const selectedTemplateModules = formData.useTemplate && formData.selectedTemplateId && templateModuleDetails[formData.selectedTemplateId]
    ? templateModuleDetails[formData.selectedTemplateId].filter(module => 
        formData.templateModules.includes(module._id)
      )
    : [];

  const teacherModulesTime = selectedTeacherModules.reduce((sum, module) => 
    sum + (module.estimatedTime || 0), 0
  );
  
  const templateModulesTime = selectedTemplateModules.reduce((sum, module) => 
    sum + (module.estimatedTime || 0), 0
  );
  
  const totalMinutes = teacherModulesTime + templateModulesTime;


  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Create New Course"
        subtitle={formData.showForm ? "Build your course from scratch" : formData.useTemplate ? "Customize your template course" : "Build a new course from scratch or use a template"}
        onBackClick={() => router.push('/teacher/courses')}
        titleGradient="from-blue-600 to-purple-600"
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">

          {/* Course Creation Options */}
          {!formData.useTemplate && formData.modules.length === 0 && !formData.showForm && (
            <CourseCreationOptions
              onUseTemplate={() => setShowTemplateSelector(true)}
              onCreateFromScratch={handleCreateFromScratch}
            />
          )}

          {/* Template Selection Modal */}
          <TemplateSelector
            isOpen={showTemplateSelector}
            onClose={() => setShowTemplateSelector(false)}
            templates={adminTemplates}
            loadingTemplates={loadingTemplates}
            onSelectTemplate={handleTemplateSelect}
            loadingTemplateModules={loadingTemplateModules}
            templateModuleDetails={templateModuleDetails}
          />

          {/* Course Form */}
          {(formData.useTemplate || formData.modules.length > 0 || formData.showForm) && (
            <CourseForm
              formData={formData}
              onFormDataChange={handleFormDataChange}
              onTagAdd={handleTagAdd}
              onTagRemove={handleTagRemove}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              availableModules={availableModules}
              onToggleTeacherModule={handleModuleToggle}
              onToggleTemplateModule={handleTemplateModuleToggle}
              teacherModulesSearch={teacherModulesSearch}
              onTeacherModulesSearchChange={setTeacherModulesSearch}
              templateModulesSearch={templateModulesSearch}
              onTemplateModulesSearchChange={setTemplateModulesSearch}
              templateModuleDetails={templateModuleDetails}
              combinedModules={formData.combinedModules}
              onMoveModuleUp={moveModuleUp}
              onMoveModuleDown={moveModuleDown}
              onRemoveModule={handleRemoveModule}
              selectedTagFilters={selectedTagFilters}
              onTagFilterChange={setSelectedTagFilters}
              selectedDifficultyFilter={selectedDifficultyFilter}
              onDifficultyFilterChange={setSelectedDifficultyFilter}
              selectedDurationFilter={selectedDurationFilter}
              onDurationFilterChange={setSelectedDurationFilter}
              allModuleTags={allModuleTags}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              loadingModules={loadingModules}
              loadingTemplateModules={loadingTemplateModules}
              totalMinutes={totalMinutes}
              onTimeOverride={handleTimeOverride}
              onSubmit={handleSubmit}
              loading={loading}
              onCancel={() => router.push('/teacher/courses')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

