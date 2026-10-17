# API — CalculaPromedio.cl (Laravel)

Contratos de la API REST que consume la app. Backend: `pagina_con_laravel` (Laravel 12 + Sanctum).

- **Base URL (producción):** `https://calculapromedio.cl/api/v1`
- **Base URL (desarrollo local):** `http://<ip-del-pc>/pagina_con_laravel/public/api/v1` (ver `.env` → `EXPO_PUBLIC_API_URL`)
- **Auth:** token Bearer de Sanctum, **sin vencimiento**. Se invalida al cerrar sesión, eliminar la cuenta o cambiar la contraseña.
- **Formato:** JSON siempre. Enviar `Accept: application/json` y `Content-Type: application/json`.
- **Errores de validación:** HTTP 422 con el formato estándar de Laravel (`{ "message": "...", "errors": { "campo": ["..."] } }`).
- **Sin token / token revocado:** HTTP 401 `{ "message": "Unauthenticated." }` → la app debe cerrar sesión local y volver a login.
- **Rate limit login/register:** 5 intentos por minuto (HTTP 429 al superarlo).

## Convenciones

- Un token por dispositivo. Al registrar/loguear se puede enviar `device_name` (string, default `"app"`) para identificar el dispositivo.
- Los usuarios admin (`perfil_id = 1`) pueden usar la app como cualquier usuario; la API no expone funciones de admin.
- `avatar` llega como **URL completa** (no hay que prefijar nada).

## Objeto `user`

```json
{
  "id": 55,
  "nombre": "Prueba Curl",
  "email": "prueba.curl@test.com",
  "avatar": "https://calculapromedio.cl/avatars/astronaut_owl_avatar.png",
  "google": false,
  "is_premium": true,
  "premium_until": "2026-10-19T22:25:51-03:00",
  "racha": 3,
  "xp": 120,
  "telefono": null,
  "como_nos_conociste": null
}
```

- `is_premium`: `true` solo si el premium está vigente (ya calculado en el servidor).
- `premium_until`: fecha ISO 8601 o `null` si nunca tuvo premium.
- `racha`: días consecutivos de actividad (`current_streak`).
- `xp`: XP total de actividades interactivas (`SUM(xp_ganada)`). Solo lectura por ahora.
- `telefono`, `como_nos_conociste`: pueden venir `null` (son opcionales en la app).

Nota sobre el envoltorio: en `register`/`login` el `user` viene directo junto al `token`; en `GET/PATCH /me` viene bajo la clave `data` (JsonResource). Ejemplos abajo.

---

## POST /register

Crea la cuenta. Teléfono y "cómo nos conociste" son **opcionales** (se completan después en el perfil). El usuario nuevo recibe 5 días de premium de prueba.

**Request:**

```json
{
  "nombre": "Ana Pérez",
  "email": "ana@test.com",
  "password": "password123",
  "password_confirmation": "password123",
  "telefono": "987654321",
  "como_nos_conociste": "Google",
  "device_name": "Pixel 7"
}
```

(`telefono`, `como_nos_conociste` y `device_name` opcionales. `password` mínimo 8 caracteres, requiere `password_confirmation`.)

**Response 201:**

```json
{
  "token": "1|7LMmU1zspY2aXMzWodqxbJeKEigmxOVfimh95KNI89c6fc5c",
  "user": { "...": "objeto user (sin envoltorio data)" }
}
```

Correo duplicado → 422 con `errors.email`.

## POST /login

**Request:**

```json
{ "email": "ana@test.com", "password": "password123", "device_name": "Pixel 7" }
```

**Response 200:** mismo formato que register (`{ token, user }`).

Credenciales incorrectas → 422:

```json
{
  "message": "Credenciales Incorrectas",
  "errors": { "email": ["Las credenciales no coinciden con nuestros registros."] }
}
```

## POST /forgot-password

Envía al correo un enlace para restablecer la contraseña. No requiere token. El enlace abre la web (`/reset-password/{token}`): la contraseña nueva se escribe allí, la app no la maneja. Mismo servicio que la web (`PasswordResetService`).

**Request:**

```json
{ "email": "ana@test.com" }
```

**Response 200:** `{ "message": "Hemos enviado un enlace de recuperación a tu correo electrónico." }`

Correo sin cuenta o con formato inválido → 422 con `errors.email` (igual que la web, avisa si no existe la cuenta):

```json
{
  "message": "No existe ninguna cuenta con este correo electrónico.",
  "errors": { "email": ["No existe ninguna cuenta con este correo electrónico."] }
}
```

Rate limit: 5 intentos por minuto (HTTP 429 al superarlo).

## POST /reset-password

Cambia la contraseña con el token del correo de recuperación. No requiere token de sesión. El token del correo **vence a los 60 minutos** y es de **un solo uso**. Al cambiar la contraseña se revocan todos los tokens de sesión de la app (hay que volver a iniciar sesión).

**Request:**

```json
{
  "email": "ana@test.com",
  "token": "<token del enlace /reset-password/{token}>",
  "password": "nueva-clave-123",
  "password_confirmation": "nueva-clave-123"
}
```

**Response 200:** `{ "message": "Contraseña actualizada exitosamente." }`

Token incorrecto, vencido o ya usado → 422 con `errors.token`:

```json
{
  "message": "El enlace de recuperación no es válido o ha expirado.",
  "errors": { "token": ["El enlace de recuperación no es válido o ha expirado."] }
}
```

Contraseña de menos de 8 caracteres o sin coincidir con la confirmación → 422 con `errors.password`. Rate limit: 5 intentos por minuto.

Pantalla de la app: `src/app/(auth)/reset-password/[token].tsx`. Su ruta coincide con la URL del enlace del correo (`/reset-password/{token}?email=...`) para que, cuando estén configurados los enlaces de Android (ver `docs/MOBILE-LOGIN.md`), el mismo enlace abra la app.

## GET /me

Requiere `Authorization: Bearer <token>`.

**Response 200** (con envoltorio `data`):

```json
{ "data": { "...": "objeto user" } }
```

## PATCH /me

Actualiza nombre, teléfono y/o "cómo nos conociste". Todos los campos opcionales; enviar solo lo que cambie. Requiere token.

**Request:**

```json
{ "nombre": "Ana P.", "telefono": "987654321", "como_nos_conociste": "TikTok" }
```

**Response 200:** `{ "data": { "...": "objeto user actualizado" } }`

## POST /logout

Revoca **solo** el token usado en la petición. Requiere token.

**Response 200:** `{ "message": "Se cerró la sesión exitosamente" }`

Después de esto el mismo token responde 401.

## DELETE /account

Elimina la cuenta de verdad (usuario, metadatos y datos en cascada; todos los tokens quedan inválidos). Irreversible. Requiere token.

**Response 200:** `{ "message": "Cuenta eliminada exitosamente" }`

---

## Pendientes (no implementados aún)

| Endpoint | Estado |
|----------|--------|
| `POST /api/v1/auth/google` | Etapa 3 — login con Google (id_token) |
| Sincronización de progreso (favoritos, historial, XP) | Fase 4, fuera de la 1.1 |

## Ejemplos curl

```bash
# Registro
curl -X POST https://calculapromedio.cl/api/v1/register \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"nombre":"Ana","email":"ana@test.com","password":"password123","password_confirmation":"password123"}'

# Login
curl -X POST https://calculapromedio.cl/api/v1/login \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"email":"ana@test.com","password":"password123"}'

# Me
curl https://calculapromedio.cl/api/v1/me \
  -H "Authorization: Bearer <token>" -H "Accept: application/json"
```
