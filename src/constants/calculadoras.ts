import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';

export type CategoriaCalculadora = 'escolares' | 'paes' | 'universitarias';

export type Calculadora = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaCalculadora;
  ruta: Href | null;
  icono: keyof typeof Ionicons.glyphMap;
  /** Fondo pastel para tarjetas del listado */
  colorBg: string;
  /** Color de acento: ícono en listado, fondo del ícono en el header */
  colorIcon: string;
};

/** Catálogo único de calculadoras. Listado, header y favoritos leen desde aquí. */
export const CALCULADORAS: Calculadora[] = [
  {
    id: 'promedio-simple',
    nombre: 'Promedio Simple',
    descripcion: 'Calcula el promedio de un conjunto de notas',
    categoria: 'escolares',
    ruta: '/calculadoras/promedio-simple',
    icono: 'list-outline',
    colorBg: '#ccfbf1',
    colorIcon: '#0d9488',
  },
  {
    id: 'promedio-ponderado',
    nombre: 'Promedio Ponderado',
    descripcion: 'Calcula tu nota final considerando el peso de cada evaluación',
    categoria: 'escolares',
    ruta: '/calculadoras/promedio-ponderado',
    icono: 'calculator-outline',
    colorBg: '#fee2e2',
    colorIcon: '#dc2626',
  },
  {
    id: 'nota-minima',
    nombre: 'Nota Necesaria',
    descripcion: 'Averigua la nota que necesitas para alcanzar tu objetivo',
    categoria: 'escolares',
    ruta: '/calculadoras/nota-minima',
    icono: 'flash-outline',
    colorBg: '#dbeafe',
    colorIcon: '#2563eb',
  },
  {
    id: 'nem',
    nombre: 'NEM y Puntaje PAES',
    descripcion: 'Estima tu puntaje NEM y tu puntaje ponderado',
    categoria: 'paes',
    ruta: '/calculadoras/nem',
    icono: 'school-outline',
    colorBg: '#ede9fe',
    colorIcon: '#7c3aed',
  },
  {
    id: 'porcentajes',
    nombre: 'Porcentajes',
    descripcion: 'Calcula descuentos, aumentos y operaciones con porcentajes',
    categoria: 'escolares',
    ruta: '/calculadoras/porcentajes',
    icono: 'pie-chart-outline',
    colorBg: '#dcfce7',
    colorIcon: '#16a34a',
  },
  {
    id: 'regla-3',
    nombre: 'Regla de 3',
    descripcion: 'Proporción directa e inversa para resolución rápida',
    categoria: 'escolares',
    ruta: '/calculadoras/regla-3',
    icono: 'swap-horizontal-outline',
    colorBg: '#ffe4e6',
    colorIcon: '#e11d48',
  },
  {
    id: 'paes-ponderado',
    nombre: 'Puntaje PAES Ponderado',
    descripcion: 'Simula tu postulación combinando M1, Lenguaje, NEM y Ranking',
    categoria: 'paes',
    ruta: null,
    icono: 'sparkles-outline',
    colorBg: '#f0e7ff',
    colorIcon: '#6d28d9',
  },
  {
    id: 'ranking',
    nombre: 'Puntaje Ranking',
    descripcion: 'Conversión oficial a puntaje de ranking DEMRE',
    categoria: 'paes',
    ruta: null,
    icono: 'trophy-outline',
    colorBg: '#fef3c7',
    colorIcon: '#b45309',
  },
];

export function getCalculadora(id: string): Calculadora | undefined {
  return CALCULADORAS.find((c) => c.id === id);
}
