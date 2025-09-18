class UsersService {
  private static instance: UsersService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  static getInstance(): UsersService {
    if (!UsersService.instance) {
      UsersService.instance = new UsersService();
    }
    return UsersService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllUsers(filters?: any): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== '') {
            queryParams.append(key, filters[key]);
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/users?${queryParams}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getTeachers(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/teachers/stats`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  }

  async getStudents(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/students/stats`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/details`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, active: boolean): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ active })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Get students by teacher ID
  async getStudentsByTeacher(teacherId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/teacher/${teacherId}/students`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching students by teacher:', error);
      throw error;
    }
  }

  // Create student and associate with teacher
  async createStudentWithTeacher(teacherId: string, studentData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/users/teacher/${teacherId}/students`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(studentData)
      });
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to create student';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse error response, use default message
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Return result with auto-generated password
      return {
        ...result,
        autoGeneratedPassword: result.autoGeneratedPassword
      };
    } catch (error) {
      console.error('Error creating student with teacher:', error);
      throw error;
    }
  }

  // delete student (remove from teacher's list)
  async deleteStudent(studentId: string, teacherId: string) {
    const response = await fetch(`${this.baseUrl}/users/teacher/${teacherId}/students/${studentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete student');
    }

    return response.json();
  }

  // Get student by ID
  async getStudentById(studentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/users/students/${studentId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching student by ID:', error);
      throw error;
    }
  }

  // Get student enrollments
  async getStudentEnrollments(studentId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/students/${studentId}/enrollments`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      throw error;
    }
  }

  // Get student statistics
  async getStudentStatistics(studentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/students/${studentId}/statistics`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      throw error;
    }
  }

  // Get last exercise completed by student
  async getLastExerciseCompleted(studentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/students/${studentId}/last-exercise`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching last exercise completed:', error);
      throw error;
    }
  }
}

export default UsersService;
