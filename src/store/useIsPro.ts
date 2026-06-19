import { useStore } from './useStore';

/** Single source of truth for Pro status across the app. */
export function useIsPro(): boolean {
  return useStore(s => s.isPro);
}
