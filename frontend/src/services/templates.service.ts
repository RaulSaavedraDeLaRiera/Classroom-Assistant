class TemplatesService {
  private static instance: TemplatesService;
  private baseURL: string;

  private constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  public static getInstance(): TemplatesService {
    if (!TemplatesService.instance) {
      TemplatesService.instance = new TemplatesService();
    }
    return TemplatesService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Template Courses
  async getTemplateCourses(filters?: any): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      
      // Always filter for public templates by default
      queryParams.append('isPublic', 'true');
      
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== '') {
            queryParams.append(key, filters[key]);
          }
        });
      }

      const response = await fetch(`${this.baseURL}/templates/courses?${queryParams}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching template courses:', error);
      throw error;
    }
  }

  async getTemplateCourseById(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/courses/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching template course:', error);
      throw error;
    }
  }

  async createTemplateCourse(templateData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/courses`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create template course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating template course:', error);
      throw error;
    }
  }

  async updateTemplateCourse(id: string, templateData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/courses/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update template course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating template course:', error);
      throw error;
    }
  }

  async deleteTemplateCourse(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/courses/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete template course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting template course:', error);
      throw error;
    }
  }

  // Template Modules
  async getTemplateModules(filters?: any): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== '') {
            queryParams.append(key, filters[key]);
          }
        });
      }

      const response = await fetch(`${this.baseURL}/templates/modules?${queryParams}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template modules');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching template modules:', error);
      throw error;
    }
  }

  async getTemplateModuleById(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/modules/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template module');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching template module:', error);
      throw error;
    }
  }

  async createTemplateModule(templateData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/modules`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create template module');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating template module:', error);
      throw error;
    }
  }

  async updateTemplateModule(id: string, templateData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/modules/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update template module');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating template module:', error);
      throw error;
    }
  }

  async deleteTemplateModule(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/modules/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete template module');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting template module:', error);
      throw error;
    }
  }

  // Template Exercises
  async getTemplateExercises(filters?: any): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== '') {
            queryParams.append(key, filters[key]);
          }
        });
      }

      const response = await fetch(`${this.baseURL}/templates/exercises?${queryParams}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template exercises');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching template exercises:', error);
      throw error;
    }
  }

  async getTemplateExerciseById(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/exercises/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching template exercise:', error);
      throw error;
    }
  }

  async createTemplateExercise(templateData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/exercises`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create template exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating template exercise:', error);
      throw error;
    }
  }

  async updateTemplateExercise(id: string, templateData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/exercises/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update template exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating template exercise:', error);
      throw error;
    }
  }

  async deleteTemplateExercise(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/templates/exercises/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete template exercise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting template exercise:', error);
      throw error;
    }
  }
}

export default TemplatesService;
