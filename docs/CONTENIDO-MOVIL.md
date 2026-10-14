# Plan: Banco de ejercicios + Teoría en la app móvil

> Estado: **planificado, no implementado**. Fuentes de contenido web de
> CalculaPromedio.cl:
> - **Banco**: `bank_questions`/`bank_options` — 242 preguntas de Matemáticas PAES
>   con solución paso a paso.
> - **Teoría**: tabla `teoria` (MySQL) — 51 lecciones publicadas (54 totales) en
>   los 4 ejes PAES, niveles M1/M2/bonus.
>
> La app móvil hoy no tiene ninguna feature de ejercicios, quiz ni lecciones.

## Decisiones pendientes (definen el alcance)

1. **Login**: ¿el banco en móvil parte en modo invitado (práctica sin guardar
   progreso en cuenta) o desde el v1 con login? En la web el banco exige usuario,
   pero no premium.
2. **Formato de soluciones**: las soluciones de la web son HTML pesado con CSS
   inline. Recomendado: limpiarlas a estructura simple en el servidor
   (`hint` + `steps[]` de texto) en vez de instalar un renderizador de HTML en RN.
3. **Progreso**: ¿solo local en el teléfono al inicio, o sincronizado con la
   cuenta web desde el principio?

## Fase 1 — API en Laravel (prerequisito)

Hoy no existe `routes/api.php` ni Sanctum (`bootstrap/app.php` solo registra
`web:` y `commands:`). Se agregaría:

- `POST /api/v1/login` — token Sanctum (si va con login)
- `GET /api/v1/banco/temas` — 4 temas con conteo por dificultad
- `GET /api/v1/banco/temas/{topic}/practica?dificultad=&cantidad=` — crea/devuelve
  sesión de N preguntas con sus alternativas (sin solución), orden aleatorio
- `POST /api/v1/banco/respuesta` — valida alternativa, devuelve `is_correct` +
  id de la correcta + solución estructurada (`hint` + `steps[]`)
- `POST /api/v1/banco/sesiones/{id}/cerrar` — resumen (correctas, incorrectas,
  duración) → guarda en `bank_practice_sessions`/`bank_practice_attempts` si hay login

Archivos: nuevo `app/Http/Controllers/Api/BancoApiController.php`, `routes/api.php`,
instalación de Sanctum, y limpieza de `solution_text` (split por `---` y extracción
de "Paso N") a formato JSON. La lógica de consulta ya existe en
`app/Http/Controllers/Exercise/Premium/BankController.php` (web).

## Fase 2 — Pantallas de la app móvil

Rutas nuevas bajo un grupo `/banco` (expo-router):

- `/banco` — hub: 4 cards de tema con conteo por dificultad + botón
  "Práctica personalizada" (después)
- `/banco/sesion` — pregunta actual: enunciado, imagen (`expo-image`), 4 botones
  A–D, botón Responder → feedback verde/rojo → "Ver solución" despliega pista y pasos
- Barra de progreso (pregunta 3/10), resumen final con aciertos y opción de reintentar

Componentes nuevos en `src/components/banco/`: `OptionButton`, `FeedbackBanner`,
`StepSolution`, `ProgressBar`. Estado de sesión con zustand (aprobado en
`docs/MOBILE-ROADMAP.md`, aún no usado) o context simple.

## Fase 3 — Cuenta y sincronización

- Login/registro en la app contra la API existente
- Enviar resultados de sesión a la API; historial en la pestaña Perfil
- Cache local con AsyncStorage para practicar offline y sincronizar después

## Fase 4 — Expansiones del banco (post-lanzamiento)

Práctica personalizada, desafío diario, mini-ensayos y luego los ensayos PAES premium.

---

# Teoría (misma base de API)

## Inventario web

51 lecciones publicadas en `teoria`: Números (14), Álgebra y Funciones (13),
Geometría (12), Probabilidad y Estadística (12); niveles M1 / M2 / bonus. Cada
lección trae: `contenido` HTML (~18 KB, **estilos inline, matemática Unicode —
sin LaTeX/KaTeX**, se puede renderizar en RN sin motor de fórmulas),
`contenido_cuaderno` (premium), `ejemplos`/`tips` en JSON, `formulas` (14/51),
imagen + mapa mental + infografía + video YouTube + PDF, **522 flashcards**
(SM-2) y **~296 actividades interactivas** de 65 tipos (lo más pesado de portar;
algunas usan JSXGraph). Rutas públicas: `/teoria/{tema}` y
`/teoria/{tema}/leccion/{slug}`.

## Fase T1 — API teoría (mismo scaffold Sanctum que Fase 1)

- `GET /api/v1/teoria/temas` — 4 temas con sus lecciones (id, slug, título, nivel, orden, duración, peso PAES)
- `GET /api/v1/teoria/lecciones/{id}` — contenido, ejemplos, tips, fórmulas y URLs de media
- `POST /api/v1/teoria/lecciones/{id}/completar` — auth, XP
- `GET /api/v1/teoria/lecciones/{id}/flashcards` + `POST .../flashcards/evaluar` — SM-2
- Actividades interactivas: **fase posterior** — evaluar portar las 65 tipos vs. rehacer un subconjunto en RN

## Fase T2 — Pantallas móviles de teoría

- `/teoria` — hub con 4 temas → lista de lecciones agrupadas por nivel (M1/M2/bonus), con check de completada
- `/teoria/leccion/[id]` — lector: contenido (decisión clave: WebView vs. limpieza a texto enriquecido), ejemplos/tips desplegables, media (YouTube embed, imágenes, link PDF), botón "Marcar completada"
- `/teoria/leccion/[id]/flashcards` — tarjeta anverso/reverso + autoevaluación (SM-2 local si modo invitado)
- Progreso local con AsyncStorage si no hay login

## Fase T3 — Expansiones de teoría (post-lanzamiento)

Cuaderno premium, actividades interactivas, tutor IA por lección.

---

## Orden sugerido y esfuerzo estimado

1. Fase 1 (API banco + limpieza de soluciones) — desbloquea todo; ~1 sesión
2. Fase T1 (API teoría, reusa el scaffold) — ~1 sesión
3. Fase 2 banco móvil modo invitado (hub + sesión + feedback + solución) — el grueso; ~2–3 sesiones
4. Fase T2 teoría móvil (hub + lector + flashcards) — ~2–3 sesiones; el render del HTML es el principal riesgo técnico
5. Fases 3/T3 (cuenta, sincronización, premium) — ~2–3 sesiones
6. Fases 4/T4 (expansiones) — por iteración
