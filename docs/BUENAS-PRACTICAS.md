# Buenas prácticas — CalculaPromedio Mobile

> **Fuente de inspiración:** [locphan87/react-native-architecture](https://github.com/locphan87/react-native-architecture) (guía de arquitectura React Native, **archivada en octubre 2021**).
> Este documento **no la copia**: toma sus principios que siguen vigentes, reemplaza las librerías obsoletas por sus equivalentes actuales y lo aterriza a cómo ya está construida esta app.
>
> Relacionado: plan y fases en `pagina_con_laravel/docs/MOBILE-ROADMAP.md`.

Última actualización: 2026-10-13

---

## 1. Principio central

> **"Escribe funciones pequeñas, reutilizables y componibles."**

En la práctica, en esta app:

- **La lógica de cálculo es pura** y vive fuera de los componentes (`src/lib/*.ts`): recibe números, devuelve números. Sin `useState`, sin efectos, sin tocar la UI. Así se puede probar y reutilizar.
- **Los componentes muestran**; no calculan. Una pantalla junta estado + lógica pura + piezas visuales.
- **Una pieza visual se escribe una vez** (`src/components/calculadora/*`) y la usan las 43 calculadoras.

---

## 2. Qué tomamos, qué cambiamos

| Idea de la guía (2021) | ¿Vigente? | En esta app (2026) |
|---|---|---|
| Funciones puras, inmutabilidad, sin efectos secundarios | ✅ Sí | `lib/matematica.ts`, `lib/estadistica.ts`, `lib/fechas.ts`, `lib/salud.ts` |
| Separar presentación de lógica | ✅ Sí | Pantallas usan `usePantallaCalculo` + piezas de `components/calculadora/` |
| Organizar por funcionalidad (feature) | ✅ Sí, adaptado | `expo-router` manda en `src/app/` (rutas = archivos); la lógica compartida va en `lib/` y `components/` |
| TypeScript estricto | ✅ Sí | `npx tsc --noEmit` debe pasar antes de cada commit |
| Tests junto al código, lógica pura testeable | ✅ Sí | Pendiente: agregar tests a `lib/` (ver §7) |
| Formatear con Prettier y lint en pre-commit | ✅ Sí | `npx expo lint` (ESLint); Prettier opcional |
| date-fns en vez de moment | ✅ Sí (idea) | Usamos `lib/fechas.ts` propio (sin dependencia); si crece, date-fns |
| Pantallas de error / carga / actualización | ✅ Sí | Necesario desde la Fase 3 (API) |
| Configuración por entorno (dev / prod) | ✅ Sí | `EXPO_PUBLIC_API_URL` en `.env` (Fase 3) |
| **Redux** para estado global | ⚠️ Reemplazado | **Zustand** (estado de usuario) + **TanStack Query** (datos del servidor) cuando llegue la API |
| **Recompose / HOCs** | ❌ Obsoleto | **Hooks** (`usePantallaCalculo`, `useFavorito`) |
| **Glamorous Native** (estilos) | ❌ Obsoleto | `StyleSheet` + `constants/theme.ts` (`Colors`, `Acento`, `Spacing`) |
| **TSLint** | ❌ Obsoleto | ESLint (`npx expo lint`) |
| **Enzyme** (tests) | ❌ Obsoleto | **Jest + React Native Testing Library** |
| **GraphQL** | ❌ No aplica | Laravel expone **REST + Sanctum** |
| Expo "detach" para funciones nativas | ❌ Obsoleto | **EAS Build** / development builds, sin expulsar |
| formik para formularios | ⚪ Opcional | Hoy los formularios son simples (estado local). Si llega login/registro: react-hook-form |
| i18n-js | ⚪ No por ahora | App solo en español de Chile |

---

## 3. Estructura de carpetas (actual)

```
src/
├── app/                         ← rutas (expo-router): un archivo = una pantalla
│   ├── _layout.tsx              ← tabs + tema
│   ├── index.tsx                ← home
│   ├── calculadoras/
│   │   ├── index.tsx            ← listado con búsqueda y categorías
│   │   └── <id>.tsx             ← una pantalla por calculadora (id = catálogo)
│   ├── favoritos.tsx
│   ├── perfil.tsx
│   └── resolver-foto.tsx
├── components/
│   └── calculadora/             ← piezas compartidas por TODAS las calculadoras
│       ├── pantalla.tsx         ← PantallaCalculadora + usePantallaCalculo
│       ├── header-calculadora.tsx
│       ├── piezas.tsx           ← AvisoInfo, Seccion, BotonPrimario, BarraAcciones…
│       ├── campos.tsx           ← CampoNumero, ChipsRapidos, Segmentado
│       ├── resultado.tsx        ← TarjetaResultado, DetalleCalculo, TONOS
│       ├── campo-fecha.tsx, lista-datos.tsx, datos-corporales.tsx
├── constants/
│   ├── calculadoras.ts          ← CATÁLOGO ÚNICO (nombre, ruta, categoría) + ESTILO_CARD (íconos)
│   └── theme.ts                 ← Colors.dark, Acento, Spacing, MaxContentWidth
├── hooks/                       ← use-favorito.ts
└── lib/                         ← lógica pura + datos
    ├── matematica.ts, estadistica.ts, fechas.ts, salud.ts
    ├── storage.ts               ← AsyncStorage (favoritos, historial, onboarding)
    └── tablas-nem.ts, tablas-paes.ts, carreras.ts   ← GENERADOS desde la web, no editar a mano
```

**Regla:** si algo lo usan 2 o más pantallas, sale de la pantalla y va a `components/` o `lib/`.

---

## 4. Convenciones de nombres

| Qué | Convención | Ejemplo |
|---|---|---|
| Archivos y carpetas | `kebab-case` | `nota-escala.tsx`, `campo-fecha.tsx` |
| Componentes | `PascalCase` | `TarjetaResultado`, `CampoNumero` |
| Funciones, variables, hooks | `camelCase`, hooks con `use` | `fmtPesos`, `usePantallaCalculo` |
| Constantes de módulo | `UPPER_SNAKE_CASE` | `CALC_ID`, `CALCULADORAS`, `MAX_HISTORIAL` |
| Tipos | `PascalCase` | `Calculadora`, `FilaDetalle`, `Tono` |
| Idioma | **Español** en nombres de dominio y UI | `promedio`, `calcular`, `limpiar` |

La guía original propone sufijos por tipo de archivo (`Login.view.tsx`, `Login.handler.tsx`). **No los usamos**: expo-router exige que el nombre del archivo sea la ruta, y las pantallas son lo bastante chicas para no dividirlas.

---

## 5. Reglas del proyecto (aprendidas en el desarrollo)

**Diseño**
- Tema 100% oscuro. Dentro de una calculadora, **un solo acento** (`Acento` indigo); los únicos colores extra son los estados (`TONOS`: ok / info / warning / error).
- Íconos: `@expo/vector-icons/Ionicons` (lucide fue descartado por fallas en Metro).
- Íconos y colores por calculadora salen de **`ESTILO_CARD`** — una sola fuente para home, listado, header y favoritos.

**Calculadoras**
- Toda calculadora nueva: usar `PantallaCalculadora` + `usePantallaCalculo` y agregarla al catálogo (`constants/calculadoras.ts` + `ESTILO_CARD`).
- Patrón fijo: Aviso → Sección con "Ejemplo" → botón Calcular → resultado con **detalle paso a paso** → explicación plegable con fórmula y tip PAES.
- Validar en cada campo y mostrar el error bajo el campo; el botón Calcular queda deshabilitado mientras haya error.
- Métodos de cálculo **iguales a la web** (para que ambas den el mismo resultado). Si la web tiene un error, se corrige en ambas y se documenta.

**Datos**
- Tablas oficiales (NEM, PAES, carreras) se **generan con un script** desde la web: nunca transcribir a mano.
- Lo que se guarda en el teléfono pasa por `lib/storage.ts` (claves versionadas `nombre:v1`), con try/catch: si falla, la app sigue funcionando.

**Seguridad**
- **Nunca** una API key en la app (se extrae del APK/IPA). Toda llamada a IA o servicios pagados pasa por Laravel.
- Tokens de sesión (Fase 3) en `expo-secure-store`, no en AsyncStorage.

**Assets**
- No borrar archivos de `assets/images` sin buscar antes sus `require()` (ya rompió la app dos veces).

---

## 6. Antes de cada commit

```bash
npx tsc --noEmit                 # sin errores de tipos
npx expo lint                    # sin errores de lint
npx expo export --platform android --output-dir <carpeta-temporal>   # el bundle compila
```

- Commits pequeños por funcionalidad, mensaje en español que explique el **qué** y el **por qué**.
- No mezclar en un commit trabajo de dos frentes distintos.

---

## 7. Pendientes de calidad

- [ ] Tests unitarios de `lib/` con Jest (`jest-expo`): son funciones puras, el lugar ideal para empezar (fórmulas NEM, redondeo chileno, horas extras, fechas).
- [ ] Tests de pantallas clave con React Native Testing Library.
- [ ] Hook de pre-commit (husky + lint-staged) que corra `tsc` y lint.
- [ ] Pantallas estándar de error / sin conexión / cargando (Fase 3).
- [ ] Ancho máximo centrado para tablets (`MaxContentWidth`).
