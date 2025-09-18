class TeacherService {
  private static instance: TeacherService;
  private baseURL: string;

  private constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  public static getInstance(): TeacherService {
    if (!TeacherService.instance) {
      TeacherService.instance = new TeacherService();
    }
    return TeacherService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Teacher Modules
  async getTeacherModules(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/modules`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher modules');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teacher modules:', error);
      throw error;
    }
  }

  async getTeacherModuleById(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/modules/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher module');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teacher module:', error);
      throw error;
    }
  }

  async createTeacherModule(moduleData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/modules`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) {
        throw new Error('Failed to create teacher module');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating teacher module:', error);
      throw error;
    }
  }

  async updateTeacherModule(id: string, moduleData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/modules/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) {
        throw new Error('Failed to update teacher module');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating teacher module:', error);
      throw error;
    }
  }

  async deleteTeacherModule(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/modules/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete teacher module');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting teacher module:', error);
      throw error;
    }
  }

  // Teacher Exercises
  async getTeacherExercises(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/exercises`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher exercises');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teacher exercises:', error);
      throw error;
    }
  }

  async getTeacherExerciseById(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/exercises/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teacher exercise:', error);
      throw error;
    }
  }

  async createTeacherExercise(exerciseData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/exercises`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(exerciseData),
      });

      if (!response.ok) {
        throw new Error('Failed to create teacher exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating teacher exercise:', error);
      throw error;
    }
  }

  async updateTeacherExercise(id: string, exerciseData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/exercises/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(exerciseData),
      });

      if (!response.ok) {
        throw new Error('Failed to update teacher exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating teacher exercise:', error);
      throw error;
    }
  }

  async deleteTeacherExercise(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/exercises/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete teacher exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting teacher exercise:', error);
      throw error;
    }
  }

  // Copy from templates
  async copyFromTemplate(templateId: string, type: 'module' | 'exercise'): Promise<any> {
    try {
      const endpoint = type === 'module' ? 'modules/copy-from-template' : 'exercises/copy-from-template';
      const response = await fetch(`${this.baseURL}/teachers/${endpoint}/${templateId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to copy ${type} from template`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error copying ${type} from template:`, error);
      throw error;
    }
  }

  // Get teacher stats
  async getTeacherStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/teachers/stats`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      throw error;
    }
  }
}

export default TeacherService;
