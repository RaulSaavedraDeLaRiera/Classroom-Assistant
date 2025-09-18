import { useMemo } from 'react';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Exercise {
  _id: string;
  title: string;
  status: 'pending' | 'ready' | 'in_progress' | 'completed' | 'reviewed';
  studentId?: string;
  courseModuleId?: string;
  order?: number;
}

interface Module {
  _id: string;
  title: string;
  exercises?: Exercise[];
  order?: number;
}

interface StudentPosition {
  studentId: string;
  exerciseId: string;
  moduleId: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export function useStudentPositioning(
  selectedStudentIds: string[],
  students: Student[],
  modules: Module[]
): StudentPosition[] {
  return useMemo(() => {
    if (!selectedStudentIds.length || !students.length || !modules.length) {
      return [];
    }

    const positions: StudentPosition[] = [];
    const usedModules = new Set<string>();

    // Sort modules by order
    const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const studentId of selectedStudentIds) {
      const student = students.find(s => s._id === studentId);
      if (!student) continue;

      // Find the best exercise for this student across all modules
      let bestExercise: Exercise | null = null;
      let bestModule: Module | null = null;
      let bestScore = -1;

      for (const module of sortedModules) {
        if (usedModules.has(module._id)) continue; // Skip if module already used

        const exercises = module.exercises || [];
        if (!exercises.length) continue;

        // Sort exercises by order
        const sortedExercises = [...exercises].sort((a, b) => (a.order || 0) - (b.order || 0));

        // Find student's exercise in this module
        const studentExercise = sortedExercises.find(ex => ex.studentId === studentId);
        if (!studentExercise) continue;

        // Calculate priority score based on status
        let score = 0;
        switch (studentExercise.status) {
          case 'in_progress':
            score = 100; // Highest priority
            break;
          case 'completed':
            score = 80;
            break;
          case 'ready':
            score = 60;
            break;
          case 'reviewed':
            score = 40;
            break;
          case 'pending':
            score = 20; // Lowest priority
            break;
        }

        // Add order bonus (later exercises have higher priority)
        score += (studentExercise.order || 0) * 0.1;

        if (score > bestScore) {
          bestScore = score;
          bestExercise = studentExercise;
          bestModule = module;
        }
      }

      if (bestExercise && bestModule) {
        // Mark module as used
        usedModules.add(bestModule._id);

        // Determine position based on how many students are already in this module
        const studentsInModule = positions.filter(p => p.moduleId === bestModule!._id).length;
        const positionMap: ('top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center')[] = [
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
          'center'
        ];

        positions.push({
          studentId,
          exerciseId: bestExercise._id,
          moduleId: bestModule._id,
          position: positionMap[studentsInModule] || 'center'
        });
      }
    }

    return positions;
  }, [selectedStudentIds, students, modules]);
}
