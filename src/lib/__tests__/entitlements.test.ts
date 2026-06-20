import {
  hasProEntitlement,
  FREE_CURRENCY_CODES,
  isCurrencyFree,
  FREE_BUDGET_LIMIT,
  canAddBudget,
  buildSupportMailto,
  ENTITLEMENT_ID,
} from '../entitlements';

describe('hasProEntitlement', () => {
  it('is false for null customer info', () => {
    expect(hasProEntitlement(null)).toBe(false);
  });
  it('is false for undefined customer info', () => {
    expect(hasProEntitlement(undefined)).toBe(false);
  });
  it('is false when entitlements is missing entirely', () => {
    expect(hasProEntitlement({} as any)).toBe(false);
  });
  it('is false when the pro entitlement is absent', () => {
    expect(hasProEntitlement({ entitlements: { active: {} } })).toBe(false);
  });
  it('is true when the pro entitlement is active', () => {
    expect(
      hasProEntitlement({ entitlements: { active: { [ENTITLEMENT_ID]: {} } } }),
    ).toBe(true);
  });
});

describe('isCurrencyFree', () => {
  it('allows the four free currencies', () => {
    FREE_CURRENCY_CODES.forEach(code => expect(isCurrencyFree(code)).toBe(true));
  });
  it('blocks currencies outside the free set', () => {
    expect(isCurrencyFree('JPY')).toBe(false);
  });
});

describe('canAddBudget', () => {
  const free = false;
  it('allows up to the free limit for new categories', () => {
    expect(canAddBudget(0, 'Food', [], free)).toBe(true);
    expect(canAddBudget(FREE_BUDGET_LIMIT - 1, 'Food', [], free)).toBe(true);
  });
  it('blocks a brand-new category once at the free limit', () => {
    expect(canAddBudget(FREE_BUDGET_LIMIT, 'Food', ['A', 'B', 'C'], free)).toBe(false);
  });
  it('always allows editing an already-budgeted category', () => {
    expect(canAddBudget(FREE_BUDGET_LIMIT, 'A', ['A', 'B', 'C'], free)).toBe(true);
  });
  it('ignores the count entirely when editing an existing category', () => {
    expect(canAddBudget(99, 'A', ['A'], free)).toBe(true);
  });
  it('allows unlimited budgets for pro users', () => {
    expect(canAddBudget(99, 'New', ['x'], true)).toBe(true);
  });
});

describe('buildSupportMailto', () => {
  it('builds a mailto with prefilled subject and diagnostics', () => {
    const url = buildSupportMailto('support@paisopulse.app', {
      appVersion: '1.0.7',
      platform: 'android',
      isPro: false,
    });
    expect(url).toContain('mailto:support@paisopulse.app');
    expect(url).toContain('subject=');
    expect(url).toContain('1.0.7');
    expect(url).toContain('android');
  });
});
