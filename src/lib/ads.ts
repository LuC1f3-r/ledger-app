let adsModule: any = null;
let isAdsAvailable = false;

try {
  adsModule = require('react-native-google-mobile-ads');
  isAdsAvailable = true;
} catch (e) {
  // Silent fallback, we are running in Expo Go or development client without the module.
}

const mobileAds = adsModule?.default;
const AdEventType = adsModule?.AdEventType;
const AdsConsent = adsModule?.AdsConsent;
const InterstitialAd = adsModule?.InterstitialAd;
const TestIds = adsModule?.TestIds;

// Fallback test IDs from Google AdMob documentation
const FALLBACK_BANNER_TEST_ID = 'ca-app-pub-3940256099942544/6300978111';
const FALLBACK_INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';

// Replace the production unit IDs with your real AdMob ad-unit IDs before launch (plan Op B7).
export const BANNER_UNIT_ID = __DEV__
  ? (TestIds?.BANNER || FALLBACK_BANNER_TEST_ID)
  : 'ca-app-pub-1733539074369238/1798318896';

const INTERSTITIAL_UNIT_ID = __DEV__
  ? (TestIds?.INTERSTITIAL || FALLBACK_INTERSTITIAL_TEST_ID)
  : 'ca-app-pub-1733539074369238/3985764460';

/**
 * Requests EU/UK (GDPR) consent via the UMP SDK, then initializes the Mobile Ads SDK.
 * Both steps are wrapped so a failure never blocks app startup.
 */
export async function initAds(): Promise<void> {
  if (!isAdsAvailable || !AdsConsent || !mobileAds) {
    console.log('[Ads Mock] initAds: ads module not available');
    return;
  }
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

let interstitial: any = null;

/** Creates and begins loading an interstitial so it's ready when showInterstitial() is called. */
export function preloadInterstitial(): void {
  if (!isAdsAvailable || !InterstitialAd) {
    console.log('[Ads Mock] preloadInterstitial: ads module not available');
    return;
  }
  try {
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
    interstitial.addAdEventListener(AdEventType.LOADED, () => {});
    interstitial.load();
  } catch (e) {
    console.warn('[Ads] Failed to preload interstitial:', e);
  }
}

/** Shows the preloaded interstitial if one is ready, then preloads the next. No-op otherwise. */
export function showInterstitial(): void {
  if (!isAdsAvailable) {
    console.log('[Ads Mock] showInterstitial: ads module not available');
    return;
  }
  if (interstitial?.loaded) {
    try {
      interstitial.show();
      preloadInterstitial();
    } catch (e) {
      console.warn('[Ads] Failed to show interstitial:', e);
    }
  }
}

