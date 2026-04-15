import { create } from 'zustand';
import { api } from '../lib/axios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Check if a user is already logged in (using the HTTP-only cookie)
  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/auth/me');
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Login action
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/auth/login', { email, password });
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Login failed', 
        isLoading: false 
      });
      return false;
    }
  },

  // Register action
  register: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/auth/register', { name, email, password });
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Registration failed', 
        isLoading: false 
      });
      return false;
    }
  },

  // Logout action
  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout failed', error);
    }
  },
}));