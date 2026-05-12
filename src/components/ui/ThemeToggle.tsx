'use client';

import { useThemeStore } from '@/store/useThemeStore';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md bg-transparent hover:bg-elevated text-secondary hover:text-primary transition-colors flex items-center justify-center border border-transparent hover:border-border"
      title={isDark ? "Mudar para Dia" : "Mudar para Noite"}
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)'
      }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
