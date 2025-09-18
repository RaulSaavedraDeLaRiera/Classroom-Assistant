import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import TeacherService from '../../../../services/teacher.service';
import ExerciseForm from '../../../../components/ExerciseForm';

export default function EditExercisePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exercise, setExercise] = useState<any>(null);
  const [availableModules, setAvailableModules] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        if (id) {
          loadExercise();
          loadAvailableModules();
        }
      }
    }
  }, [user, isLoading, router, id]);

  const loadExercise = async () => {
    try {
      const teacherService = TeacherService.getInstance();
      const exerciseData = await teacherService.getTeacherExerciseById(id as string);
      setExercise(exerciseData);
    } catch (error) {
      console.error('Error loading exercise:', error);
      alert('Error loading exercise. Please try again.');
      router.push('/teacher/creator/exercises');
    }
  };

  const loadAvailableModules = async () => {
    try {
      const teacherService = TeacherService.getInstance();
      const modules = await teacherService.getTeacherModules();
      setAvailableModules(modules);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const handleSubmit = async (exerciseData: any) => {
    try {
      setLoading(true);
      const teacherService = TeacherService.getInstance();
      
      const exerciseToUpdate = {
        ...exerciseData,
        tags: exerciseData.tags,
        estimatedTime: Number(exerciseData.estimatedTime),
        teacherModuleId: exerciseData.teacherModuleId || undefined
      };

      await teacherService.updateTeacherExercise(id as string, exerciseToUpdate);
      router.push('/teacher/creator/exercises');
    } catch (error) {
      console.error('Error updating exercise:', error);
      alert('Error updating exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  if (!exercise) {
    return <div className="min-h-screen flex items-center justify-center">Loading exercise...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Exercise</h1>
            <button
              onClick={() => router.push('/teacher/creator/exercises')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" />
              <ArrowLeft className="w-3 h-3 sm:hidden" />
            </button>
          </div>

          <ExerciseForm
            exercise={exercise}
            isEditing={true}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/teacher/creator?tab=exercises')}
            loading={loading}
            availableModules={availableModules}
            title="Edit Exercise"
            submitText="Update Exercise"
            showModuleAssignment={true}
          />
        </div>
      </div>
    </div>
  );
}
