---
title: Estilos y Temas
---

Este proyecto aplica estilo a todos los componentes con [PandaCSS](https://panda-css.com) (CSS-in-JS tipado, sin runtime) sobre `hono/jsx` puro — **no** uno de los frameworks JSX oficialmente admitidos por Panda (React/Vue/Solid/Qwik). Ese único hecho — `jsxFramework: undefined` en `panda.config.ts` — es la causa raíz de casi todas las regresiones de estilo que ha sufrido este proyecto, porque excluye silenciosamente a la base de código de varias cosas que Panda normalmente hace por ti. Esta página documenta la arquitectura resultante, los errores concretos que ya ha provocado, y la lista de verificación a seguir para que no se repitan.

---

## Cómo llegan los estilos de una receta a la página

1. Las **recetas (recipes)** se escriben en `app/theme/recipes/*.ts` con `defineRecipe` de Panda (clase única, p. ej. `badge.ts`) o `defineSlotRecipe` (componentes multiparte con ranuras/slots con nombre, p. ej. `switch.ts` — `root`/`control`/`thumb`/…).
2. Cada receta se registra mediante una clave de objeto en `app/theme/recipes/index.ts`, dentro de `recipes` (plana) o `slotRecipes` (con ranuras). **La clave de registro es aquello por lo que todo lo demás la referencia** — no el `className` de la receta, ni el nombre de su archivo. `switch.ts` exporta `switchRecipe` (`switch` es una palabra reservada) y se registra como `switchRecipe: switchRecipe`; `panda.config.ts` y cualquier código que haga referencia a la receta debe usar `switchRecipe`, nunca `switch`.
3. `panda.config.ts` extiende la configuración combinada de `app/theme/` (`theme: { extend: { ...theme.config } }`) y analiza `include: ["./app/**/*.{js,jsx,ts,tsx}"]` en busca de uso de estilos.
4. Panda escribe el sistema generado — funciones auxiliares de receta, tokens, patrones, el runtime `css`/`cx` — en `design-system/`, importado mediante el alias de Vite `design-system` (`vite.config.ts`). **`design-system/` está en `.gitignore`** — es un artefacto de compilación, regenerado desde cero en cada instalación/compilación mediante PostCSS (`postcss.config.cjs` conecta `@pandacss/dev/postcss`) y el script `prepare` (`panda codegen`, ejecutado una vez en `bun install`). Solo los archivos *fuente* — `app/theme/recipes/*.ts`, `panda.config.ts` — son lo que realmente se distribuye; nada de lo que hagas directamente en `design-system/` se confirma (commit) jamás.

### `codegen` frente a `cssgen` — a menudo necesitas ambos, a mano

| Comando | Regenera | Necesario después de |
| --- | --- | --- |
| `bunx panda codegen` | `design-system/recipes/*.mjs` + `.d.ts` — las funciones auxiliares de receta (`switchRecipe()`, `.splitVariantProps()`, `.variantKeys`, `.variantMap`) que el código de la aplicación llama en tiempo de ejecución | Añadir/eliminar/renombrar una **variante** en cualquier receta |
| `bunx panda cssgen` | `design-system/styles.css` — las reglas CSS generadas reales | Añadir/eliminar un **valor de variante**, o cambiar `staticCss` |

La integración de PostCSS de `vite dev` reextrae el CSS sobre la marcha a medida que editas, pero **no** regenera los archivos auxiliares de receta `.mjs`/`.d.ts` — esos son archivos generados planos que tu código importa directamente (`import { switchRecipe } from "design-system/recipes"`), no un módulo virtual transformado por Vite. Si añades una prop `colorPalette` a los `variants` de una receta y solo guardas el archivo, `switchRecipe.splitVariantProps()` sigue usando la lista `variantKeys` **obsoleta** hasta que ejecutes `panda codegen` — así que la nueva prop se enruta silenciosamente a "props locales" en lugar de "props de variante", y o bien se filtra al DOM como un atributo inválido o nunca llega a la función de estilo en absoluto. **Ejecuta ambos comandos a mano después de editar cualquier archivo de receta**, no asumas que el servidor de desarrollo lo detectó.

---

## `staticCss`: por qué casi toda receta se ve forzada a `["*"]`

El análisis estático de Panda solo puede pregenerar CSS para valores que puede ver literalmente en el código fuente (`<Badge size="sm">`) — o, para integraciones con frameworks JSX, mediante el mapeo `jsx: [...]` de cada receta (`button.ts` y un puñado de otras lo usan). Los componentes de esta base de código se llaman como `recipeName(variantProps)` dentro de archivos primitivos, siempre con un **objeto calculado en tiempo de ejecución** (`switchRecipe.splitVariantProps(props)`), y la mayor parte del contenido es JSON redactado en el CMS (`content/pages/*.json`) con valores de color/tamaño/variante que no existen en ningún lugar como literal de cadena en código fuente `.tsx`. El extractor de Panda no puede ver nada de esto, así que **toda receta sin un mapeo `jsx` debe forzarse a generar todas sus combinaciones de variantes** mediante `staticCss.recipes: { <recipeKey>: ["*"] }` de `panda.config.ts` — usando la *clave de registro* de `app/theme/recipes/index.ts`, no el `className` de la receta.

Así es exactamente como ocurrió el error de tamaño de switch (más abajo), y es un peligro sistémico: **cualquier error tipográfico entre la clave de `staticCss.recipes` y el nombre real de exportación/registro de la receta reduce silenciosamente la generación de esa receta a cero variantes no predeterminadas**, sin ningún error, advertencia o fallo de tipos en ninguna parte — Panda simplemente emite en silencio el CSS de base + variante predeterminada y nada más. Si añades una receta completamente nueva, recuerda añadir de inmediato su entrada de clave de registro a `staticCss.recipes`, y verifica que la clave coincida exactamente con `app/theme/recipes/index.ts` (usa `grep` para buscar la clave en ambos archivos si tienes dudas).

---

## Regresiones conocidas y las reglas que las previenen

### 1. La clave de `staticCss.recipes` debe coincidir con el nombre de registro de la receta, no con su `className`

**Síntoma:** todo valor de variante no predeterminado (p. ej. `size="sm"`/`"lg"` en `<Switch>`) se renderiza con las propiedades personalizadas CSS simplemente sin definir — un elemento colapsado e invisible de 0×0, o sin estilo alguno — mientras que la variante predeterminada se ve bien.

**Causa:** `switch.ts` exporta `switchRecipe` (registrado bajo esa clave en `slotRecipes`), pero `staticCss.recipes` de `panda.config.ts` tenía `switch: ["*"]` — una clave que no coincide con nada. Solo se distribuye el CSS de base + `defaultVariants` (Panda siempre emite esos independientemente de `staticCss`); cualquier otro valor de variante obtiene silenciosamente cero CSS generado.

**Solución:** la clave en `staticCss.recipes` debe ser la clave de registro exacta de `app/theme/recipes/index.ts` (`switchRecipe`, no `switch`). Es fácil equivocarse en cualquier receta cuyo archivo/className no coincida con su nombre de exportación, y no da **ninguna** señal en tiempo de compilación o de ejecución cuando está mal — verifica buscando con grep en el CSS generado la clase de variante que esperas (p. ej. `grep "switch__root--size_sm" design-system/styles.css`) después de cualquier edición de `staticCss`, no te fíes solo de mirar la configuración.

**Esto se repitió tres veces** en la misma receta antes de solucionarse de verdad, porque `design-system/` está en `.gitignore` — ejecutar `cssgen` después de arreglar la configuración produce una salida *local* correcta, pero si la propia edición de `panda.config.ts` nunca se confirma (commit), el error regresa en cuanto alguien más regenera. **La única parte duradera de cualquier arreglo de `staticCss`/receta es la edición del archivo fuente** (`panda.config.ts`, `app/theme/recipes/*.ts`) — confirma siempre con `git status`/`git diff` que esos archivos están realmente en el área de preparación (staged), no solo que el CSS local se vea bien.

### 2. Las variantes de una receta con ranuras deben tener clave de ranura, o Panda las descarta silenciosamente

**Síntoma:** una clase de variante está presente en el HTML renderizado (`carousel__root--colorPalette_green`), el estilo pretendido está completamente ausente, y el CSS generado tiene **cero** reglas para esa clase — ni siquiera una vacía.

**Causa:** en un `defineSlotRecipe`, todo valor de variante debe anidar sus estilos bajo el nombre de la ranura a la que apunta:

```ts
// WRONG — silently produces no CSS at all in a slot recipe
variants: {
  colorPalette: {
    blue: { colorPalette: "blue" },
  },
},

// RIGHT — slot-keyed
variants: {
  colorPalette: {
    blue: { root: { colorPalette: "blue" } },
  },
},
```

Un `defineRecipe` plano (sin ranuras — `badge.ts`, `anchor.ts`, `button.ts`) usa correctamente la forma *sin ranuras*; copiar ese patrón en un `defineSlotRecipe` (cualquiera con un array `slots: [...]`) es el error. Esto ha afectado de forma independiente a `rating-group.ts`, `carousel.ts` y `clipboard.ts` — es una trampa fácil de copiar y pegar entre los dos tipos de receta, y vale la pena revisarlo de nuevo cada vez que la nueva variante de una receta con ranuras "no hace nada".

### 3. Los estilos condicionales de `base` pierden frente a los estilos de `variant` para la misma propiedad CSS — siempre, independientemente de la especificidad

**Síntoma:** un estilo condicional/dependiente del estado colocado en el bloque `base` de una receta con ranuras (p. ej. `&[data-complete]: { borderColor: ... }`) nunca se aplica, aunque se confirma que el atributo/clase está presente en el DOM y que la propia regla CSS está presente en la hoja de estilos.

**Causa:** Panda emite los estilos de `base` y los estilos de `variants` en **capas de cascada CSS separadas**, con la capa de variantes ordenada después de la de base. El orden de capas CSS vence incondicionalmente a la especificidad del selector — un selector `base` muy específico sigue perdiendo frente a una regla incondicional simple en la capa `variants` si ambas fijan la misma propiedad.

**Solución:** mueve la anulación condicional a **cada bloque `variant.<name>.<slot>` relevante** en lugar de a `base`, esparciendo (spread) un objeto compartido en cada uno si los estilos se repiten. El manejo de `_invalid` en `app/theme/recipes/input.ts` (duplicado por variante, no centralizado en `base`) es el patrón de referencia ya existente.

### 4. Los tokens `colorPalette.*` se resuelven a un color real (grisáceo, casi negro), nunca a "ningún color" — se requiere un *ámbito (scope) activo*

**Síntoma:** un componente con estilo `bg: "colorPalette.solid.bg"`, etc., se renderiza en un gris/negro oscuro y apagado sin importar qué prop `colorPalette` se haya pasado (o incluso si la receta no tiene ningún concepto de `colorPalette`).

**Causa:** `colorPalette.*` son tokens virtuales que se resuelven contra las propiedades personalizadas `--colors-color-palette-*` que estén en ámbito (scope) en ese nodo del DOM. El tema establece un **ámbito predeterminado global en `gray`** en `:root`/`html`, así que en cualquier lugar donde no haya un ámbito de colorPalette más específico activo, `colorPalette.solid.bg` se resuelve silenciosamente a `gray.solid.bg` — no transparente, no un error, un color real (oscuro). Esto es fácil de diagnosticar erróneamente como "roto" cuando en realidad es solo "sin ámbito asignado".

**Solución:** aplica un ámbito de colorPalette real, según el patrón centralizado que se describe más abajo — no asumas que un componente "simplemente no tiene color" porque se ve gris/negro.

### 5. Las props de variante responsivas no emiten CSS de punto de interrupción (breakpoint)

`<Heading size={{ base: "2xl", md: "3xl" }}>` renderiza correctamente `class="heading--size_2xl md:heading--size_3xl"` en el HTML, pero nunca se genera ninguna regla `@media` para la clase `md:` — `staticCss.recipes: ["*"]` solo fuerza la generación de clases de variante literales, no responsivas; no las multiplica (cross-product) con condiciones de punto de interrupción. **Nunca pases un objeto responsivo como prop de variante**; usa un valor literal plano, o una anulación envolvente con `css()`/clase de utilidad para la propiedad específica que necesite cambiar según el punto de interrupción (las clases de utilidad planas no tienen esta limitación, solo las props de variante de receta).

---

## Temas con `colorPalette`: el patrón centralizado

Los frameworks JSX oficialmente admitidos por Panda obtienen `colorPalette` "gratis": su wrapper `styled()` separa automáticamente una prop `colorPalette` de cualquier componente y la fusiona como una clase de utilidad genérica, junto con lo que produzcan las variantes propias de la receta. **Este repositorio no obtiene eso**, porque `jsxFramework: undefined`. Las recetas de [Park UI](https://park-ui.com) upstream (la fuente de componentes original de este proyecto, portada a mano a `hono/jsx`) dependen exactamente de esa integración ausente — su propio `switch.ts` tampoco tiene una variante `colorPalette`.

Durante años, para un subconjunto de componentes, esto se solucionó de forma provisional **declarando a mano una variante `colorPalette` en la propia receta** (`badge.ts`, `anchor.ts`, `button.ts`, …), copiando y pegando el mismo mapa de paleta de ~11 entradas en cada una. Ese enfoque es lo que causó la mayoría de los errores anteriores: es fácil olvidarlo en un componente nuevo (`switch.ts`/`avatar.ts`/`card.ts`/`checkbox.ts` nunca lo obtuvieron, así que su prop `colorPalette` no hacía nada en silencio), es fácil equivocarse entre la forma con ranuras y sin ranuras (§2), y dispersó la misma lista de nombres de paleta — con desviaciones (drift) — a lo largo de una docena de archivos (los mapas hechos a mano de algunas recetas referenciaban `teal`/`indigo`/`pink`/`yellow`, nombres de paleta que ni siquiera existen en `app/theme/colors/` de este tema — esos tampoco habrían hecho nada, en silencio).

**El patrón actual** (a partir de la pasada de centralización de `colorPalette`) reemplaza todo eso con una única utilidad compartida:

- `staticCss.css` de `panda.config.ts` fuerza la generación de la clase de utilidad `colorPalette` plana de Panda (`.color-palette_blue`, etc.) para cada nombre de paleta real que el tema realmente define (`gray`/`blue`/`green`/`red`/`orange`/`purple`/`cyan`/`amber` — consulta `app/theme/colors/*.ts` para conocer la lista actual antes de añadir un nombre nuevo en cualquier lugar).
- `app/components/ui/color-palette.ts` exporta `colorPaletteClass(colorPalette?: string)`, que resuelve alias (`success`→green, `error`→red, `warning`→orange, `slate`→gray — `slate` en particular se usa en todo el contenido del CMS aunque la escala de grises de este tema solo está registrada como `gray`) y devuelve la clase de utilidad correcta.

**Para añadir compatibilidad con `colorPalette` a un componente** (un componente cuya receta referencia tokens `colorPalette.*` pero no ofrece ninguna forma de que el consumidor realmente elija uno):

1. **No** añadas una variante `colorPalette` a la receta. Deja las referencias a tokens `colorPalette.*` de la receta tal como están.
2. En la primitiva del componente (`*-primitive.tsx`), desestructura `colorPalette` de las props **antes** de que cualquier spread `...rest`/`...restProps` aterrice en el nodo del DOM — igual que con cualquier otra prop conocida — para que nunca se filtre como un atributo HTML inválido `colorpalette="..."`.
3. Si el componente ya tenía antes un color predeterminado codificado de forma rígida, consérvalo como un valor predeterminado de JS plano en la desestructuración (`colorPalette = "blue"`), no como una entrada `defaultVariants` de la receta.
4. Fusiona `colorPaletteClass(colorPalette)` en la lista de clases de la **ranura raíz/principal** — `cx(styles.root, colorPaletteClass(colorPalette), classProp)` — para que se propague en cascada a las ranuras descendientes mediante la herencia normal de propiedades personalizadas CSS. Solo necesita ir en el elemento más externo que establece el ámbito, nunca en cada ranura.
5. Si el componente se compone mediante un proveedor de contexto (p. ej. `ButtonGroup` → `Button` vía `ButtonContext`), asegúrate de que `colorPalette` se propague explícitamente a través de ese valor de contexto — ya no forma parte de `variantProps`, así que cualquier código que antes reenviaba solo `variantProps` para propagar el color necesita que `colorPalette` se añada de nuevo a mano.
6. Regenera (`panda codegen && panda cssgen`) y verifica: renderiza el componente, busca con grep en el HTML de SSR (o en `design-system/styles.css`) la clase `color-palette_<name>` esperada, y confirma que no se haya filtrado ningún atributo `colorpalette=` desnudo al DOM.

No reintroduzcas un mapa de variante `colorPalette` por receta para un componente nuevo — ese es exactamente el patrón que esta centralización reemplazó, precisamente porque no escala y regresiona en silencio.

---

## Colores de tokens frente a tokens semánticos

- **`tokens.colors`** (`app/theme/tokens/colors.ts`) — valores estáticos puros (negro, blanco).
- **`semanticTokens.colors`** (`app/theme/index.ts`, `app/theme/colors/*.ts`) — las escalas de paleta adaptativas (gray/slate, blue, red, green, orange, purple, cyan, amber), cada una compilada en propiedades personalizadas automáticas para modo claro/oscuro.

**Evita los tokens genéricos `bg`/`fg`** — compilan a CSS transparente/inválido en este tema (el plugin "Remove Panda Preset Colors" en `panda.config.ts` elimina el preset de color predeterminado de Panda, y los `bg`/`fg` genéricos nunca se reemplazaron). Usa en su lugar tokens semánticos explícitos: `gray.surface.bg`, `fg.default`, `gray.outline.border`, etc. Los popups/desplegables/paneles de autocompletado en particular deben usar `gray.surface.bg` (no `colorPalette.surface.bg`) para que el fondo del panel siga siendo una superficie opaca neutral independientemente de qué color de acento esté activo en el disparador.

### Dónde vive realmente el acento predeterminado de todo el sitio

Cada archivo de color en `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate`) es una opción de `colorPalette` completamente formada y lista para usar — forma idéntica (una escala 1–12, una escala alfa a1–a12, y subgrupos `solid`/`subtle`/`surface`/`outline`/`plain`, cada uno con `bg`/`fg`). Que un color exista en ese directorio solo significa que se generó (p. ej. mediante la CLI de Park UI al inicializar el proyecto) — no dice nada sobre si está *activo* en algún lugar.

**Nada en Panda en sí, y nada en la salida de la CLI de Park UI (`components.json`), persiste qué color eliges como "el" acento durante la inicialización** — no hay una clave de configuración para eso en ninguno de los dos. Lo único que realmente decide el predeterminado de todo el sitio es una línea escrita a mano:

```ts
// app/theme/global-css.ts
html: {
  colorPalette: "gray",
  // ...
},
```

Esto establece el ámbito raíz de `colorPalette` que hereda todo elemento sin ámbito propio. Es una declaración CSS simple, fácil de pasar por alto y fácil de perder de vista — si alguna vez te preguntas "por qué este proyecto usa `gray` como su acento en lugar de `cyan`/lo que sea que elegí al inicializar", esta línea es la respuesta, y cambiarla es una edición de una sola línea y bajo riesgo (cada archivo de color tiene la misma forma de token, así que intercambiar el valor es un reemplazo limpio y directo).

**Este predeterminado es solo un respaldo (fallback).** Cualquiera de los 13 componentes migrados al patrón centralizado `colorPaletteClass()` anterior (switch, badge, button, card, …) lleva su **propio** predeterminado explícito (ver la lista por componente en esa sección) y no seguirá un cambio en esta línea — solo los componentes/utilidades sin un `colorPalette` explícito propio (las propiedades personalizadas globales de anillo de foco/selección también declaradas en `global-css.ts`, y cualquier receta aún no migrada) realmente leen este valor raíz.

### `fg`/`border`/`canvas` son deliberadamente solo-gris (gray-only), siempre

`fg.default`, `fg.muted`, `fg.subtle`, `border` y `canvas` (declarados en `semanticTokens.colors` de `app/theme/index.ts`) están codificados de forma rígida directamente a `colors.gray.*` — **no** a `colors.colorPalette.*`. Esto es intencional, no una carencia: es la convención estándar de Radix/Park UI de "un acento + un gris" — el texto del cuerpo, los bordes y el fondo de página deben permanecer neutrales sin importar qué acento esté activo, tanto por contraste/legibilidad como para que el acento se lea como un acento en lugar de teñir toda la página. No "arregles" estos para que referencien `colorPalette.*` esperando que adopten el acento del sitio; eso sería una regresión, no una mejora. Solo las superficies genuinamente interactivas/de marca (el estado marcado de un control, el relleno sólido de un botón, el fondo de un badge, …) deben referenciar `colorPalette.*` — confirmado como el patrón real en cada receta de control (`switch.ts`, `checkbox.ts`, `badge.ts`, `button.ts`: el estado neutral/sin marcar usa un token `gray.*` codificado de forma rígida, el estado marcado/de acento usa `colorPalette.*`).

---

## Lista de verificación tras cualquier cambio de receta o de `panda.config.ts`

No confíes en un vistazo visual — todos los errores anteriores *parecían* que no había ningún problema hasta que se inspeccionaron de cerca (un elemento negro/gris se lee como "estilo predeterminado", no como "roto").

1. `bunx panda codegen && bunx panda cssgen` (desde la raíz del repositorio — comprueba `pwd` primero; ejecutar esto desde un subdirectorio escribe silenciosamente `design-system/` en la ubicación anidada incorrecta en lugar de dar un error).
2. Busca con grep en el CSS generado la clase específica que esperas: `grep "switch__root--size_sm" design-system/styles.css`, `grep "color-palette_blue" design-system/styles.css`.
3. Renderiza la página real (servidor de desarrollo o `bun test`) y busca con grep en la salida HTML de SSR la misma clase, y la *ausencia* de cualquier nombre de prop crudo filtrado como atributo del DOM (`colorpalette="..."`, `size="..."`, etc. en un elemento que no debería tenerlo).
4. `bun test` — ejecuta la suite unitaria completa; una prueba obsoleta que verifica un formato de nombre de clase antiguo es un falso positivo común después de una refactorización de estilos, vale la pena leerla rápidamente antes de asumir una regresión real.
5. `git status`/`git diff` de los archivos **fuente** (`panda.config.ts`, `app/theme/recipes/*.ts`, `app/components/ui/*.tsx`) — nunca de `design-system/`, que está en `.gitignore` y se descarta. Un arreglo que "funciona localmente" pero que nunca se llegó a confirmar (commit) en el código fuente no es un arreglo.

---

## Preguntas frecuentes

### ¿Cómo puedo cambiar el color de acento predeterminado de todo el sitio?

Edita una línea en `app/theme/global-css.ts`:

```ts
html: {
  colorPalette: "cyan", // was "gray"
  colorScheme: { _light: "light", _dark: "dark" },
},
```

El valor debe ser uno de los nombres de paleta que realmente existen en `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate` — registrado como `gray`). Cada uno de esos archivos tiene la misma forma de token (`solid`/`subtle`/`surface`/`outline`/`plain`, cada uno con `bg`/`fg`), así que esto es un intercambio limpio y seguro — no es necesario cambiar ningún otro token junto con él.

Luego:

1. `bunx panda codegen && bunx panda cssgen` para regenerar.
2. Comprueba el resultado: `fg`/`border`/`canvas` (texto del cuerpo, divisores, fondo de página) **no** cambiarán — están deliberadamente codificados de forma rígida a la escala de grises neutral independientemente del acento, ver más arriba. Solo las superficies genuinamente impulsadas por el acento (un switch/checkbox marcado, un botón sólido, un badge sin ámbito propio, anillos de foco, selección de texto) adoptarán el nuevo color.
3. Recuerda que esto solo cambia el **respaldo (fallback)**. Cualquiera de los 13 componentes ya migrados a `colorPaletteClass()` (switch, badge, button, anchor, card, checkbox, carousel, clipboard, date-picker, radio-card-group, rating-group) lleva su propio predeterminado explícito por componente y necesita que cada uno se actualice a mano en su primitiva (`app/components/ui/*-primitive.tsx`, el valor predeterminado de la desestructuración `colorPalette = "..."`) si también quieres que sigan el nuevo acento del sitio, en lugar de mantener su predeterminado actual elegido individualmente.
