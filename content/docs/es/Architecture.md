---
title: Arquitectura
---

Este proyecto está construido sobre [**HonoX**](https://github.com/honojs/honox), un meta-framework sobre [Hono](https://hono.dev) que añade enrutamiento basado en archivos, islas (islands) servidor/cliente y generación de sitios estáticos. El estilo lo gestiona [PandaCSS](https://panda-css.com) (CSS-in-JS tipado, sin runtime en tiempo de ejecución), el contenido se redacta mediante [Sveltia CMS](https://sveltiacms.app) (`/admin/`), y todo el sitio se pre-renderiza a HTML estático.

| Capa | Herramienta |
| --- | --- |
| Framework | [HonoX](https://honox.dev) |
| Enrutamiento | Basado en archivos, bajo `app/routes/` |
| Estilo | [PandaCSS](https://panda-css.com) → `design-system/` |
| Contenido | Markdown / MDX / JSON bajo `content/` |
| CMS | [Sveltia CMS](https://sveltiacms.app), respaldado por Git, en `/admin/` |
| SSG | [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) |
| Despliegue | Cloudflare Pages (`wrangler.jsonc`) o Vercel (`vercel.json`) |

***

## La compilación: dos pasadas de Vite, un sitio estático

`bun run build` ejecuta `vite build --mode client && vite build` — dos pasadas separadas sobre el mismo `vite.config.ts`, conmutadas por `mode`:

- **`--mode client`** compila `app/client.ts` (`createClient()` desde `honox/client`) con `jsxImportSource: "hono/jsx/dom"`. Este es el bundle del navegador: hidrata las islas y nada más.
- **La pasada por defecto (servidor)** compila `app/server.ts` (`createApp()` desde `honox/server`) con `jsxImportSource: "hono/jsx"` (el runtime JSX de SSR), y luego entrega toda la aplicación al plugin [`ssg()`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg), que rastrea cada ruta y escribe el HTML pre-renderizado en `dist/`.

### Enrutado SSG y correcciones de URL localizadas

Para evitar errores de enrutado 404 en los alojamientos de archivos estáticos tras la compilación de rutas, un `fixSsgRoutingPlugin` personalizado en `vite.config.ts` procesa de forma recursiva todos los archivos `.html` de la salida de compilación (`dist/`). Renombra y mueve los archivos de índice/página de inicio localizados (p. ej. `zh.html`, `docs/fr.html`) a rutas limpias anidadas (`zh/index.html`, `docs/fr/index.html`) si existe un directorio coincidente o si el nombre corresponde a una locale admitida. Esto garantiza que `/zh` y otros puntos finales localizados se resuelvan correctamente como índices de directorio en cualquier alojamiento estático.

### Resolución del entorno de pruebas

Para ejecutar pruebas unitarias de componentes Hono JSX en Bun, `bunfig.toml` se configura específicamente con:

```toml
[jsx]
runtime = "classic"
pragma = "h"
fragment = "Fragment"
importSource = "hono/jsx"
```

Esto garantiza una resolución estándar del runtime de Hono y evita errores de runtime JSX de desarrollo faltante durante la ejecución de las pruebas.

El plugin `mdx()` se limita únicamente a `include: /\.mdx$/` — el `.md` simple (entradas de blog, la mayoría de los docs) se deja deliberadamente fuera para que los imports `?raw` de `app/utils/markdown.ts` no se corrompan por la transformación MDX.

***

## Enrutamiento basado en archivos

Las rutas se encuentran bajo `app/routes/`, registradas en `app/server.ts` mediante `import.meta.glob` sobre `**/*.{ts,tsx,md,mdx}`, excluyendo las convenciones de archivos privados de HonoX (`_*`, `-*`, `$*`) y los archivos de prueba. Un archivo de ruta exporta handlers (`GET`, `POST`, …) o un componente por defecto; `[slug].tsx` / `[[slug]].tsx` proporcionan segmentos dinámicos/opcionales, conformes a las propias convenciones de enrutado de HonoX.

### Rutas API estáticas personalizadas

En HonoX, las rutas API estáticas personalizadas (p. ej. `app/routes/api/posts.json.ts`) que exportan una ruta estándar que devuelve `c.json(...)` se compilan automáticamente en archivos JSON estáticos (p. ej. `dist/api/posts.json`) mediante el plugin `@hono/vite-ssg` durante la compilación SSG. No se necesita configuración de parámetros dinámicos para estos puntos finales estáticos.

### Pre-renderizado de rutas dinámicas mediante ssgParams

Cualquier ruta dinámica (como `/blog/by-author/[author].tsx`) debe implementar y exportar el middleware `ssgParams` en la definición de la ruta para declarar todos los valores de parámetros potenciales para el pre-renderizado en tiempo de compilación.

### Enrutado localizado y redirecciones heredadas

Las rutas de las colecciones traducibles (`docs`, `blog`, `pages`) siguen `/<collection>/<locale?>/<item>`, sin que la locale por defecto (`en`) ocupe un segmento:

```plain
/docs/AbsoluteCenter        (en)
/docs/fr/AbsoluteCenter     (fr)
/blog/my-post               (en)
/blog/zh/my-post            (zh)
```

Las **páginas de inicio de idioma** independientes de la locale se encuentran en el segmento de locale desnudo (`/fr`, `/zh`, …). Todo esto se centraliza en `app/lib/i18n.ts` (`detectLocale`, `localiseHref`, `stripLocale`, `localeToggleUrl`) — ningún archivo de ruta implementa manualmente la lógica de locale. Una forma de ruta heredada, `/<locale>/<collection>/<item>`, se redirige con un 301 a la forma actual mediante un middleware en `app/server.ts`, de modo que los marcadores/enlaces antiguos siguen funcionando.

Las locales admitidas se declaran una sola vez, en `ALL_LOCALES` / `TRANSLATED_LOCALES` (`app/lib/i18n.ts`) — esta lista debe permanecer sincronizada con `i18n.locales` de `public/admin/config.yml` y los directorios de rutas espejo `app/routes/<locale>/`.

***

## Arquitectura de componentes

La base de código mantiene dos árboles paralelos bajo `app/`:

- **`app/components/ui/`** — la API de componentes pública (~100 componentes).
- **`app/islands/`** — las contrapartes hidratadas en el cliente, una por componente interactivo, integradas en el bundle del cliente y montadas por `honox/client`.

### Seguridad de servidor sin hooks

Para garantizar una generación de sitio estático sin contratiempos, **todos los hooks reactivos del lado del cliente (`useEffect`, `useRef`, `useState` desde `hono/jsx`) están estrictamente restringidos al directorio `/islands/`**. Los archivos bajo el directorio `/components/ui/` permanecen totalmente libres de hooks y son seguros para el renderizado estático/SSR del servidor. Los wrappers estáticos (como `Dialog` y `Drawer` en `components/ui/`) que reenvían referencias usan un objeto plano estático de respaldo (`{ current: null }`) en lugar de `useRef` para evitar la ejecución de hooks del cliente en el servidor.

### Resolución segura de estilos entre islas

Los componentes multiparte como `HoverCard` que renderizan hijos a través de los límites de isla de HonoX deben implementar una resolución de estilo de respaldo segura (p. ej. `context?.styles || recipe()`) en sus subcomponentes primitivos para garantizar que los nombres de clase se rellenen completamente tanto en los estados SSR/SSG pre-renderizados como en los estados del cliente hidratado.

### Posicionamiento de superposiciones y trucos de interacción

- **Posicionamiento correcto:** Los wrappers raíz de los componentes `Popover` y `HoverCard` utilizan los estilos en línea `position: 'relative'` y `display: 'inline-block'` (tanto en las implementaciones estáticas como en las interactivas/de isla). Esto evita que ocupen espacio en línea a nivel de bloque y posiciona correctamente su contenido superpuesto absoluto relativo al disparador.
- **Gestión del foco:** En `app/components/ui/popover-primitive.tsx`, `InteractivePopoverRoot` utiliza una referencia `isFirstRender` para garantizar que `closePopover` no enfoque el elemento disparador en el render/montaje inicial cuando la popover está cerrada, evitando así un autoenfoque inesperado al cargar la página.
- **Eventos de puntero transparente:** Para evitar una anidación HTML no válida de etiquetas de anclaje (`<a>`) dentro de grandes elementos padre cliqueables (como diapositivas de tarjeta o carrusel), el contenedor de texto de la superposición se estructura con `pointer-events: none` y se aplica `pointer-events: auto` a los elementos `<Anchor>` o `<a>` anidados objetivo.

### Mecanismos avanzados de componentes

- **Componente Menu interactivo (`app/islands/menu.tsx`):** Maneja los eventos de desplazamiento y redimensión de la ventana recalculando y reposicionando dinámicamente el contenedor del menú desplegable (vía `updatePosition()`), garantizando que permanezca anclado a su disparador. Admite un estado abierto controlado (`open` y `onOpenChange`), colocaciones mapeadas desde configuraciones clásicas y en kebab-case con detección de colisión en límites, y acciones de disparador personalizables con temporizadores de entrada/salida de hover.
- **API de Menu simplificada (`app/components/ui/menu.tsx`):** Renderiza recursivamente submenús en cascada al encontrar un elemento de menú de tipo `"submenu"`, mostrando un icono chevron y aprovechando primitivas `Menu` compuestas anidadas. Expone `Menu.Arrow`, `Menu.ArrowTip` y `Menu.TriggerItem` como subcomponentes compuestos.
- **Comprobaciones de referencias de nodos VDOM:** Para comprobar correctamente la referencia de nodo VDOM de un componente hijo (como `MenuTriggerItem` dentro de `Trigger`) en Hono JSX, el código verifica tanto `child.tag` como `child.type`, ya que los nodos de función JSX clásicos se mapean a `tag` en lugar de `type` bajo la compilación JSX clásica.
- **DatePicker:** Admite vistas granulares mediante la prop `picker` (`"date" | "month" | "year"`), mapeando de forma transparente tamaños y variantes a las configuraciones de token de Panda CSS. Admite un estilo semántico profundamente personalizable mediante las props `classNames` y `styles` en elementos internos específicos (p. ej. label, control, input, positioner, clearTrigger).
- **Componente Tabs:** Portado íntegramente a Hono/JSX. Las primitivas de diseño SSR estáticas se definen en `app/components/ui/tabs-primitive.tsx`, mientras que el wrapper de isla del cliente interactivo y diligente `app/islands/tabs.tsx` gestiona el estado activo, el seguimiento del indicador mediante un `ResizeObserver` y las reglas estándar de navegación ARIA/teclado. Mapea las propiedades de estilo de Ant Design (`activeKey`, `defaultActiveKey`, `onChange`, `onTabClick`, tamaños y tipos) a las primitivas subyacentes.
- **Componente Select:** Mapea dinámicamente las entradas de framework tradicionales como `size="small"`/`"medium"`/`"large"` y `variant="outlined"`/`"flushed"` a las escalas estándar de Panda CSS (`sm`/`md`/`lg` y `outline`/`underlined`) antes de calcular las clases de slot, para asegurar la compatibilidad entre frameworks. Se ha refinado para admitir la búsqueda/filtrado del lado del cliente en listas desplegables mediante la prop `showSearch`, así como renderizar los elementos seleccionados como Tags interactivos y descartables en el modo de selección múltiple (personalizable vía `tagRender`).
- **Componente PinField:** Implementado con una primitiva SSR estática (`app/components/ui/pin-field-primitive.tsx`) y una isla interactiva (`app/islands/pin-field.tsx`). Normaliza `value` y `defaultValue` para admitir tanto tipos cadena como array, define `selectOnFocus` a `true` por defecto, admite la ejecución de formulario `autoSubmit`, depura los caracteres pegados eliminando espacios y guiones, y gestiona la navegación de teclado RTL.
- **Sistema de diseño en cuadrícula:** Proporciona un contenedor flexbox de 24 columnas de alto rendimiento mediante los componentes `Row` y `Col`, mapeando la configuración de puntos de interrupción responsive (como `xs`, `sm`, `md`, `lg`, `xl`, `xxl`) a los puntos de interrupción estándar de Panda CSS. Row mapea los canales (gutters) estáticos, basados en array y responsives a salidas abreviadas de espaciado de Panda CSS (`cg` y `rg`), mientras que Col convierte las props responsives y los objetos de puntos de interrupción en clases de sistema de diseño coincidentes de forma dinámica.
- **Diseño en cuadrícula aplanado:** Los componentes de diseño `Grid` y `GridItem` planos en `app/components/ui/grid.tsx` se basan en los patrones de diseño nativos de Panda CSS, admitiendo control 2D vía `columns` y `rows`. Estos patrones se registran en `staticCss.patterns` de `panda.config.ts` (`grid` y `gridItem`) y se enlazan de forma recursiva en `config.yml` de Sveltia CMS bajo `pages` para simplificar los diseños multicolumna sin elementos Row/Col anidados. Los puntos de interrupción responsives admiten objetos responsives serializados en JSON (p. ej. `"columns": "{\"base\": 1, \"md\": 3}"`).
- **Recetas de cuadrícula de diseño:** Las recetas de cuadrícula de diseño para `row` y `col` se compilan mediante programación en variantes estáticas y discretas (extensiones, desplazamientos, órdenes 0 a 24) y se registran en el CSS estático de `panda.config.ts` para admitir la anidación de diseño de página estática en Sveltia CMS y PageRenderer sin hidratación de JavaScript dinámica.
- **Directorio de iconos SVG centralizado:** La base de código utiliza componentes de iconos SVG individuales y reutilizables ubicados en `app/icons/*` (p. ej. `CloseIcon`, `ChevronDownIcon`, `CheckIcon`, etc.) que aceptan `JSX.IntrinsicElements["svg"]` para reenviar atributos como `width`, `height` y estilos personalizados. Los SVG en línea codificados de forma rígida en los componentes UI y las rutas se han refactorizado para importar desde este directorio de iconos centralizado y promover la reutilización del código y evitar la duplicación.

***

## Pipelines de contenido e i18n

Todo lo que está bajo `content/` se descubre en tiempo de compilación mediante `import.meta.glob` de Vite y se pre-renderiza por SSG.

### Particionamiento de colecciones CMS

El repositorio particiona el contenido documental en dos colecciones CMS distintas definidas en `public/admin/config.yml`:

- `"docs"`: Guías ubicadas bajo `/content/docs/` como archivos `.md`.
- `"components"`: Referencias de componentes ubicadas bajo `/content/components/` como archivos `.mdx`.

Los enlaces de página de edición de administración de Sveltia CMS se construyen con el formato `/admin/#/collections/[docs|components]/entries/[slug]`.

### Modelo de clasificación de hidratación

El repositorio utiliza un modelo de clasificación de hidratación de tres niveles, configurado mediante el frontmatter de Sveltia CMS y documentado en [Hydration](/docs/Hydration):

- **"Interactivo con diligencia" (Nivel 1):** Se hidrata con diligencia por defecto como isla del cliente.
- **"Adaptativo inteligente" (Nivel 2):** Se hidrata condicionalmente según señales de comportamiento.
- **"Estático sin JS" (Nivel 3):** Componentes puramente estáticos sin hidratación JS.

### i18n y adición de una nueva locale de traducción

Sveltia CMS está configurado para la internacionalización (i18n) en `public/admin/config.yml` admitiendo las locales `en`, `zh`, `es`, `pt`, `fr` y `de`, con el inglés (`en`) como locale por defecto. Utiliza la estructura `multiple_folders` con `omit_default_locale_from_file_path: true`, manteniendo los archivos de locale por defecto en las rutas raíz originales y colocando las traducciones bajo subcarpetas de locale (para docs/components) o usando sufijos `.<locale>` (para configs y posts).

Para añadir una nueva locale de traducción al repositorio, sigue este flujo de trabajo paso a paso:

1. **Configuración CMS:** Añade el código de locale (p. ej. `fr` o `de`) a la sección `i18n.locales` de `public/admin/config.yml`.
2. **Claves de traducción:** Crea un archivo de configuración coincidente bajo `content/configs.<locale>.json` con las claves de traducción localizadas.
3. **Registro del selector de idioma:** Registra el código de locale y su nombre legible por humanos en `ALL_LOCALES` y `LOCALE_NAMES` dentro de `app/components/language-switcher.tsx`.
4. **Arreglo del cargador de docs:** Añade el código de locale al arreglo `LOCALES` dentro de `app/lib/docs.ts`.
5. **Reexportación de ruta:** Reexporta las rutas estándar creando un directorio `app/routes/<locale>/` que coincida con la estructura de archivos de ruta raíz.
6. **Traducciones:** Proporciona las traducciones de los docs markdown/MDX y las referencias de componentes respectivamente bajo `content/docs/<locale>/*.md` y `content/components/<locale>/*.mdx`.

***

## Estilo

[PandaCSS](https://panda-css.com) genera todo el CSS por adelantado — no hay motor de estilo en tiempo de ejecución. `panda.config.ts` extiende el tema base desde `app/theme/`, analiza `app/**/*.{js,jsx,ts,tsx}` para el uso de estilos, y escribe el sistema generado (recetas, tokens, patrones, helpers JSX) en `design-system/`, que los componentes importan vía el alias Vite `design-system`.

### Diseños de recetas de ranura y componentes multiparte

Las recetas de tema para componentes multiparte (p. ej. `RadioGroup`, `SegmentGroup`, `Tabs`, `ToggleGroup`, `Select`, `Avatar`, `Pagination`, `HoverCard`) deben definir explícitamente sus `slots` como un arreglo de cadenas dentro de `defineSlotRecipe` en lugar de importar desde `@ark-ui/react/anatomy` o `@ark-ui/anatomy` para eliminar las dependencias de React en la capa de estilo.

Los componentes multiparte que usan `defineSlotRecipe` deben registrarse en `slotRecipes` en `app/theme/recipes/index.ts` e incluirse explícitamente en `staticCss.recipes` dentro de `panda.config.ts` (p. ej. `radioGroup: ['*']`, `select: ['*']`, `tabs: ['*']`) para garantizar que todas las variantes como `size` se generen correctamente para las islas Hono.

### Conflictos de nombrado de recetas personalizadas

Nombrar una receta personalizada `stack` entra en conflicto con los patrones de diseño integrados de Panda CSS, lo que provoca una advertencia durante `codegen`, aunque la receta sigue siendo funcional.

### Tokens de color frente a tokens semánticos

En el sistema de diseño PandaCSS del proyecto:

- **Tokens (`tokens.colors`):** Los colores estáticos puros (como negro y blanco) se definen como valores crudos bajo `app/theme/tokens/colors.ts`.
- **Tokens semánticos (`semanticTokens.colors`):** Las paletas de escalas condicionales o adaptativas (como slate/gray, blue, red, etc.) se declaran aquí para habilitar la compilación automática de variables de los modos claro y oscuro.

### Directrices de uso explícito de tokens semánticos

En la config de Panda CSS y los estilos personalizados, **evita usar tokens de color genéricos como `bg` y `fg`** (que compilan a CSS transparente/inválido). En su lugar, usa tokens semánticos explícitos como `gray.surface.bg`, `fg.default` y `gray.outline.border` para preservar los estados de tema adecuados.
Además, al aplicar estilo a superposiciones emergentes, listas desplegables o componentes de autocompletado (como `app/islands/search.tsx`), usa el token de fondo semántico `gray.surface.bg` para garantizar un fondo sólido en los modos claro/oscuro y evitar el solapamiento de texto.

***

## CMS

[Sveltia CMS](https://sveltiacms.app) se ejecuta completamente en el cliente en `/admin/`, configurado por `public/admin/config.yml`. `app/server.ts` sirve los archivos estáticos de ese directorio (config, HTML, assets) directamente desde `public/admin/` en lugar de mediante el enrutado normal, por lo que la UI del CMS funciona de manera idéntica en desarrollo y una vez desplegada. Está respaldado por Git: las ediciones realizadas en la UI del CMS se confirman directamente en los archivos de contenido bajo `content/`, que la próxima compilación recoge como cualquier otro cambio.

***

## Herramientas de desarrollo e integridad

### Comandos de Node y Bun

Para configurar el entorno de desarrollo, instalar dependencias y ejecutar la generación de código de PandaCSS:

```bash
bun install
```

Para ejecutar el servidor de desarrollo local (Vite en el puerto 5173 por defecto):

```bash
bun run dev
```

Para construir la salida del sitio estático (`dist/`):

```bash
bun run build
```

### Pruebas unitarias proactivas

Para ejecutar las pruebas unitarias de la base de código:

```bash
bun test unit
```

_Nota: Ejecuta siempre las pruebas unitarias con `bun test unit` para evitar posibles fallos por dependencias faltantes de las pruebas de integración que dependen de paquetes externos pesados como `@playwright/test`._

### Biome Linter y calidad de código

El repositorio utiliza **Biome** para el lint y el formato del código. Para garantizar que `bun run check` y `bun run fix` se ejecuten con éxito con código de salida 0, las reglas restrictivas y muy ruidosas que generan falsos positivos en los atributos de componentes dinámicos estándar se desactivan explícitamente en `biome.json`. Estas reglas incluyen:

- `useExportsLast`
- `useAriaPropsSupportedByRole`
- `noLabelWithoutControl`
- `useSemanticElements`
- `noNoninteractiveElementToInteractiveRole`

### Restricción de las CLI orientadas a React

Ejecutar comandos CLI orientados a React (como `@park-ui/cli`) directamente en este repositorio sobrescribirá las implementaciones Hono/JSX personalizadas y las recetas de ranura con modelos específicos de React, rompiendo el modelo SSG/isla de HonoX. Verifica siempre los archivos existentes de la base de código antes de ejecutar scripts externos de instalación de componentes.

***

## Despliegue

La salida de compilación (`dist/`) es un sitio totalmente estático — no se requiere ningún proceso de servidor en el momento de la solicitud. Se configuran dos destinos de fábrica:

- **Cloudflare Pages** (`wrangler.jsonc`) — `assets.directory` apunta a `dist/`; `bun run deploy` compila y luego ejecuta `wrangler pages deploy ./dist`.
- **Vercel** (`vercel.json`) — el mismo comando de compilación, `outputDirectory: "dist"`, `cleanUrls: true` (de modo que la reescritura clean-URL propia de Vercel complementa las correcciones de índice de directorio de `fixSsgRoutingPlugin`).

`bun run preview` (`wrangler dev`) sirve el `dist/` compilado localmente a través del runtime local de Cloudflare, distinto de `bun run dev` (`vite`), que ejecuta el servidor de desarrollo HonoX en vivo con HMR.
