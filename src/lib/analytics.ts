import { NativeModules } from 'react-native';

// Check if the native Firebase app module is available
const isFirebaseAvailable = !!NativeModules.RNFBAppModule;

let getAnalytics: any = null;
let fbLogEvent: any = null;
let logScreenView: any = null;

if (isFirebaseAvailable) {
  try {
    const firebaseAnalytics = require('@react-native-firebase/analytics');
    getAnalytics = firebaseAnalytics.getAnalytics;
    fbLogEvent = firebaseAnalytics.logEvent;
    logScreenView = firebaseAnalytics.logScreenView;
  } catch (e) {
    console.warn('Firebase Analytics is installed but failed to load:', e);
  }
}

/**
 * Thin analytics wrapper around Firebase. Every call is fire-and-forget and
 * swallows errors so analytics can never break a user flow.
 *
 * IMPORTANT: never pass financial amounts or personal data as event params.
 */

export function logScreen(screen: string): void {
  if (logScreenView && getAnalytics) {
    logScreenView(getAnalytics(), { screen_name: screen, screen_class: screen }).catch(() => {});
  } else {
    console.log(`[Analytics Mock] logScreen: ${screen}`);
  }
}

export function logEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (fbLogEvent && getAnalytics) {
    fbLogEvent(getAnalytics(), name, params).catch(() => {});
  } else {
    console.log(`[Analytics Mock] logEvent: ${name}`, params);
  }
}

