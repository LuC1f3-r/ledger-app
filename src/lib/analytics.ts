import {
  getAnalytics,
  logEvent as fbLogEvent,
  logScreenView,
} from '@react-native-firebase/analytics';

/**
 * Thin analytics wrapper around Firebase. Every call is fire-and-forget and
 * swallows errors so analytics can never break a user flow.
 *
 * IMPORTANT: never pass financial amounts or personal data as event params.
 */

export function logScreen(screen: string): void {
  logScreenView(getAnalytics(), { screen_name: screen, screen_class: screen }).catch(() => {});
}

export function logEvent(name: string, params?: Record<string, string | number | boolean>): void {
  fbLogEvent(getAnalytics(), name, params).catch(() => {});
}
