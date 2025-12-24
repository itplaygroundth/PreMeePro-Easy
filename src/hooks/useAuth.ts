import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '../types';
import { authService } from '../services/api';
import { registerForPushNotifications, savePushToken, removePushToken } from '../services/pushNotifications';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setAuthState({
          user,
          token,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.login(username, password);

    if (result.session?.access_token && result.user) {
      localStorage.setItem('token', result.session.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      setAuthState({
        user: result.user,
        token: result.session.access_token,
        isAuthenticated: true,
      });

      return result.user;
    }

    throw new Error('Login failed');
  }, []);

  const loginWithPush = useCallback(async (username: string, password: string) => {
    try {
      const user = await login(username, password);

      // Register for push notifications after successful login
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await savePushToken(token);
          localStorage.setItem('push_token', token);
        }
      } catch (pushError) {
        console.warn('Failed to register push notifications:', pushError);
        // Don't fail login if push fails
      }

      return user;
    } catch (error) {
      throw error;
    }
  }, [login]);

  const logout = useCallback(async () => {
    // Remove push token if exists
    const token = localStorage.getItem('push_token');
    if (token) {
      removePushToken(token).catch(console.error);
      localStorage.removeItem('push_token');
    }

    authService.logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  }, []);

  return {
    ...authState,
    loading,
    login: loginWithPush,
    logout,
  };
}
