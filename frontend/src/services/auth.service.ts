import { User, LoginCredentials, RegisterData, AuthResponse } from '../types/auth.types';
import HttpClientService from './httpClient.service';

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private token: string | null = null;

  private constructor() {
    // Only restore session in browser
    if (typeof window !== 'undefined') {
      this.restoreSession();
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private restoreSession(): void {
    if (!this.isClient()) return;
    
    try {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      this.clearSession();
    }
  }


  private clearSession(): void {
    this.user = null;
    this.token = null;
    
    if (this.isClient()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  // Make saveSession public for httpClient access
  public saveSession(user: User, token: string): void {
    this.user = user;
    this.token = token;
    
    if (this.isClient()) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  // Login user with email and password
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const httpClient = HttpClientService.getInstance();
      const response = await httpClient.post('/auth/login', credentials);

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data: AuthResponse = await response.json();
      this.saveSession(data.user, data.access_token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Register new user (teacher or admin)
  async register(userData: RegisterData): Promise<boolean> {
    try {
      const httpClient = HttpClientService.getInstance();
      const response = await httpClient.post('/auth/register', userData);

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data: AuthResponse = await response.json();
      this.saveSession(data.user, data.access_token);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }

  // Get current user profile
  async getProfile(): Promise<User | null> {
    try {
      const httpClient = HttpClientService.getInstance();
      const response = await httpClient.get('/auth/profile');

      if (!response.ok) {
        throw new Error('Failed to get profile');
      }

      const user = await response.json();
      this.user = user;
      
      if (this.isClient()) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return user;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      if (this.token) {
        const httpClient = HttpClientService.getInstance();
        await httpClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get stored user from localStorage
  getStoredUser(): User | null {
    if (!this.isClient()) return null;
    
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Get stored token
  getStoredToken(): string | null {
    if (!this.isClient()) return null;
    return localStorage.getItem('access_token');
  }

  // Check user role
  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is teacher
  isTeacher(): boolean {
    return this.hasRole('teacher') || this.hasRole('admin');
  }
}

export default AuthService;
