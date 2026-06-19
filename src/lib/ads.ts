import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

// Replace the production unit IDs with your real AdMob ad-unit IDs before launch (plan Op B7).
export const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/0000000000';
const INTERSTITIAL_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-XXXXXXXXXXXXXXXX/1111111111';

/**
 * Requests EU/UK (GDPR) consent via the UMP SDK, then initializes the Mobile Ads SDK.
 * Both steps are wrapped so a failure never blocks app startup.
 */
export async function initAds(): Promise<void> {
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // Consent gathering failed (e.g. offline) — proceed; ads will be non-personalized.
  }
  try {
    await mobileAds().initialize();
  } catch {
    // Ad SDK init failure shouldn't crash the app.
  }
}

let interstitial: InterstitialAd | null = null;

/** Creates and begins loading an interstitial so it's ready when showInterstitial() is called. */
export function preloadInterstitial(): void {
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
  interstitial.addAdEventListener(AdEventType.LOADED, () => {});
  interstitial.load();
}

/** Shows the preloaded interstitial if one is ready, then preloads the next. No-op otherwise. */
export function showInterstitial(): void {
  if (interstitial?.loaded) {
    interstitial.show();
    preloadInterstitial();
  }
}
