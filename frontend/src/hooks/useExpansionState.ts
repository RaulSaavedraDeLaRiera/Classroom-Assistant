import { useState } from 'react';

export function useExpansionState() {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.clear();
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleExercises = (moduleId: string) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        // If exercises are already expanded, collapse them
        newSet.delete(moduleId);
      } else {
        // If exercises are not expanded, collapse others and open only this
        newSet.clear();
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const expandModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      newSet.clear();
      newSet.add(moduleId);
      return newSet;
    });
  };

  return {
    expandedModules,
    expandedExercises,
    toggleModule,
    toggleExercises,
    expandModule
  };
}
