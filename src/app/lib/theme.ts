import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
import { safeStorage, STORAGE_KEYS } from './storage-safe';
const KEY = STORAGE_KEYS.theme;
const EVT = `storage:${KEY}`;

function isNight() {
  const h = new Date().getHours();
  return h >= 20 || h < 7;
}

function read(): ThemeMode {
  const v = safeStorage.getString(KEY, '');
  return (v as ThemeMode) || 'light';
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const m = read();
    if (!safeStorage.getString(KEY, '')) safeStorage.setString(KEY, 'light');
    return m;
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const h = () => setModeState(read());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);

  useEffect(() => {
    if (mode !== 'auto') return;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    safeStorage.setString(KEY, m);
    setModeState(m);
  }, []);

  const isDark = mode === 'dark' || (mode === 'auto' && isNight());
  void tick;
  return { mode, setMode, isDark };
}
