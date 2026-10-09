import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const gradient = ['#8B5CF6', '#FF6B5E'] as const; // violet → coral

const dark = {
  mode: 'dark' as const,
  bg: '#17181B',
  surface: '#212328',
  surfaceAlt: '#2A2D33',
  border: '#33363D',
  text: '#F5F0E8',
  textMuted: '#A8A39A',
};

const light = {
  mode: 'light' as const,
  bg: '#F5F0E8',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE6DC',
  border: '#E0D9CC',
  text: '#1E1F23',
  textMuted: '#6F6B64',
};

export type Theme = typeof dark | typeof light;

type Ctx = { theme: Theme; toggle: () => void };
const ThemeContext = createContext<Ctx>({ theme: dark, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<'dark' | 'light'>(system === 'light' ? 'light' : 'dark');
  const value = useMemo(
    () => ({
      theme: (mode === 'dark' ? dark : light) as Theme,
      toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    }),
    [mode]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);