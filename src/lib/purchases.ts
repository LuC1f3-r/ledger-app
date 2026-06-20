import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

let configured = false;

export function configurePurchases(): void {
  if (configured) return;
  if (!ANDROID_KEY) {
    console.warn('[Purchases] EXPO_PUBLIC_REVENUECAT_ANDROID_KEY is not set — Pro features will be unavailable.');
    return;
  }
  // A RevenueCat Test Store key (test_…) crashes release builds by design. Refuse it
  // outside dev so a misconfigured production build degrades instead of crashing.
  if (!__DEV__ && ANDROID_KEY.startsWith('test_')) {
    console.warn('[Purchases] Test Store key detected in a release build — skipping configuration. Use a goog_ key in production.');
    return;
  }
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: ANDROID_KEY });
  configured = true;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchase(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restore(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export function onCustomerInfoUpdate(cb: (info: CustomerInfo) => void): () => void {
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}
