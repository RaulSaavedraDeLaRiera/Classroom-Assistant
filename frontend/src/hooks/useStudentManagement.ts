import { useState, useEffect, useCallback } from 'react';
import { courseDetailApiService } from '../services/courseDetailApi';
import UsersService from '../services/users.service';
import AuthService from '../services/auth.service';
import type { Student } from '../types/course.types';

export function useStudentManagement(courseId: string | string[] | undefined) {
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnrolledStudents = useCallback(async () => {
    if (!courseId || typeof courseId !== 'string') return;

    try {
      const studentsData = await courseDetailApiService.getEnrolledStudents(courseId);
      setEnrolledStudents(studentsData);
    } catch (err) {
      console.error('Error loading enrolled students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load enrolled students');
    }
  }, [courseId]);

  const loadAvailableStudents = useCallback(async () => {
    try {
      // Get current teacher id
      const auth = AuthService.getInstance();
      const currentUser = auth.getCurrentUser();
      const teacherId = currentUser?.id;

      let studentsData: Student[] = [];
      if (teacherId) {
        // Fetch only students associated to this teacher
        studentsData = await UsersService.getInstance().getStudentsByTeacher(teacherId);
      } else {
        // No teacher: do not load any students
        studentsData = [];
      }

      // Filter out already enrolled students
      const enrolledIds = enrolledStudents.map(s => s._id);
      const available = studentsData.filter((s: Student) => !enrolledIds.includes(s._id));
      setAvailableStudents(available);
    } catch (err) {
      console.error('Error loading available students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available students');
    }
  }, [enrolledStudents]);

  const enrollStudent = useCallback(async (studentId: string) => {
    if (!courseId || typeof courseId !== 'string') return;

    try {
      setLoading(true);
      await courseDetailApiService.enrollStudent(courseId, studentId);
      setShowAddStudent(false);
      // Reload both lists
      await Promise.all([loadEnrolledStudents(), loadAvailableStudents()]);
    } catch (err) {
      console.error('Error enrolling student:', err);
      setError(err instanceof Error ? err.message : 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  }, [courseId, loadEnrolledStudents, loadAvailableStudents]);

  const unenrollStudent = useCallback(async (studentId: string) => {
    if (!courseId || typeof courseId !== 'string') return;

    if (!confirm('Are you sure you want to remove this student from the course?')) return;

    try {
      setLoading(true);
      await courseDetailApiService.unenrollStudent(courseId, studentId);
      // Reload both lists
      await Promise.all([loadEnrolledStudents(), loadAvailableStudents()]);
    } catch (err) {
      console.error('Error unenrolling student:', err);
      setError(err instanceof Error ? err.message : 'Failed to unenroll student');
    } finally {
      setLoading(false);
    }
  }, [courseId, loadEnrolledStudents, loadAvailableStudents]);

  // Load enrolled students when courseId changes
  useEffect(() => {
    loadEnrolledStudents();
  }, [loadEnrolledStudents]);

  // Load available students after enrolled students are loaded
  useEffect(() => {
    if (enrolledStudents.length >= 0) {
      setTimeout(() => loadAvailableStudents(), 100);
    }
  }, [enrolledStudents, loadAvailableStudents]);

  return {
    enrolledStudents,
    availableStudents,
    showAddStudent,
    setShowAddStudent,
    loading,
    error,
    enrollStudent,
    unenrollStudent,
    refetch: () => Promise.all([loadEnrolledStudents(), loadAvailableStudents()])
  };
}
