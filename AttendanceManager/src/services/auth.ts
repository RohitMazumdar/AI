import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { databaseService } from './database';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
}

class AuthService {
  private currentUser: User | null = null;

  async initialize(): Promise<void> {
    try {
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // In a real app, you would validate against a server
      // For this demo, we'll check against local database
      const user = await databaseService.getUserByEmail(credentials.email);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // In a real app, you would verify the password hash
      // For demo purposes, we'll accept any password for existing users
      
      // Store auth token and user data
      const token = `token_${Date.now()}`;
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
      
      this.currentUser = user;
      
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = await databaseService.getUserByEmail(data.email);
      if (existingUser) {
        return { success: false, error: 'User already exists with this email' };
      }

      // Create new user
      const userId = await databaseService.createUser({
        email: data.email,
        name: data.name,
        role: data.role
      });

      const user: User = {
        id: userId,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: new Date().toISOString()
      };

      // Store auth token and user data
      const token = `token_${Date.now()}`;
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
      
      this.currentUser = user;
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      this.currentUser = null;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }
}

export const authService = new AuthService();