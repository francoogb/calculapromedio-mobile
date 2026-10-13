/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Paleta Principal Oficial
    navy: '#1b1844',
    text: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    
    // Brand y Acentos
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    accentTip: '#7c3aed',
    accentTipBg: '#f5f3ff',
    
    // Estados
    success: '#16a34a',
    successBg: '#dcfce7',
    danger: '#dc2626',
    dangerBg: '#fee2e2',
    warning: '#f59e0b',
    warningBg: '#fef3c7',

    // Resultado aprobado (teal) y aviso informativo (azul)
    resultado: '#0d9488',
    resultadoBg: '#ccfbf1',
    resultadoBorder: '#5eead4',
    info: '#2563eb',
    infoBg: '#eff6ff',
    infoBorder: '#bfdbfe',

    // Compatibilidad
    backgroundElement: '#f8fafc',
    backgroundSelected: '#e2e8f0',
    brand: '#1b1844',
    brandText: '#ffffff',
    brandAccent: '#7c3aed',
    brandSecondary: '#4f46e5',
  },
  dark: {
    navy: '#0f172a',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    background: '#0b101e',
    surface: '#151d30',
    border: '#334155',

    primary: '#6366f1',
    primaryHover: '#4f46e5',
    accentTip: '#a78bfa',
    accentTipBg: '#2e1065',

    success: '#22c55e',
    successBg: '#14532d',
    danger: '#ef4444',
    dangerBg: '#7f1d1d',
    warning: '#fbbf24',
    warningBg: '#78350f',

    resultado: '#5eead4',
    resultadoBg: 'rgba(20,184,166,0.12)',
    resultadoBorder: 'rgba(45,212,191,0.30)',
    info: '#93c5fd',
    infoBg: 'rgba(59,130,246,0.10)',
    infoBorder: 'rgba(96,165,250,0.30)',

    backgroundElement: '#1e293b',
    backgroundSelected: '#334155',
    brand: '#0b101e',
    brandText: '#ffffff',
    brandAccent: '#a78bfa',
    brandSecondary: '#6366f1',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Acento único dentro de las calculadoras.
 * Regla: los colores por calculadora (catálogo) solo se usan FUERA (home, listado, favoritos).
 * Dentro de una calculadora todo es indigo; solo los estados (ok/error/advertencia) llevan color propio.
 */
export const Acento = {
  base: '#4f46e5',
  claro: '#a5b4fc',
  medio: '#818cf8',
  fondo: 'rgba(99,102,241,0.16)',
  borde: 'rgba(129,140,248,0.35)',
} as const;
