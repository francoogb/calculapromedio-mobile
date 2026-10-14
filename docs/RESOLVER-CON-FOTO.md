# Resolver con foto — diseño del flujo

> Función planificada para la **versión 1.2** (requiere Fase 3: login + API Sanctum).
> Resumen corto en `pagina_con_laravel/docs/MOBILE-ROADMAP.md` §9.2.

Última actualización: 2026-10-13

---

## 1. El problema

Si el estudiante fotografía **una página completa del cuaderno** (varios ejercicios, fórmulas, anotaciones, dibujos), un modelo de IA que intenta resolver todo de una vez puede:

- detectar varios ejercicios y no saber cuál resolver,
- leer en desorden,
- **mezclar datos** de un ejercicio con otro (ej. usar un número del ejercicio 2 en el 4).

**Principio de diseño:** la app nunca decide en silencio qué resolver cuando hay varias opciones. Se separan tres tareas que, juntas en un solo paso, generan errores difíciles de depurar:

1. **Detectar** dónde está cada ejercicio.
2. **Reconocer** correctamente su contenido.
3. **Resolverlo.**

---

## 2. Flujo: detectar → seleccionar → resolver

```
1. Fotografiar        2. Detectar             3. El estudiante       4. Resolver solo
   la página    →        ejercicios     →        elige uno       →      ese recorte
                         (recuadros               (o dibuja el
                          numerados)               recuadro a mano)
```

1. **Fotografiar la página.** Se corrige orientación y se revisa nitidez y luz.
2. **Detectar los ejercicios.** Un modelo con visión devuelve las regiones (coordenadas) que parecen ejercicios. *No* se le pide transcribir ni resolver todo.
3. **Seleccionar.** La app muestra la foto con **recuadros numerados** superpuestos. El estudiante toca uno → aparece "Resolver ejercicio 3". Si la detección falló, puede **dibujar el recuadro con el dedo**.
4. **Resolver solo ese ejercicio.** Se envía únicamente el recorte. Si el modelo no está seguro de lo que leyó, **muestra lo que entendió y pide confirmación** antes de resolver.

### Cómo se ve en la app

```
┌──────────────────────────────┐
│  [ foto de la página ]       │
│  ┌──1──────────┐             │
│  │ 2x + 3 = 11 │             │
│  └─────────────┘  ┌──2────┐  │
│  ┌──3──────────┐  │ √49 … │  │
│  │ Un tren ... │  └───────┘  │
│  └─────────────┘             │
├──────────────────────────────┤
│ Toca un ejercicio o dibuja   │
│ un recuadro  ✏️              │
│ [ Resolver ejercicio 3 ]     │
└──────────────────────────────┘
```

---

## 3. Dos modos para la primera versión

| Modo | Para qué | Flujo |
|---|---|---|
| **Rápido** | Foto con **un solo** ejercicio | Detectar → si hay uno, ofrecer resolverlo directo |
| **Página completa** | Varios ejercicios | Detectar → recuadros numerados → elegir uno |

Más adelante: resolver **varios ejercicios seguidos**, conservando su numeración y resultados por separado.

---

## 4. Casos difíciles

| Situación | Comportamiento |
|---|---|
| Un ejercicio aislado | Detectarlo y ofrecer resolverlo directamente |
| Varios ejercicios separados | Recuadros numerados para elegir |
| Fórmulas mezcladas con anotaciones | Permitir seleccionar la región a mano |
| Foto borrosa o con sombras | Pedir otra foto (botón "Volver a tomar") |
| Detección dudosa | Mostrar la foto original y pedir confirmación |
| Ejercicio cortado por el borde | Avisar que faltan datos antes de resolver |
| Nada que parezca un ejercicio | "No encontramos un ejercicio en la foto" + consejos de encuadre |

---

## 5. Implementación técnica (adaptada a nuestro stack)

> Nuestro backend es **Laravel** (no Node/Express) y el Tutor IA actual usa **DeepSeek, que no lee imágenes**. Para visión se necesita otro modelo (opciones en el roadmap §9.2: Claude, o un modelo económico de OpenAI a evaluar).
> **Regla:** la app nunca llama al modelo directamente — la API key quedaría expuesta en el APK/IPA.

```
App (Expo)                                   Laravel                           Modelo con visión
──────────                                   ───────                           ─────────────────
expo-image-picker (foto)
expo-image-manipulator:
  rotar + reducir a ~1.600 px, JPEG 0.8
        │
        ├─ POST /api/ai/foto/detectar ───────→ valida, throttle, límites ──→ "devuelve recuadros
        │   (imagen reducida, base64)          freemium                       {x,y,w,h} normalizados
        │                                                                      0–1 + confianza" (JSON)
        │  ←─────────────── [{n, x, y, w, h, confianza}] ←─────────────────────┘
        │
  muestra recuadros sobre la foto
  estudiante elige / dibuja uno
  expo-image-manipulator: recorta
    esa región + 5 % de margen
        │
        └─ POST /api/ai/foto/resolver ───────→ ──────────────────────────────→ 1) transcribe (LaTeX)
            (solo el recorte)                                                  2) confianza
                                                                               3) solución en pasos
           ←── {enunciado_leido, confianza, pasos[], respuesta, eje_tematico} (JSON estructurado)
  si confianza baja: "¿Es esto lo que
  quieres resolver?" [Sí] [Corregir texto]
  muestra pasos con TarjetaResultado /
  DetalleCalculo
```

**Decisiones clave:**

- **Recortar en el teléfono** (`expo-image-manipulator`), no en el servidor: se envía menos peso, se gasta menos en el modelo y la región elegida es exactamente la que el estudiante vio.
- **Coordenadas normalizadas (0 a 1)** respecto de la imagen que se envió para detectar. Así sirven aunque la foto se muestre en otro tamaño en pantalla: `px = x × anchoMostrado`. Si la app redimensiona o rota la imagen después, hay que transformar las coordenadas con la misma operación.
- **Salida en JSON estructurado** (no texto libre) para poder mostrar los pasos con el mismo diseño que las calculadoras y detectar baja confianza.
- **Margen de ~5 %** alrededor del recorte para no cortar exponentes, signos o subíndices.
- **Resultado enlazado a la teoría:** el `eje_tematico` devuelto permite sugerir la lección correspondiente ("Repasa: Ecuaciones lineales").

**Laravel (Fase 3+):**

- Rutas `POST /api/ai/foto/detectar` y `POST /api/ai/foto/resolver` con `auth:sanctum` y `throttle`.
- Límites como el Tutor IA: invitado 0, gratis N fotos al día, Premium ilimitado. Contar **resoluciones**, no detecciones.
- Validar tamaño y tipo de imagen; no guardar las fotos (o borrarlas al terminar) — declararlo en la política de privacidad y en las etiquetas de privacidad de Apple.
- Registrar uso y costo por usuario para vigilar el gasto.

---

## 6. Calidad antes de lanzar

- Armar un set de **20–30 fotos reales** de cuadernos chilenos (escritura a mano, fotocopias, guías impresas, pizarras) y medir: ¿detecta bien los recuadros?, ¿lee bien el enunciado?, ¿resuelve correctamente?
- Usar ese mismo set para **comparar modelos** (precio vs. aciertos) antes de elegir uno.
- Mostrar siempre "Verifica el resultado" y enlazar a la lección de teoría: el modelo puede equivocarse.

---

## 7. Orden de construcción sugerido

1. Modo rápido (un ejercicio, sin recuadros) para validar lectura + resolución.
2. Detección con recuadros numerados.
3. Recuadro manual con el dedo.
4. Varios ejercicios seguidos.
