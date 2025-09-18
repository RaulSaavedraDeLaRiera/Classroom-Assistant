import AuthService from './auth.service';

interface RequestConfig extends RequestInit {
  url: string;
  baseURL?: string;
}

class HttpClientService {
  private static instance: HttpClientService;
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  private constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  public static getInstance(): HttpClientService {
    if (!HttpClientService.instance) {
      HttpClientService.instance = new HttpClientService();
    }
    return HttpClientService.instance;
  }

  private async processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // If already refreshing, wait for it to complete
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const authService = AuthService.getInstance();
      const currentToken = authService.getStoredToken();
      
      if (!currentToken) {
        throw new Error('No token to refresh');
      }

      // Try to refresh the token
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newToken = data.access_token || data.token;
      
      if (newToken) {
        // Update the token in AuthService
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          authService['saveSession'](currentUser, newToken);
        }
        
        this.processQueue(null, newToken);
        return newToken;
      } else {
        throw new Error('No new token received');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.processQueue(error, null);
      
      // If refresh fails, logout the user
      const authService = AuthService.getInstance();
      await authService.logout();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async makeRequest(config: RequestConfig): Promise<Response> {
    const authService = AuthService.getInstance();
    const token = authService.getStoredToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = config.baseURL ? `${config.baseURL}${config.url}` : `${this.baseURL}${config.url}`;

    const requestConfig: RequestInit = {
      ...config,
      headers,
    };

    delete (requestConfig as any).url;
    delete (requestConfig as any).baseURL;

    try {
      const response = await fetch(url, requestConfig);

      // If token expired (401), try to refresh
      if (response.status === 401 && token) {
        const newToken = await this.refreshToken();
        
        if (newToken) {
          // Retry the original request with new token
          const retryHeaders: Record<string, string> = {
            ...headers,
            'Authorization': `Bearer ${newToken}`,
          };

          const retryConfig: RequestInit = {
            ...requestConfig,
            headers: retryHeaders,
          };

          return await fetch(url, retryConfig);
        }
      }

      return response;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  // GET request
  async get(url: string, config?: Partial<RequestConfig>): Promise<Response> {
    return this.makeRequest({
      method: 'GET',
      url,
      ...config,
    });
  }

  // POST request
  async post(url: string, data?: any, config?: Partial<RequestConfig>): Promise<Response> {
    return this.makeRequest({
      method: 'POST',
      url,
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  // PUT request
  async put(url: string, data?: any, config?: Partial<RequestConfig>): Promise<Response> {
    return this.makeRequest({
      method: 'PUT',
      url,
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  // DELETE request
  async delete(url: string, config?: Partial<RequestConfig>): Promise<Response> {
    return this.makeRequest({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  // PATCH request
  async patch(url: string, data?: any, config?: Partial<RequestConfig>): Promise<Response> {
    return this.makeRequest({
      method: 'PATCH',
      url,
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }
}

export default HttpClientService;
