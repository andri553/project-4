import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ThemeMode } from '@/types';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('securenusa-theme') as ThemeMode | null;
    if (saved === 'light' || saved === 'mature-dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'mature-dark';
  });

  useEffect(() => {
    localStorage.setItem('securenusa-theme', theme);
    document.body.classList.remove('light', 'dark', 'mature-dark', 'mature-light');
    document.body.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'mature-dark' : 'light');
  };
  const setTheme = (mode: ThemeMode) => setThemeState(mode);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
