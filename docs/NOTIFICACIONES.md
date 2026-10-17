# Notificaciones de la app — campana y centro de notificaciones

Última actualización: 2026-10-17

> Objetivo: mantener a los usuarios al tanto de novedades y actualizaciones de CalculaPromedio, también a quienes aún no tienen cuenta.

---

## 1. Qué existe hoy (implementado, sin publicar)

| Pieza | Archivo | Qué hace |
|---|---|---|
| Almacén local | `src/lib/notificaciones.ts` | Guarda las notificaciones en el teléfono (`AsyncStorage`, máximo 50). Funciones: `cargarNotificaciones()`, `marcarTodasLeidas()`, `agregarNotificacion()` |
| Campana | `src/components/notificaciones/campana.tsx` | Punto rojo si hay notificaciones sin leer **o** pendientes del perfil. Se vuelve a calcular cada vez que la pantalla recupera el foco |
| Centro de notificaciones | `src/app/notificaciones.tsx` | Muestra, en este orden: "Completa tu perfil" (con cuenta), invitación a iniciar sesión (sin cuenta) y la lista de notificaciones. Al abrirlo marca todo como leído, pero esa visita aún las muestra como "nuevas" |

### Tipos de aviso (hoy son tres, de naturaleza distinta)

1. **Notificación guardada** (la bienvenida y las futuras novedades): vive en el almacén local, tiene `id`, `titulo`, `texto`, `fecha` y `leida`.
2. **Pendiente del perfil** ("Completa tu perfil"): no se guarda; se calcula a partir del usuario (falta teléfono o "cómo nos conociste"). Desaparece al completarlo.
3. **Invitación a iniciar sesión**: tampoco se guarda; se muestra mientras no haya sesión y desaparece sola al iniciarla. No enciende el punto de la campana, para no insistir.

### Regla de la bienvenida

- La primera vez que se carga el almacén se siembra **"¡Te damos la bienvenida a CalculaPromedio.cl!"**, sin leer. Se siembra una sola vez (clave `notificaciones_sembrada:v1`); si se borra, no vuelve a aparecer.
- `agregarNotificacion()` **retira la bienvenida**: solo se muestra mientras no haya otras notificaciones.
- Hoy nada llama a `agregarNotificacion()`, así que la bienvenida permanece. El mecanismo está listo para cuando se conecte el servidor.

### Cómo agregar una notificación desde la app (hoy)

```ts
import { agregarNotificacion } from '@/lib/notificaciones';

await agregarNotificacion({
  id: 'primera-foto',          // único: si ya existe, se reemplaza (no se duplica)
  titulo: '¡Resolviste tu primer ejercicio!',
  texto: 'Sigue practicando: te quedan fotos hoy.',
});
```

Sirve para avisos que nacen en el teléfono (hitos, recordatorios). Para novedades que decidimos nosotros, ver la sección 2.

---

## 2. Cómo seguir agregando notificaciones (propuesta, sin construir)

Hay tres capas. Se pueden construir en este orden, y cada una funciona sin la siguiente.

### Capa A — Novedades publicadas desde el servidor (recomendada primero)

La forma de "mantener al tanto" a todos, **incluidos invitados**, sin infraestructura nueva.

**Laravel**
- Tabla nueva `app_novedades`: `id`, `titulo`, `texto`, `enlace` (opcional), `audiencia` (`todos` / `invitados` / `registrados`), `publicar_desde`, `expira` (opcional), `activo`.
- Pantalla en `/admin` para crear, programar y desactivar avisos.
- Endpoint público `GET /api/v1/novedades` (sin login, con `throttle`), que devuelve solo avisos vigentes y activos. Para filtrar por audiencia, la app envía si hay sesión; si hay token, el servidor lo usa.

**App**
- Al abrir la app y al volver a primer plano, pide las novedades (como máximo una vez por hora).
- Cada novedad se guarda con `agregarNotificacion({ id: 'novedad-<id>', ... })`. Como el `id` es el mismo, **no se repite** aunque se pida muchas veces.
- La primera novedad que llegue retira la bienvenida (regla de la sección 1).
- Si una novedad expira o se desactiva, se retira de la lista en la siguiente sincronización.

Contrato propuesto:

```json
GET /api/v1/novedades
{
  "data": [
    { "id": 12, "titulo": "Nuevo: Resolver con foto", "texto": "Fotografía un ejercicio…",
      "enlace": "app://resolver-foto", "publicado_en": "2026-11-02T10:00:00-03:00" }
  ]
}
```

Límite de esta capa: el usuario solo las ve al abrir la app. No avisa con la app cerrada.

### Capa B — Notificaciones personales de la cuenta

La web ya tiene un sistema por usuario: `InAppNotification` (título, mensaje, enlace, categoría, ícono) servido por `InAppNotificationService`. Hoy se genera por eventos: cierre de la liga semanal, avatares desbloqueados, pérdida del liderazgo del ranking.

Para llevarlo a la app habría que exponerlo en la API (`GET /api/v1/notificaciones` y marcar como leídas) y que la app lo combine con el almacén local. Ojo: el `url` de cada una es una ruta de la web; para la app hay que traducirla (o ignorarla).

### Capa C — Notificaciones push (con la app cerrada)

Usan `expo-notifications` y Firebase (FCM), una tabla de tokens por dispositivo y envío desde Laravel. Piden permiso al usuario (Android 13 en adelante) y **no funcionan en Expo Go**: requieren un build de desarrollo o de producción. Es la capa más costosa de mantener. Conviene después de la A, cuando haya contenido que justifique interrumpir al usuario.

**Recomendación:** empezar por la capa A. Cubre el objetivo (informar a todos), reutiliza lo ya construido (`agregarNotificacion`) y no depende de un build nuevo. La B se agrega cuando haya notificaciones personales relevantes en móvil. La C, al final.

---

## 3. Criterios al redactar avisos

- Solo avisar de cosas que existen: no prometer funciones que la app aún no tiene.
- Una novedad = una idea y, si corresponde, un enlace. Texto corto.
- No usar el punto rojo para insistir: el punto es de lo que el usuario no ha visto.
- Con `id` estable por aviso para evitar duplicados.

## 4. Pendientes y preguntas abiertas

- **Unificar con la web (decidido el 2026-10-17: se hará después).** Hoy este plan cubre solo la app. La idea acordada es una sola tabla de novedades que alimente ambas: la app la pide por el endpoint público y la campana del dashboard web la mezcla con las notificaciones personales (`InAppNotification`). Falta decidir el diseño del estado "leído" en la web (tabla de lecturas por usuario) y qué ven los visitantes sin cuenta en el sitio público (la campana solo existe en el dashboard; serviría un aviso aparte). No crear una notificación personal por usuario por cada novedad: deja fuera a los invitados y crece con los usuarios.
- Capa A: tabla, administración, endpoint y sincronización en la app (nada construido).
- Definir los enlaces internos (`app://…`) y cómo la app los abre.
- Decidir la frecuencia de sincronización final y qué hacer con los avisos viejos (hoy se conservan hasta 50).
- Las notificaciones se guardan solo en el teléfono: al desinstalar se pierden y la bienvenida vuelve a aparecer.
- Sin tests automatizados del almacén.
