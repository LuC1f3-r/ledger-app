// Pure gating logic. No React Native / native imports — keep it unit-testable.

export const ENTITLEMENT_ID = 'pro';

/** Currency CODES available without Pro. Symbols map in src/lib/exchangeRates.ts. */
export const FREE_CURRENCY_CODES = ['USD', 'INR', 'EUR', 'GBP'] as const;

/** Max distinct budgeted categories a free user may set. */
export const FREE_BUDGET_LIMIT = 3;

/** Minimal shape we read from RevenueCat's CustomerInfo. */
export interface CustomerInfoLike {
  entitlements: { active: Record<string, unknown> };
}

export function hasProEntitlement(info: CustomerInfoLike | null | undefined): boolean {
  return !!info?.entitlements?.active?.[ENTITLEMENT_ID];
}

export function isCurrencyFree(code: string): boolean {
  return (FREE_CURRENCY_CODES as readonly string[]).includes(code);
}

/**
 * Can the user set/update a budget for `category`?
 * Editing an already-budgeted category is always allowed; only NEW categories
 * beyond the free limit are blocked for non-pro users.
 */
export function canAddBudget(
  currentBudgetCount: number,
  category: string,
  existingCategories: string[],
  isPro: boolean,
): boolean {
  if (isPro) return true;
  if (existingCategories.includes(category)) return true;
  return currentBudgetCount < FREE_BUDGET_LIMIT;
}

export interface SupportDiagnostics {
  appVersion: string;
  platform: string;
  isPro: boolean;
}

export function buildSupportMailto(email: string, d: SupportDiagnostics): string {
  const subject = encodeURIComponent('PaisoPulse support / bug report');
  const body = encodeURIComponent(
    `\n\n---\nApp version: ${d.appVersion}\nPlatform: ${d.platform}\nPro: ${d.isPro ? 'yes' : 'no'}\n(Describe your issue above this line.)`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
