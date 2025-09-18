export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Only for teachers and students (admin is created in backend)
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'teacher' | 'student';
}

export interface AuthResponse {
  user: User;
  access_token: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}
