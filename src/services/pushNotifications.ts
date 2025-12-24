
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
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker not supported in this browser');
    alert('เบราว์เซอร์นี้ไม่รองรับ Service Worker');
    return null;
  }

  if (!('PushManager' in window)) {
    console.warn('⚠️ Push Manager not supported in this browser');
    // iOS Safari < 16.4 doesn't support Web Push
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      console.warn('⚠️ iOS detected - Web Push requires iOS 16.4+ and app must be installed as PWA');
    }
    return null;
  }

  try {
    // 2. Request Permission
    console.log('📱 Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('📱 Permission result:', permission);

    if (permission !== 'granted') {
      console.warn('⚠️ Push notification permission not granted:', permission);
      return null;
    }

    // 3. Get Service Worker Registration (PWA already registers it)
    // Wait for service worker to be ready
    console.log('📱 Waiting for Service Worker...');
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready:', registration.scope);
    console.log('📱 Service Worker state:', registration.active?.state);

    // 4. Validate VAPID Key
    if (!VAPID_PUBLIC_KEY) {
      console.warn('⚠️ VAPID Public Key not found in environment (VITE_VAPID_PUBLIC_KEY). Push subscription skipped.');
      return null;
    }
    console.log('📱 VAPID Key found, subscribing...');

    // 5. Check existing subscription first
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('✅ Existing Web Push Subscription found:', existingSubscription.endpoint);
      return JSON.stringify(existingSubscription);
    }

    // 6. Subscribe to Push Manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ New Web Push Subscription created:', subscription.endpoint);

    // 7. Return the subscription as a string (to match 'token' format of backend)
    return JSON.stringify(subscription);

  } catch (error: any) {
    console.error('❌ Error registering for web push:', error);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
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
