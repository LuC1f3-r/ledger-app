import { useColorScheme } from 'react-native';
import { Colors, LightColors } from './index';
import { useStore } from '../store/useStore';

export type Theme = typeof LightColors;

export function useTheme(): Theme {
  const themeMode = useStore(s => s.themeMode);
  const system    = useColorScheme();
  const active    = themeMode === 'system' ? system : themeMode;
  return (active === 'dark' ? Colors : LightColors) as Theme;
}
