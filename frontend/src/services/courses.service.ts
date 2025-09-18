class CoursesService {
  private static instance: CoursesService;
  private baseURL: string;

  private constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  public static getInstance(): CoursesService {
    if (!CoursesService.instance) {
      CoursesService.instance = new CoursesService();
    }
    return CoursesService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Reorder by index (Modules)
  async reorderModuleByIndex(courseId: string, moduleId: string, targetIndex: number): Promise<void> {
    const res = await fetch(`${this.baseURL}/courses/${courseId}/modules/${moduleId}/reorder-by-index`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ targetIndex })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Failed to reorder module');
    }
  }

  // Reorder by index (Exercises)
  async reorderExerciseByIndex(moduleId: string, exerciseId: string, targetIndex: number): Promise<void> {
    const res = await fetch(`${this.baseURL}/courses/modules/${moduleId}/exercises/${exerciseId}/reorder-by-index`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ targetIndex })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Failed to reorder exercise');
    }
  }

  // Reorder student exercise by index
  async reorderStudentExerciseByIndex(courseId: string, studentId: string, moduleId: string, exerciseId: string, targetIndex: number): Promise<void> {
    const res = await fetch(`${this.baseURL}/courses/${courseId}/students/${studentId}/modules/${moduleId}/exercises/${exerciseId}/reorder-by-index`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ targetIndex })
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Failed to reorder student exercise');
    }
  }

  // Add exercise to student module
  async addExerciseToStudentModule(courseId: string, studentId: string, moduleId: string, exerciseId: string): Promise<any> {
    const res = await fetch(`${this.baseURL}/courses/${courseId}/students/${studentId}/modules/${moduleId}/add-exercise`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ exerciseId })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Failed to add exercise to student module');
    }
    return res.json();
  }

  // Get teacher courses
  async getTeacherCourses(filters?: any): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== '') {
            queryParams.append(key, filters[key]);
          }
        });
      }

      const response = await fetch(`${this.baseURL}/courses?${queryParams}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      throw error;
    }
  }

  // Get course by ID
  async getCourseById(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  // Get course exercise by ID
  async getCourseExerciseById(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/courses/exercises/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course exercise:', error);
      throw error;
    }
  }

  // Create new course
  async createCompleteCourse(courseData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/courses/complete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(courseData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create complete course');
    }

    return response.json();
  }

  // Update course
  async updateCourse(id: string, courseData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  // Delete course
  async deleteCourse(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  // Get course modules
  async getCourseModules(courseId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${courseId}/modules`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course modules');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course modules:', error);
      throw error;
    }
  }

  // Add module to course
  async addModuleToCourse(courseId: string, moduleId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${courseId}/modules`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ moduleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add module to course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding module to course:', error);
      throw error;
    }
  }

  // Remove module from course
  async removeModuleFromCourse(courseId: string, moduleId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to remove module from course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing module from course:', error);
      throw error;
    }
  }

  // Course Student Management Methods
  async getCourseStudents(courseId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${courseId}/students`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course students');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course students:', error);
      throw error;
    }
  }

  async addStudentToCourse(courseId: string, studentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${courseId}/students`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add student to course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding student to course:', error);
      throw error;
    }
  }

  async removeStudentFromCourse(courseId: string, studentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/courses/${courseId}/students/${studentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to remove student from course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing student from course:', error);
      throw error;
    }
  }

  async updateStudentStatus(courseId: string, studentId: string, status: string, notes?: string): Promise<any> {
    try {
      // If student becomes inactive, also set visible to false
      const updateData: any = { status, notes };
      if (status === 'inactive' || status === 'false') {
        updateData.visible = false;
      }

      const response = await fetch(`${this.baseURL}/courses/${courseId}/students/${studentId}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating student status:', error);
      throw error;
    }
  }
}

export default CoursesService;
