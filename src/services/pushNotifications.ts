
import { notificationService } from './api';

/**
 * Push Notification Service (Web Push)
 * Handles Web Push API instead of Expo
 */

// Placeholder for VAPID Public Key - User needs to add this to .env
// VITE_VAPID_PUBLIC_KEY="your-public-key-here"
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Register for push notifications
 * @returns Push Subscription object (stringified) or null if failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // 1. Check if Push Messaging is supported
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('⚠️ Push messaging is not supported in this browser');
    return null;
  }

  try {
    // 2. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Push notification permission not granted');
      return null;
    }

    // 3. Get Service Worker Registration (PWA already registers it)
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready:', registration.scope);

    // 4. Validate VAPID Key
    if (!VAPID_PUBLIC_KEY) {
      console.warn('⚠️ VAPID Public Key not found in environment (VITE_VAPID_PUBLIC_KEY). Push subscription skipped.');
      // Return null gracefully so app doesn't crash, but push won't work yet
      return null;
    }

    // 5. Subscribe to Push Manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ Web Push Subscription:', subscription);

    // 6. Return the subscription as a string (to match 'token' format of backend)
    // The backend expects a string token. We send the full JSON string.
    return JSON.stringify(subscription);

  } catch (error) {
    console.error('❌ Error registering for web push:', error);
    return null;
  }
}

/**
 * Save push token to backend
 * @param token Stringified PushSubscription JSON
 */
export async function savePushToken(token: string): Promise<void> {
  try {
    await notificationService.savePushToken(token);
    console.log('✅ Push subscription saved to backend');
  } catch (error: any) {
    if (error?.response?.status === 401) {
      console.warn('⚠️ Not authenticated yet, will retry push token later');
    } else {
      console.error('❌ Error saving push token:', error);
    }
  }
}

/**
 * Remove push token from backend (on logout)
 */
export async function removePushToken(token: string): Promise<void> {
  try {
    await notificationService.removePushToken(token);
    console.log('✅ Push subscription removed from backend');
  } catch (error: any) {
    console.warn('⚠️ Error removing push token (non-critical):', error?.response?.data || error?.message || error);
  }
}

// --- Helpers ---

/**
 * Convert VAPID key from base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotificationService = {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
};

export default pushNotificationService;
