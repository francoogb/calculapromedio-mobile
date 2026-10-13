/**
 * Carreras para el Simulador de Postulación: ponderaciones (DEMRE, Oferta Definitiva PAES 2025)
 * y puntajes de corte del proceso de admisión 2024→2025.
 * Generado desde pagina_con_laravel/resources/views/calculadoras/simulador_postulacion.blade.php — NO editar a mano.
 *
 * nem = peso conjunto de NEM + Ranking (así lo modela la web).
 */

export type Carrera = {
  carrera: string;
  univ: string;
  area: string;
  nem: number;
  m1: number;
  m2: number;
  l: number;
  h: number;
  c: number;
  corte: number;
};

export const CARRERAS: readonly Carrera[] = [
  { carrera: 'Medicina', univ: 'PUC', area: 'Salud', nem: 20, m1: 20, m2: 10, l: 10, h: 0, c: 40, corte: 955 },
  { carrera: 'Medicina', univ: 'U. de Chile', area: 'Salud', nem: 20, m1: 20, m2: 10, l: 10, h: 0, c: 40, corte: 924 },
  { carrera: 'Medicina', univ: 'U. de los Andes', area: 'Salud', nem: 20, m1: 20, m2: 10, l: 10, h: 0, c: 40, corte: 858 },
  { carrera: 'Medicina', univ: 'USACH', area: 'Salud', nem: 20, m1: 15, m2: 10, l: 10, h: 0, c: 45, corte: 848 },
  { carrera: 'Odontología', univ: 'PUC', area: 'Salud', nem: 20, m1: 20, m2: 10, l: 10, h: 0, c: 40, corte: 862 },
  { carrera: 'Odontología', univ: 'U. de Chile', area: 'Salud', nem: 20, m1: 20, m2: 10, l: 10, h: 0, c: 40, corte: 812 },
  { carrera: 'Química y Farmacia', univ: 'U. de Chile', area: 'Salud', nem: 20, m1: 20, m2: 10, l: 10, h: 0, c: 40, corte: 782 },
  { carrera: 'Enfermería', univ: 'PUC', area: 'Salud', nem: 20, m1: 20, m2: 0, l: 20, h: 0, c: 40, corte: 710 },
  { carrera: 'Kinesiología', univ: 'PUC', area: 'Salud', nem: 20, m1: 20, m2: 0, l: 20, h: 0, c: 40, corte: 740 },
  { carrera: 'Nutrición y Dietética', univ: 'PUC', area: 'Salud', nem: 20, m1: 20, m2: 0, l: 20, h: 0, c: 40, corte: 690 },
  { carrera: 'Ing. Civil (Plan Común)', univ: 'U. de Chile', area: 'Ingeniería', nem: 20, m1: 30, m2: 30, l: 10, h: 0, c: 10, corte: 836 },
  { carrera: 'Ingeniería Civil', univ: 'PUC', area: 'Ingeniería', nem: 20, m1: 30, m2: 30, l: 10, h: 0, c: 10, corte: 780 },
  { carrera: 'Ingeniería Civil', univ: 'USACH', area: 'Ingeniería', nem: 20, m1: 30, m2: 30, l: 10, h: 0, c: 10, corte: 742 },
  { carrera: 'Ingeniería Civil', univ: 'PUCV', area: 'Ingeniería', nem: 20, m1: 30, m2: 30, l: 10, h: 0, c: 10, corte: 720 },
  { carrera: 'Ing. Civil Informática', univ: 'U. de Chile', area: 'Ingeniería', nem: 20, m1: 35, m2: 25, l: 10, h: 0, c: 10, corte: 745 },
  { carrera: 'Ing. Civil Informática', univ: 'PUC', area: 'Ingeniería', nem: 20, m1: 35, m2: 25, l: 10, h: 0, c: 10, corte: 735 },
  { carrera: 'Ingeniería Industrial', univ: 'PUC', area: 'Ingeniería', nem: 20, m1: 30, m2: 30, l: 10, h: 0, c: 10, corte: 810 },
  { carrera: 'Ing. Civil Eléctrica', univ: 'U. de Chile', area: 'Ingeniería', nem: 20, m1: 30, m2: 30, l: 10, h: 0, c: 10, corte: 795 },
  { carrera: 'Ing. Civil Mecánica', univ: 'U. de Chile', area: 'Ingeniería', nem: 20, m1: 30, m2: 30, l: 10, h: 0, c: 10, corte: 780 },
  { carrera: 'Ingeniería Comercial', univ: 'PUC', area: 'Ciencias Sociales', nem: 20, m1: 30, m2: 20, l: 20, h: 10, c: 0, corte: 881 },
  { carrera: 'Ingeniería Comercial', univ: 'U. de Chile', area: 'Ciencias Sociales', nem: 20, m1: 30, m2: 20, l: 20, h: 10, c: 0, corte: 845 },
  { carrera: 'Ingeniería Comercial', univ: 'UAI', area: 'Ciencias Sociales', nem: 20, m1: 30, m2: 20, l: 20, h: 10, c: 0, corte: 790 },
  { carrera: 'Ingeniería Comercial', univ: 'USACH', area: 'Ciencias Sociales', nem: 20, m1: 30, m2: 20, l: 20, h: 10, c: 0, corte: 760 },
  { carrera: 'Psicología', univ: 'PUC', area: 'Ciencias Sociales', nem: 20, m1: 20, m2: 0, l: 30, h: 20, c: 10, corte: 881 },
  { carrera: 'Psicología', univ: 'U. de Chile', area: 'Ciencias Sociales', nem: 20, m1: 20, m2: 0, l: 30, h: 20, c: 10, corte: 864 },
  { carrera: 'Psicología', univ: 'UDP', area: 'Ciencias Sociales', nem: 20, m1: 20, m2: 0, l: 30, h: 20, c: 10, corte: 768 },
  { carrera: 'Sociología', univ: 'U. de Chile', area: 'Ciencias Sociales', nem: 20, m1: 10, m2: 0, l: 35, h: 35, c: 0, corte: 720 },
  { carrera: 'Periodismo', univ: 'U. de Chile', area: 'Ciencias Sociales', nem: 20, m1: 10, m2: 0, l: 40, h: 20, c: 10, corte: 754 },
  { carrera: 'Derecho', univ: 'PUC', area: 'Derecho', nem: 20, m1: 10, m2: 10, l: 30, h: 30, c: 0, corte: 869 },
  { carrera: 'Derecho', univ: 'U. de Chile', area: 'Derecho', nem: 20, m1: 10, m2: 10, l: 30, h: 30, c: 0, corte: 844 },
  { carrera: 'Derecho', univ: 'UAI', area: 'Derecho', nem: 20, m1: 10, m2: 10, l: 30, h: 30, c: 0, corte: 800 },
  { carrera: 'Derecho', univ: 'USACH', area: 'Derecho', nem: 20, m1: 10, m2: 10, l: 30, h: 30, c: 0, corte: 782 },
  { carrera: 'Derecho', univ: 'UDP', area: 'Derecho', nem: 20, m1: 10, m2: 10, l: 30, h: 30, c: 0, corte: 768 },
  { carrera: 'Astronomía', univ: 'U. de Chile', area: 'Ciencias', nem: 10, m1: 30, m2: 30, l: 10, h: 0, c: 20, corte: 830 },
  { carrera: 'Bioquímica', univ: 'U. de Chile', area: 'Ciencias', nem: 20, m1: 20, m2: 10, l: 10, h: 0, c: 40, corte: 820 },
  { carrera: 'Geología', univ: 'U. de Chile', area: 'Ciencias', nem: 20, m1: 25, m2: 25, l: 10, h: 0, c: 20, corte: 760 },
  { carrera: 'Biología', univ: 'PUC', area: 'Ciencias', nem: 20, m1: 20, m2: 10, l: 10, h: 0, c: 40, corte: 778 },
  { carrera: 'Arquitectura', univ: 'PUC', area: 'Arquitectura', nem: 20, m1: 30, m2: 0, l: 30, h: 10, c: 10, corte: 871 },
  { carrera: 'Arquitectura', univ: 'U. de Chile', area: 'Arquitectura', nem: 20, m1: 30, m2: 0, l: 30, h: 10, c: 10, corte: 857 },
  { carrera: 'Arquitectura', univ: 'USACH', area: 'Arquitectura', nem: 20, m1: 30, m2: 0, l: 30, h: 10, c: 10, corte: 795 },
  { carrera: 'Pedagogía en Matemáticas', univ: 'U. de Chile', area: 'Pedagogía', nem: 20, m1: 30, m2: 30, l: 10, h: 0, c: 10, corte: 745 },
  { carrera: 'Pedagogía en Castellano', univ: 'U. de Chile', area: 'Pedagogía', nem: 20, m1: 10, m2: 0, l: 40, h: 20, c: 10, corte: 680 },
  { carrera: 'Pedagogía en Historia', univ: 'U. de Chile', area: 'Pedagogía', nem: 20, m1: 10, m2: 0, l: 30, h: 30, c: 10, corte: 695 },
];
