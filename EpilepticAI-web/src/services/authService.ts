import api from '@/lib/api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/api';

export const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Register doctor
  registerDoctor: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register/doctor', data);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout (client-side)
  logout: () => {
    localStorage.removeItem('auth_token');
  },
};
