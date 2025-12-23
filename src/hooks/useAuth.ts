import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '../types';
import { authService } from '../services/api';

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

  const logout = useCallback(() => {
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
    login,
    logout,
  };
}
