import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'exchange_rates_v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const SYMBOL_TO_CODE: Record<string, string> = {
  '₹': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
};

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
