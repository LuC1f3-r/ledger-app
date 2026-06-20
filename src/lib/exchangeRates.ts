import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'exchange_rates_v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const SYMBOL_TO_CODE: Record<string, string> = {
  '₹': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₩': 'KRW',
  'C$': 'CAD',
  'A$': 'AUD',
  'NZ$': 'NZD',
  'CHF': 'CHF',
  'kr': 'SEK',
  'R$': 'BRL',
  'MX$': 'MXN',
  'R': 'ZAR',
  '₺': 'TRY',
  'د.إ': 'AED',
  'ر.س': 'SAR',
  'S$': 'SGD',
  '฿': 'THB',
  '₱': 'PHP',
  'Rp': 'IDR',
  'RM': 'MYR',
  'ل.س': 'SYP',
  'د.ك': 'KWD',
};

/** Reverse map: currency CODE → display symbol. */
export const CODE_TO_SYMBOL: Record<string, string> = {
  INR: '₹',  USD: '$',  EUR: '€',  GBP: '£',
  JPY: '¥',  CNY: '¥',  KRW: '₩',
  CAD: 'C$', AUD: 'A$', NZD: 'NZ$', CHF: 'CHF',
  SEK: 'kr', NOK: 'kr', DKK: 'kr',
  BRL: 'R$', MXN: 'MX$', ZAR: 'R',
  TRY: '₺',  AED: 'د.إ', SAR: 'ر.س',
  SGD: 'S$', THB: '฿',  PHP: '₱',
  IDR: 'Rp', MYR: 'RM',
  SYP: 'ل.س', KWD: 'د.ك',
};

/**
 * Returns the display symbol for a currency code.
 * Also handles legacy symbol-stored values (e.g. '$' → '$').
 */
export function currencySymbol(codeOrSymbol: string): string {
  return CODE_TO_SYMBOL[codeOrSymbol] ?? codeOrSymbol;
}

/** Returns the currency code for a stored value (handles both code and legacy symbol). */
export function toCurrencyCode(stored: string): string {
  // Already a valid code (3 uppercase letters)
  if (/^[A-Z]{3}$/.test(stored) && CODE_TO_SYMBOL[stored]) return stored;
  // Legacy symbol → code
  return SYMBOL_TO_CODE[stored] ?? 'USD';
}

interface Cache {
  timestamp: number;
  rates: Record<string, number>;
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (raw) {
    const cache: Cache = JSON.parse(raw);
    if (Date.now() - cache.timestamp < CACHE_TTL) return cache.rates;
  }

  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('Exchange rate fetch failed');
  const json = await res.json();
  if (json.result !== 'success') throw new Error('Exchange rate API error');

  const rates: Record<string, number> = json.rates;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), rates }));
  return rates;
}

// Returns multiplier to convert amounts currently stored in `fromSymbol` to `toSymbol`.
export function conversionRate(
  rates: Record<string, number>,
  fromSymbol: string,
  toSymbol: string,
): number {
  const from = SYMBOL_TO_CODE[fromSymbol] ?? 'USD';
  const to   = SYMBOL_TO_CODE[toSymbol]   ?? 'USD';
  const fromRate = rates[from] ?? 1;
  const toRate   = rates[to]   ?? 1;
  return toRate / fromRate;
}
