import { useState, useCallback } from 'react';
import { courseApiService } from '../services/courseApi';
import CoursesService from '../services/courses.service';

interface ModuleFormData {
  title: string;
  description: string;
  estimatedTime: number;
  type: string;
  tags: string[];
}

export function useModuleManagement(courseId: string, onSuccess?: () => void, onModuleAdded?: (module: any) => void, onModuleMoved?: () => void, onModuleDeleted?: (moduleId: string) => void) {
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editModuleData, setEditModuleData] = useState<ModuleFormData>({
    title: '',
    description: '',
    estimatedTime: 20,
    type: 'all',
    tags: []
  });

  const addModuleToCourse = useCallback(async (selectedModuleId: string) => {
    try {
      const response = await courseApiService.addModuleToCourse(courseId, selectedModuleId);
      setShowAddModule(false);
      // Extract courseModule from the response
      const newModule = response.courseModule || response;
      onModuleAdded?.(newModule);
    } catch (error) {
      console.error('Error adding module:', error);
      throw error;
    }
  }, [courseId, onModuleAdded]);

  const updateModule = useCallback(async (moduleId: string) => {
    try {
      await courseApiService.updateModule(moduleId, editModuleData);
      setEditingModule(null);
      setEditModuleData({ title: '', description: '', estimatedTime: 20, type: 'all', tags: [] });
      onSuccess?.();
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }, [editModuleData, onSuccess]);

  const deleteModule = useCallback(async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    try {
      await courseApiService.deleteModule(moduleId);
      onModuleDeleted?.(moduleId);
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }, [onModuleDeleted]);

  const moveModule = useCallback(async (moduleId: string, direction: 'up' | 'down', orderedModules: any[]) => {
    try {
      const currentIndex = orderedModules.findIndex(m => m._id === moduleId);
      if (currentIndex === -1) {
        console.error('Module not found in ordered list:', moduleId);
        return;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= orderedModules.length) return;
      if (targetIndex === currentIndex) return; // No-op guard

      await CoursesService.getInstance().reorderModuleByIndex(courseId, moduleId, targetIndex);
      onModuleMoved?.();
    } catch (error) {
      console.error('Error moving module:', error);
      throw error;
    }
  }, [courseId, onModuleMoved]);

  const startEditModule = useCallback((moduleOrId: any) => {
    // Handle both module object and module ID
    const module = typeof moduleOrId === 'string' ? null : moduleOrId;
    const moduleId = typeof moduleOrId === 'string' ? moduleOrId : moduleOrId._id;
    
    setEditingModule(moduleId);
    
    if (module) {
      setEditModuleData({
        title: module.title,
        description: module.description,
        estimatedTime: module.estimatedTime,
        type: module.type,
        tags: module.tags
      });
    } else {
      // If only ID is provided, we'll need to fetch the module data
      // For now, set default values - the parent component should handle loading
      setEditModuleData({
        title: '',
        description: '',
        estimatedTime: 20,
        type: 'all',
        tags: []
      });
    }
  }, []);

  return {
    showAddModule,
    setShowAddModule,
    editingModule,
    setEditingModule,
    editModuleData,
    setEditModuleData,
    addModuleToCourse,
    updateModule,
    deleteModule,
    moveModule,
    startEditModule
  };
}
