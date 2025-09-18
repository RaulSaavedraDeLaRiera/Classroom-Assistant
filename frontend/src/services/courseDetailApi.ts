import { Course, CourseModule, CourseExercise, CourseStats, Student } from '../types/course.types';

class CourseDetailApiService {
  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    };
  }

  private getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  // Course Details
  async getCourse(courseId: string): Promise<Course> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load course: ${response.status}`);
    }

    const courseData = await response.json();
    // Transform course data to include all fields expected by CourseView
    return {
      ...courseData,
      modules: courseData.modules || [],
      students: courseData.students || [],
      estimatedTime: courseData.estimatedDuration || 0
    };
  }

  // Course Modules
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/modules`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load modules: ${response.status}`);
    }

    const modulesData = await response.json();
    
    // Transform modules data to include all fields expected by CourseView
    const transformedModules = modulesData.map((module: any) => ({
      ...module,
      courseId: courseId,
      teacherModuleId: module.teacherModuleId || module._id,
      visible: module.visible !== undefined ? module.visible : true,
      tags: module.tags || [],
      status: module.status || 'active',
      type: module.type || 'all',
      prerequisites: module.prerequisites || [],
      previousModuleId: module.previousModuleId || null,
      nextModuleId: module.nextModuleId || null,
      createdAt: module.createdAt || new Date().toISOString(),
      updatedAt: module.updatedAt || new Date().toISOString()
    }));
    
    
    return transformedModules;
  }

  // Course Exercises
  async getCourseExercises(courseId: string): Promise<CourseExercise[]> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/exercises`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load exercises: ${response.status}`);
    }

    const exercisesData = await response.json();
    return exercisesData;
  }

  // Course Statistics
  async getCourseStats(courseId: string): Promise<CourseStats> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/stats`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load stats: ${response.status}`);
    }

    const statsData = await response.json();
    return statsData;
  }

  // Enrolled Students
  async getEnrolledStudents(courseId: string): Promise<Student[]> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/students`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load enrolled students: ${response.status}`);
    }

    return response.json();
  }

  // Available Students
  async getAvailableStudents(): Promise<Student[]> {
    const response = await fetch(`${this.getApiUrl()}/users?role=student`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load available students: ${response.status}`);
    }

    return response.json();
  }

  // Enroll Student
  async enrollStudent(courseId: string, studentId: string): Promise<void> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ studentId })
    });

    if (!response.ok) {
      throw new Error(`Failed to enroll student: ${response.status}`);
    }
  }

  // Unenroll Student
  async unenrollStudent(courseId: string, studentId: string): Promise<void> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/unenroll`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ studentId })
    });

    if (!response.ok) {
      throw new Error(`Failed to unenroll student: ${response.status}`);
    }
  }
}

export const courseDetailApiService = new CourseDetailApiService();
