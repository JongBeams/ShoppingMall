import * as SecureStore from 'expo-secure-store';
import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const { access_token, refresh_token, user } = response.data;

    // Store tokens securely
    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));

    return response.data;
  },

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
      user_type: 'buyer',
    });

    const { access_token, refresh_token, user } = response.data;

    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));

    return response.data;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
  },

  async getCurrentUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('access_token');
    return !!token;
  },
};
