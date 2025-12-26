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
    // Check for LINE login callback
    const handleLineCallback = async () => {
      const path = window.location.pathname;
      if (path === '/auth/line/callback') {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userParam = params.get('user');

        if (token && userParam) {
          try {
            const user = JSON.parse(decodeURIComponent(userParam)) as User;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setAuthState({
              user,
              token,
              isAuthenticated: true,
            });

            // Register for push notifications after LINE login
            try {
              const pushToken = await registerForPushNotifications();
              if (pushToken) {
                await savePushToken(pushToken);
                localStorage.setItem('push_token', pushToken);
              }
            } catch (pushError) {
              console.warn('Failed to register push notifications:', pushError);
            }

            // Clean URL and redirect to home
            window.history.replaceState({}, '', '/');
            setLoading(false);
            return true;
          } catch (e) {
            console.error('Failed to parse LINE callback:', e);
          }
        }
        // Redirect to login on error
        window.history.replaceState({}, '', '/login');
      }
      return false;
    };

    // Try LINE callback first (async)
    const initAuth = async () => {
      if (await handleLineCallback()) {
        return;
      }

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
    };

    initAuth();
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
