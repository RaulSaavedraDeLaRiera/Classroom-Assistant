interface CourseModule {
  _id: string;
  title: string;
  description: string;
  courseId: string;
  teacherModuleId: string;
  visible: boolean;
  tags: string[];
  estimatedTime: number;
  status: string;
  type: string;
  prerequisites: string[];
  content: {
    exercises: string[];
  };
  previousModuleId: string | null;
  nextModuleId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CourseExercise {
  _id: string;
  title: string;
  description?: string;
  content: string;
  type: string;
  courseModuleId: string;
  templateExerciseId: string;
  visible: boolean;
  tags: string[];
  estimatedTime: number;
  maxScore: number;
  difficulty: string;
  status: string;
  previousExerciseId: string | null;
  nextExerciseId: string | null;
  createdAt: string;
  updatedAt: string;
}

class CourseApiService {
  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    };
  }

  private getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  // Course Exercises
  async getCourseExercises(courseId: string): Promise<CourseExercise[]> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/exercises`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load exercises: ${response.status}`);
    }

    return response.json();
  }

  // Teacher Modules
  async getTeacherModules(): Promise<any[]> {
    const response = await fetch(`${this.getApiUrl()}/teachers/modules`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load teacher modules: ${response.status}`);
    }

    return response.json();
  }

  // Template Modules
  async getTemplateModules(): Promise<any[]> {
    const response = await fetch(`${this.getApiUrl()}/teachers/templates/modules`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load template modules: ${response.status}`);
    }

    return response.json();
  }

  // Teacher Exercises
  async getTeacherExercises(): Promise<any[]> {
    const response = await fetch(`${this.getApiUrl()}/teachers/exercises`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load teacher exercises: ${response.status}`);
    }

    return response.json();
  }

  // Template Exercises
  async getTemplateExercises(): Promise<any[]> {
    const response = await fetch(`${this.getApiUrl()}/teachers/templates/exercises`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load template exercises: ${response.status}`);
    }

    return response.json();
  }

  // Add Module to Course
  async addModuleToCourse(courseId: string, moduleId: string): Promise<any> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/add-teacher-module/${moduleId}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to add module: ${response.status}`);
    }

    return response.json();
  }

  // Add Exercise to Module
  async addExerciseToModule(moduleId: string, exerciseId: string): Promise<void> {
    console.log(`  Adding exercise ${exerciseId} to module ${moduleId}`);
    console.log(`  URL: ${this.getApiUrl()}/courses/modules/${moduleId}/add-exercise`);
    
    const response = await fetch(`${this.getApiUrl()}/courses/modules/${moduleId}/add-exercise`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ exerciseId })
    });

    console.log(`  Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  Error response: ${errorText}`);
      throw new Error(`Failed to add exercise to module: ${response.status}`);
    }
  }

  // Update Module
  async updateModule(moduleId: string, data: any): Promise<void> {
    const response = await fetch(`${this.getApiUrl()}/courses/modules/${moduleId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update module: ${response.status}`);
    }
  }

  // Update Exercise
  async updateExercise(exerciseId: string, data: any): Promise<void> {
    const response = await fetch(`${this.getApiUrl()}/courses/exercises/${exerciseId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to update exercise: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  }

  // Delete Module
  async deleteModule(moduleId: string): Promise<void> {
    const response = await fetch(`${this.getApiUrl()}/courses/modules/${moduleId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete module: ${response.status}`);
    }
  }

  // Delete Exercise
  async deleteExercise(exerciseId: string): Promise<void> {
    const response = await fetch(`${this.getApiUrl()}/courses/exercises/${exerciseId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete exercise: ${response.status}`);
    }
  }

  async deleteStudentExercise(courseId: string, studentId: string, moduleId: string, exerciseId: string): Promise<void> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/students/${studentId}/modules/${moduleId}/exercises/${exerciseId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete student exercise: ${response.status}`);
    }
  }

  // Get Student Modules
  async getStudentModules(courseId: string, studentId: string): Promise<any[]> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/students/${studentId}/modules`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get student modules: ${response.status}`);
    }

    return response.json();
  }

  // Get Student Exercises
  async getStudentExercises(courseId: string, studentId: string): Promise<any[]> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/students/${studentId}/exercises`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get student exercises: ${response.status}`);
    }

    return response.json();
  }

  // Ping endpoint
  async ping(): Promise<any> {
    const response = await fetch(`${this.getApiUrl()}/courses/ping`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to ping: ${response.status}`);
    }

    return response.json();
  }

  // Get Student Exercise by ID
  async getStudentExerciseById(courseId: string, exerciseId: string): Promise<any> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/student-exercises/${exerciseId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get student exercise: ${response.status}`);
    }

    return response.json();
  }

  // Get Course Modules
  async getCourseModules(courseId: string): Promise<any[]> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/modules`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get course modules: ${response.status}`);
    }

    return response.json();
  }

  // Update Student Exercise Content
  async updateStudentExerciseContent(courseId: string, exerciseId: string, content: string): Promise<any> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/student-exercises/${exerciseId}/content`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error(`Failed to update student exercise content: ${response.status}`);
    }

    return response.json();
  }

  // Update Student Exercise (complete update)
  async updateStudentExercise(courseId: string, studentId: string, exerciseId: string, data: any): Promise<any> {
    const response = await fetch(`${this.getApiUrl()}/courses/${courseId}/student-exercises/${exerciseId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to update student exercise: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  }
}

export const courseApiService = new CourseApiService();
export type { CourseModule, CourseExercise };
