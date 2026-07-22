---
title: Constructor de Páginas CMS
---

## Introducción

El Constructor de Páginas dinámico basado en [Sveltia CMS](https://sveltiacms.app/en/docs/intro) permite a los editores no técnicos crear páginas complejas, anidadas de forma recursiva, completamente a través de la interfaz de usuario del CMS (`/admin/`).

Los diseños de página se guardan como archivos JSON en `content/pages/*.json` y se compilan bajo demanda o se pregeneran estáticamente (mediante Hono SSG) en `/pages/[slug]`.

***

## Componentes admitidos

El Constructor de Páginas admite una rica paleta de más de 40 componentes de layout, tipografía, decorativos e interactivos.

### 1. Estructura y layout

* **Stack**: Agrupa a los hijos vertical u horizontalmente con alineación, justificación y espaciado (gap) controlables.
* **Grid**: Layout de CSS Grid responsivo — número fijo de columnas/filas, o ajuste automático (auto-fit) según el ancho mínimo del hijo.
* **Group**: Alinea elementos como botones de forma compacta (admite las propiedades `attached` y `grow`).
* **Fieldset**: Organiza componentes de formulario relacionados dentro de un contenedor con estilo, con `legend`, `helperText` y `errorText`.
* **AbsoluteCenter**: Centra un único bloque anidado dentro de su padre a lo largo de uno o ambos ejes.
* **Splitter**: Paneles redimensionables separados por asas de arrastre. Siempre se renderiza de forma estática en el Constructor de Páginas (el contenido del panel no puede cruzar el límite de hidratación de la isla).
* **Breadcrumb**: Ruta de navegación de elementos enlazados con un separador personalizable.

### 2. Tipografía y contenido

* **Heading**: Encabezados con estilo de niveles `h1` a `h6` y varios tamaños de texto responsivos.
* **Text**: Texto a nivel de párrafo con tamaños ajustables.

### 3. Presentación y visualización

* **Alert**: Renderiza alertas de advertencia/éxito/error/información con estados e iconos estándar.
* **Badge**: Etiquetas de metadatos coloreadas con paletas de colores y estilos personalizados.
* **Card**: Un contenedor enriquecido que admite bloques anidados, encabezados, pies de página y posiciones de imagen arriba/abajo/izquierda/derecha.
* **Progress**: Renderiza indicadores de progreso lineales o circulares.
* **Skeleton**: Esqueletos de marcador de posición altamente personalizables (admite formas de círculo y texto multilínea).
* **Loader** / **Spinner**: Indicadores de carga, con texto opcional que los acompaña.
* **Table**: Datos tabulares estáticos con columnas configurables y un arreglo de filas codificado en JSON.
* **Icon**: Marcado SVG en línea sin procesar con controles de tamaño/color.

### 4. Interactivos y superposiciones

* **Button**: Objetivos clicables principales que admiten paletas, tamaños y variantes de estilo personalizados.
* **Checkbox**: Casillas de verificación para entrada booleana con enlaces aria accesibles.
* **Combobox**: Desplegables con acciones de limpiar y listas de elementos.
* **Collapsible**: Contenedores de divulgación que muestran/ocultan árboles de componentes anidados.
* **Popover**: Contenido descriptivo flotante anclado a disparadores de texto estándar.
* **Tooltip**: Texto de sugerencia contextual anclado a un botón disparador al pasar el cursor/enfocar.
* **HoverCard**: Contenido disparado al pasar el cursor más rico que un Tooltip, con título/descripción opcionales.
* **Dialog**: Cajas modales con atrapa-foco completo, botones de Confirmar/Cancelar personalizados y lista de hijos personalizada.
* **Drawer**: Paneles laterales responsivos que se deslizan desde el borde de la página, con lista de hijos personalizada.
* **Dropdown** (tipo de bloque `menu`): Menús de acción con opciones personalizadas de casilla, selección y separador.

### 5. Avanzados y de datos

* **Select**: Desplegable personalizado de selección única/múltiple, enviable en formulario.
* **DatePicker**: Selección de fecha única/múltiple/rango con un calendario emergente.
* **TagsInput**: Lista de etiquetas de texto libre.
* **RadioGroup** / **RadioCardGroup**: Listas de radio personalizadas con lógica de selección única accesible.
* **SegmentGroup**: Controles segmentados deslizantes para selección tipo pestañas.
* **Slider**: Componentes de control deslizante de rango.
* **Switch**: Interruptores de alternancia.
* **Editable**: Texto en línea editable con clic.
* **ColorPicker**: Selector de color de saturación/matiz/alfa con entrada hex/RGBA/HSLA.
* **FileUpload**: Selección de archivos arrastrando y soltando o mediante clic para explorar.
* **Carousel**: Presentación de imágenes automática o manual.
* **PaginatedTable**: Componentes de tabla dinámica interactiva con soporte de paginación.
* **Pagination**: Controladores de página interactivos.

***

## Arquitectura

### 1. Definiciones de esquema del CMS (`public/admin/config.yml`)

Utilizamos **anclas y alias YAML** avanzados (`&` y `*`) para resolver el desafío de la recursión infinita en las especificaciones YAML.

* Los **anclas base** (`button_fields`, `checkbox_fields`, etc.) se declaran una sola vez.
* Los **componentes de nivel 1** definen elementos planos y un contenedor `Stack`/`Collapsible` que admite **componentes de nivel 2** (`*l2_components`).
* Los **componentes de nivel 2** permiten recursivamente otra capa de contenedores anidados (`*l3_components`).
* Esto permite a los editores anidar layouts hasta **4 niveles de profundidad** sin exceder los límites del analizador YAML/CMS.

### 2. Renderizador de layout (`app/components/page-renderer.tsx`)

El motor de layout importa todos los módulos de componentes públicos desde `app/components/ui/` y los mapea en un compilador JSX de alto rendimiento y totalmente seguro en cuanto a tipos.

* Los tipos de entrada se convierten estrictamente en diccionarios de registro `unknown` estándar para evitar la coerción de tipos y mantener las comprobaciones de lint de Biome totalmente limpias.
* Los contenedores anidados se manejan de forma recursiva mediante llamadas anidadas al componente `<PageRenderer content={...} />`.

***

## Canalizaciones de construcción de contenido

Los layouts del Constructor de Páginas son uno de los tres tipos de contenido bajo `content/`, cada uno descubierto con `import.meta.glob` de Vite y renderizado por su propia ruta. Los tres se generan estáticamente de la misma manera: el middleware `ssgParams` de una ruta enumera cada archivo de su colección en tiempo de compilación, y `bun run build` (mediante `@hono/vite-ssg`) recorre esos parámetros para pregenerar un archivo HTML estático por slug en `dist/`.

### 1. Layouts de página JSON (`content/pages/*.json`)

* Se cargan con `import.meta.glob("/content/pages/*.json", { import: "default" })` en `app/routes/pages/[slug].tsx`.
* Cada archivo se analiza como JSON plano — sin markdown involucrado — y su arreglo `content` se entrega directamente a `<PageRenderer />` (ver Arquitectura más arriba), que lo compila recursivamente en los componentes de UI correspondientes.
* Esta es la única de las tres canalizaciones sin un paso de análisis/compilación separado: el JSON _es_ el árbol de renderizado.

### 2. Markdown plano (`content/posts/*.md`, `content/docs/*.md`)

* Se cargan con `import.meta.glob(..., { query: "?raw", import: "default" })`, que devuelve el código fuente de markdown sin procesar como una cadena en lugar de un módulo compilado.
* Se analizan en tiempo de solicitud/compilación por `app/utils/markdown.ts`, una canalización `remark`/`rehype` (`remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-stringify`): `parseFrontmatter()` separa el bloque de frontmatter YAML del cuerpo, y `markdownToHtml()` convierte el cuerpo en una cadena HTML.
* La cadena resultante se inyecta mediante `dangerouslySetInnerHTML` (ver `app/lib/posts.ts` y `app/lib/docs.ts`) — no hay JSX involucrado, por lo que esta canalización no puede incrustar componentes activos.
* Las entradas de blog también procesan su cuerpo a través de `stripMarkdown()` para construir un texto de búsqueda plano (haystack) para `/api/*/search.json`.

### 3. Documentos MDX (`content/docs/*.mdx`)

* Se compilan por adelantado mediante el plugin de Vite `@mdx-js/rollup` (configurado en `vite.config.ts`, restringido a `.mdx` para que nunca intercepte las importaciones `.md` sin procesar mencionadas arriba), usando `remark-frontmatter` + `remark-mdx-frontmatter` + `remark-gfm`.
* Cada archivo `.mdx` se convierte en un componente real e importable (más una exportación `frontmatter` separada), cargado en `app/lib/docs.ts` mediante un `import.meta.glob` plano (sin `?raw`).
* Como la salida es un componente en lugar de una cadena HTML, los documentos `.mdx` pueden incrustar ejemplos interactivos realmente renderizados (por ejemplo, una demo activa de `<Button>`) directamente en el texto — la contrapartida es el paso de compilación en tiempo de construcción que el `.md` plano no necesita.

`app/lib/docs.ts` carga las colecciones `.md` y `.mdx` en paralelo y las fusiona en una sola barra de navegación lateral, por lo que qué canalización usa un documento dado es un detalle de implementación invisible para los lectores — elige `.md` para prosa simple y `.mdx` solo cuando una página necesita un componente activo incrustado.

***

## Ejemplo de estructura JSON

Aquí hay un archivo de layout de ejemplo que representa una página de panel de control compleja (`content/pages/dashboard.json`):

```json
{
  "title": "Interactive Dashboard",
  "content": [
    {
      "type": "heading",
      "text": "Dashboard Analytics",
      "as": "h1",
      "size": "3xl"
    },
    {
      "type": "stack",
      "direction": "vertical",
      "gap": "6",
      "children": [
        {
          "type": "card",
          "title": "Welcome User!",
          "description": "Here is your system status.",
          "variant": "outline",
          "children": [
            {
              "type": "alert",
              "status": "success",
              "title": "All Systems Operational",
              "variant": "surface"
            }
          ]
        },
        {
          "type": "fieldset",
          "legend": "User Preferences",
          "children": [
            {
              "type": "switch",
              "defaultChecked": true,
              "text": "Enable Push Notifications"
            },
            {
              "type": "checkbox",
              "text": "Subscribe to Newsletter"
            }
          ]
        }
      ]
    }
  ]
}
```
