---
title: Hidratación
---

Este proyecto utiliza la arquitectura de **Hidratación de Islas** de [HonoX](https://github.com/honojs/honox) y [**@hono/vite-ssg**](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) para la Generación de Sitios Estáticos de las páginas, emitiendo **HTML estático** por defecto, y solo los componentes que realmente necesitan interactividad del lado del cliente son "promovidos" a islas (fragmentos de JS del cliente).

> El comportamiento de hidratación de cada componente converge en el predicado `shouldHydrate`
> de `app/components/ui/island-utils.ts`. Cualquier decisión sobre _cuándo renderizar HTML estático_
> frente a _cuándo montar una isla del lado del cliente_ se resuelve aquí — consulta
> [Hidratación](/docs/Hydration) para el modelo de niveles completo, las reglas de decisión y la
> clasificación por componente.

1. **Cero JS redundante** — los componentes sin interacción nunca necesitan enviar un script de hidratación.
2. **Cero fallos silenciosos** — los componentes que _sí_ necesitan interacción deben hidratarse automáticamente, incluso si quien los llama olvida pasar `interactive`.
3. **Fuente única de verdad** — cada decisión de "¿debe hidratarse este componente?" pasa por una única función compartida `shouldHydrate`, eliminando las ramas ad hoc `if (interactive)` por componente.

## El predicado central

`app/components/ui/island-utils.ts`:

```ts
/**
 * Decide whether a component should hydrate as a client-side island.
 *
 * @param interactive - the component's `interactive` prop (boolean | undefined)
 * @param hasSignal   - whether the component carries a "behaviour signal": an event
 *                      handler (onClick / onValueChange …) or a controlled/default
 *                      state (value / checked / open …) that only makes sense with JS.
 *
 * Semantics:
 *  - interactive === false → never hydrate (explicit opt-out)
 *  - interactive === true  → always hydrate (explicit opt-in)
 *  - interactive omitted    → hydrate iff hasSignal is true
 */
export function shouldHydrate(interactive: unknown, hasSignal: boolean): boolean {
	return interactive !== false && Boolean(interactive || hasSignal);
}
```

### Tabla de verdad

| `interactive` | `hasSignal` | Resultado | Significado |
| --- | --- | --- | --- |
| `false` | cualquiera | `false` | Prohibido explícitamente hidratar (puramente estático) |
| `true` | cualquiera | `true` | Forzado explícitamente a hidratar |
| `undefined` | `true` | `true` | Detección inteligente: señal presente → hidratar |
| `undefined` | `false` | `false` | Detección inteligente: sin señal → estático |

***

## El modelo de 3 niveles

### Nivel 1 — Auto-interactivo

> **Regla central: `shouldHydrate(interactive, true)`**

Estos componentes _son_ la interacción — todo su valor depende del JS del cliente
(superposiciones, modales, asas de arrastre, expandir/colapsar). Se hidratan
a menos que quien los llama pase explícitamente `interactive={false}`.

Se aplica a:

- Familias de superposición / popover (tooltip, hover-card, popover, menu)
- Modales / cajones / arrastre (dialog, drawer, splitter)
- Expandir / colapsar (collapsible)
- Singletons puramente del cliente (toast)

### Nivel 2 — Auto-detección inteligente

> **Regla central: `shouldHydrate(interactive, hasSignal)`**

Estos componentes son _estáticos por defecto, interactivos solo cuando hay una señal presente_.
Son **controles de formulario controlados/no controlados o grupos seleccionables**: la hidratación
solo importa cuando se proporciona un estado (`value` / `checked` / `defaultValue`) o un manejador
(`onChange` / `onClick` …); de lo contrario, el marcado estático es suficiente.

Se aplica a:

- Controles de formulario (button, checkbox, switch, textarea, field, slider, combobox, radio-group)
- Grupos seleccionables (segment-group, toggle-group)
- Tablas con clic en filas (table)
- Avatar con `src` (la carga asíncrona de la imagen / el ciclo de vida de error es una señal exclusiva del cliente)
- Paginación / tags-input (estado + manejadores; una paginación `type="link"` que proporciona
  `getPageUrl` es navegación pura y permanece estática)

### Nivel 3 — Presentacional

> **Nunca monta una isla**

Componentes puramente tipográficos / decorativos sin comportamiento del cliente. **No deben declarar**
**una propiedad `interactive`** (históricamente `badge` / `heading` / `text` / `fieldset` la declararon
por error y filtraron el atributo al DOM — ahora eliminado).

Se aplica a:

- Tipografía (text, heading, badge)
- Layout (group, absolute-center, fieldset)
- Indicadores de estado (alert, breadcrumb, loader, skeleton, spinner, progress)
- Gráficos (icon)

***

## Clasificación completa de componentes

> Leyenda de estado: `✅` cumple con la convención; `⚠️` diverge de la convención y
> necesita migración (ver Sección 7). Tras la última pasada de limpieza, **todos los componentes son `✅`**.

### Nivel 1 (auto-interactivo)

| Componente | Regla | Disparador | Estado |
| --- | --- | --- | --- |
| `dialog` | `shouldHydrate(interactive, true)` | Siempre se hidrata salvo `interactive={false}` | ✅ `dialog.tsx` |
| `drawer` | `shouldHydrate(interactive, true)` | Siempre se hidrata salvo `interactive={false}` | ✅ `drawer.tsx` |
| `splitter` | `shouldHydrate(interactive, true)` | Siempre se hidrata salvo `interactive={false}` | ✅ `splitter.tsx` |
| `tooltip` | `shouldHydrate(interactive, true)` | Siempre se hidrata | ✅ `tooltip.tsx` |
| `hover-card` | `shouldHydrate(interactive, true)` | Siempre se hidrata | ✅ `hover-card.tsx` |
| `popover` | `shouldHydrate(interactive, true)` | Siempre se hidrata | ✅ `popover.tsx` |
| `menu` | `shouldHydrate(interactive, true)` | Siempre se hidrata | ✅ `menu.tsx` |
| `select` | `shouldHydrate(interactive, true)` | Siempre se hidrata — abrir el desplegable y seleccionar un elemento requieren JS; no hay alternativa estática (el `<select>` nativo está visualmente oculto y solo existe para el envío del formulario) | ✅ `select.tsx` (Nivel 1) |
| `collapsible` | `shouldHydrate(interactive, true)` | Siempre se hidrata (expandir/colapsar necesita JS) | ✅ `collapsible.tsx` (Nivel 1) |
| `toast` | Siempre isla (singleton del cliente) | Sin propiedad, siempre es una isla | ✅ `toast.tsx` |

### Nivel 2 (auto-detección inteligente)

| Componente | Señal de comportamiento (`hasSignal` es true cuando…) | Estado |
| --- | --- | --- |
| `button` | `onClick` / `onPointerDown` / `onSubmit` | ✅ `button.tsx` |
| `card` | `onClick` / `onPointerDown` | ✅ `card.tsx` |
| `table` | cualquier `row.onClick` | ✅ `table.tsx` |
| `segment-group` | `value` / `defaultValue` / `onValueChange` | ✅ `segment-group.tsx` |
| `toggle-group` | `value` / `defaultValue` / `onValueChange` | ✅ `toggle-group.tsx` |
| `slider` | `value` / `defaultValue` / `onChange` / `onDraggingChange` | ✅ `slider.tsx` |
| `checkbox` | `checked` / `defaultChecked` / `onCheckedChange` | ✅ `checkbox.tsx` |
| `switch` | `checked` / `defaultChecked` / `onCheckedChange` | ✅ `switch.tsx` |
| `textarea` | `value` / `defaultValue` / `onValueChange` / `validator` / `minLength` | ✅ `textarea.tsx` |
| `field` | `value` / `defaultValue` / `onValueChange` / `validator` / `minLength` | ✅ `field.tsx` |
| `combobox` | `open` / `inputValue` / `onToggle` / `onInputChange` / `onItemSelect` | ✅ `combobox.tsx` |
| `radio-group` | `value` / `defaultValue` / `onValueChange` | ✅ `radio-group.tsx` |
| `avatar` | `src` (carga asíncrona de imagen / ciclo de vida de error) | ✅ `avatar.tsx` (Nivel 2) |
| `pagination` | `onPageChange`, o `page` / `defaultPage` / `pageSize` / `defaultPageSize` fuera del modo enlace | ✅ `pagination.tsx` |
| `tags-input` | `onValueChange` / `onInputValueChange` / `value` / `inputValue` / `defaultValue` / `defaultInputValue` | ✅ `tags-input.tsx` |
| `paginated-table` | Siempre isla (gestiona el estado interno de paginación) | ✅ `paginated-table.tsx` (lógica de Nivel 2) |
| `date-picker` | `value` / `defaultValue` / `focusedValue` / `open` / `defaultOpen` / `onValueChange` / `onOpenChange` / (eventos de teclado/clic/escritura) | ✅ `date-picker.tsx` |
| `color-picker` | `value` / `defaultValue` / `format` / `defaultFormat` / `open` / `defaultOpen` / `onValueChange` / `onFormatChange` / `onOpenChange` / (eventos de puntero/teclado/entrada) | ✅ `color-picker.tsx` |

### Nivel 3 (presentacional)

| Componente | Notas | Estado |
| --- | --- | --- |
| `text` | Texto tipográfico | ✅ |
| `heading` | Encabezado | ✅ |
| `badge` | Insignia | ✅ (propiedad `interactive` muerta eliminada) |
| `fieldset` | Conjunto de campos de formulario | ✅ (propiedad `interactive` muerta eliminada) |
| `alert` | Caja de alerta | ✅ |
| `breadcrumb` | Migas de pan | ✅ |
| `group` | Agrupación de layout | ✅ |
| `absolute-center` | Layout de centrado | ✅ |
| `loader` | Indicador de carga | ✅ |
| `skeleton` | Pantalla esqueleto | ✅ |
| `spinner` | Indicador giratorio | ✅ |
| `progress` | Barra de progreso (impulsada por valor, estática por defecto) | ✅ |
| `icon` | Envoltorio de icono SVG (solo tamaño/color, sin estado del cliente) | ✅ `icon.tsx` |

***

## Condiciones de disparo por nivel

### Condiciones del Nivel 1

- La interacción central del componente (abrir una superposición, arrastrar un splitter, expandir/colapsar,
  atrapar el foco en un modal) **no puede expresarse en HTML puro**, por lo que `hasSignal`
  es `true` por defecto.
- La única forma legal de exclusión es `interactive={false}` (por ejemplo, deshabilitar a la fuerza una
  superposición dentro de un documento puramente estático).
- `toast` es especial: es un singleton global del cliente (`toaster.create(...)`), y no
  expone una propiedad `interactive`.

### Condiciones del Nivel 2

El `hasSignal` de cada componente es un OR booleano sobre "¿está definida esta propiedad?":

```typescript
// Typical pattern (segment-group shown)
const hasSignal =
	rest.value !== undefined ||
	rest.defaultValue !== undefined ||
	rest.onValueChange !== undefined;
if (shouldHydrate(interactive, hasSignal)) return <SegmentGroupIsland {...rest} />;
return <Root {...rest}>{/* static structure */}</Root>;
```

Principios de decisión:

1. **Estado controlado** (`value` / `checked` / `open` / `inputValue`) → necesita JS para mantenerse sincronizado.
2. **Valor inicial no controlado** (`defaultValue` / `defaultChecked`) → necesita JS para mantener el estado interno.
3. **Manejadores de eventos** (`onChange` / `onClick` / `onValueChange` / `onItemSelect` …) → necesitan JS para responder.
4. **Validación / restricciones** (`validator` / `minLength`) → necesitan JS para ejecutarse.
5. **Señales asíncronas / exclusivas del cliente** — `src` en `avatar` (implica un ciclo de vida de carga/error),
   o cualquier propiedad cuyo único propósito sea un efecto del lado del cliente (medios, intersección, carga
   diferida). Estas no pueden resolverse sin JS, por lo que cuentan como señal.
6. Cualquiera de los anteriores presente hace que `hasSignal` sea true, lo que dispara la hidratación;
   si todos están ausentes, el componente se renderiza como marcado puramente estático.

> **`avatar` es especial entre los componentes de Nivel 2:** su señal es la pista de carga asíncrona `src`.
> Cuando `src` está presente, la imagen necesita manejo de carga/error del lado del cliente, por lo que
> `shouldHydrate(interactive, Boolean(src))` la hidrata; un `avatar` sin `src` (por ejemplo, un
> respaldo de iniciales) permanece estático. Un `interactive={false}` explícito suprime la hidratación incluso
> cuando existe `src` (consistente con la semántica de "`false` gana" en toda la librería).

> **Excepción del modo enlace de `pagination`:** una paginación `type="link"` que proporciona `getPageUrl`
> es navegación pura (cada página es un anclaje), por lo que permanece estática a menos que se proporcione
> explícitamente un manejador `onPageChange`. Solo en modo botón (o con `onPageChange`) las propiedades
> `page` / `defaultPage` / `pageSize` / `defaultPageSize` cuentan como señales.

### Condiciones del Nivel 3

- El componente no mantiene estado del cliente ni responde a eventos.
- No declara una propiedad `interactive`. (Históricamente `badge` / `heading` / `text` /
  `fieldset` la declararon por error, filtrando `interactive="true"` al DOM; eso se ha
  eliminado en la limpieza.)

***

## Lista de verificación de decisión para componentes nuevos

Recorre la lista en orden; detente en la primera coincidencia:

1. **¿Su existencia depende por completo del JS del cliente?**
   Superposición / modal / arrastre / expandir-colapsar → **Nivel 1**, usa
   `shouldHydrate(interactive, true)`.
2. **¿Es un control de formulario o un componente visualmente seleccionable que puede ser controlado o**
\*\*   no controlado?\*\*
   button / checkbox / switch / slider / combobox / tabla con clic en fila … → **Nivel 2**,
   define `hasSignal` (estado + manejadores) y luego llama a `shouldHydrate(interactive, hasSignal)`.
3. **¿Es puramente tipográfico / de layout / decorativo?**
   text / heading / alert / group / progress … → **Nivel 3**, sin propiedad `interactive`, sin isla.

**Requisitos de implementación estrictos:**

- Ningún componente puede escribir una rama `if (interactive) { … }` desnuda; siempre debe pasar por `shouldHydrate`.
- `interactive` es solo una "perilla": `true` fuerza, `false` prohíbe, `undefined` delega en `hasSignal`.
- Cada componente de Nivel 1 / Nivel 2 debe agregar una sección `# Hydration` a su
  `content/components/<Component>.mdx` y referenciar cruzadamente este archivo, y establecer
  su campo de frontmatter `hydration` (`1` / `2` / `3`) para que coincida.

***

## Registro histórico de limpieza (ya corregido)

Las siguientes divergencias se resolvieron durante el despliegue de la convención; se conservan aquí para trazabilidad:

| # | Componente | Divergencia original | Corrección |
| --- | --- | --- | --- |
| 1 | `splitter` / `dialog` / `drawer` | `interactive = true` codificado + `if (interactive)`, sin pasar por `shouldHydrate` | Cambiado a `shouldHydrate(interactive, true)`, restaurando la exclusión `interactive={false}` |
| 2 | `radio-group` | `interactive ? Island : Root`, obligando a quien lo llama a pasar `interactive` | Cambiado a `shouldHydrate(interactive, hasSignal)`, con señales `value` / `defaultValue` / `onValueChange` |

| 3 | `avatar` | \`if (rest.src |  | interactive)\` ad hoc | Cambiado a `shouldHydrate(interactive, Boolean(rest.src))`, punto de entrada unificado |

| 4 | `badge` / `heading` / `text` / `fieldset` | Propiedad `interactive` muerta declarada, filtrada al DOM vía `restProps` (`interactive="true"`) | Eliminada la declaración de la propiedad `interactive` |
| 5 | `collapsible` | Nivel no documentado explícitamente | Se agregó una sección `# Hydration` a `docs/Collapsible.md`, marcándolo como Nivel 1 |
| 6 | `tags-input` | Rama desnuda `if (isInteractive)`, sin propiedad `interactive`, sin `shouldHydrate`, y `defaultValue` / `defaultInputValue` omitidos del conjunto de señales (un tags-input no controlado se renderizaba como estático) | Cambiado a `shouldHydrate(interactive, hasSignal)`, se agregó la perilla `interactive`, se extendió el conjunto de señales para incluir `defaultValue` / `defaultInputValue` |
| 7 | `pagination` / `avatar` | Ausentes de las tablas de nivel (`pagination` completamente ausente; `avatar` mal clasificado como Nivel 1) y `pagination` sobre-hidratado en modo enlace | Se agregaron `pagination` + `tags-input` al Nivel 2; se movió `avatar` al Nivel 2 (señal de pista de carga); se restringió el modo enlace de `pagination` para que la navegación pura permanezca estática |

> Nota: el elemento 4 fue un bug real — `badge` / `heading` / `text` / `fieldset` renderizaban
> `interactive` como un atributo HTML inválido en el DOM; se priorizó su reparación.

***

## Documentación relacionada

- [Arquitectura de componentes de UI](/docs/Architecture) — la visión general a nivel de proyecto
- `app/components/ui/island-utils.ts` — el único punto de entrada de decisión
- `content/components/<Component>.mdx` (cada componente de Nivel 1 / Nivel 2) — su propia sección `# Hydration`, más el frontmatter `hydration`/`category`
