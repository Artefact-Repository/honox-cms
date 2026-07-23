---
title: Introducción
---

Este es un starter full-stack construido sobre [**HonoX**](https://github.com/honojs/honox), que combina un sistema de estilos tipado con un CMS respaldado por Git, y entrega todo el conjunto como un sitio estático. Está pensado como base con todo incluido para sitios orientados a contenido —— documentación, blogs, páginas de marketing —— que aun así quieren componentes realmente interactivos donde importa.

| Pieza | Qué hace |
| --- | --- |
| [HonoX](https://honox.dev) | Meta-framework sobre [Hono](https://hono.dev) —— enrutamiento basado en archivos, islas servidor/cliente |
| [PandaCSS](https://panda-css.com) | CSS-in-JS tipado y sin runtime, compilado por adelantado |
| [Sveltia CMS](https://sveltiacms.app) | Edición de contenido respaldada por Git en `/admin/` —— sin base de datos, sin servicio backend |
| [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) | Pre-renderiza cada ruta a HTML estático en tiempo de build |

***

## Por qué este stack

* **Estático por defecto.** El resultado del build es HTML/CSS/JS plano —— no se requiere ningún proceso de servidor en tiempo de petición, así que se despliega en cualquier lugar donde se sirvan archivos estáticos (Cloudflare Pages y Vercel ya vienen configurados).
* **Interactivo donde importa.** No todos los componentes necesitan enviar JavaScript. Un modelo de [hidratación](/docs/es/Hydration) de tres niveles permite que cada componente decida si se hidrata de forma inmediata, condicional, o nunca —— manteniendo el bundle del cliente pequeño sin renunciar a una UI rica.
* **Contenido editable sin tocar código.** [Sveltia CMS](https://sveltiacms.app) se ejecuta enteramente en el cliente y hace commit directamente sobre los archivos bajo `content/`, de modo que los editores pueden escribir entradas de blog, documentación, e incluso componer páginas enteras visualmente mediante el [Constructor de Páginas](/docs/es/PageBuilder), mientras que los desarrolladores mantienen todo bajo control de versiones.
* **Estilos con confianza.** [PandaCSS](https://panda-css.com) genera todo el CSS por adelantado a partir de llamadas de estilo analizables estáticamente —— sin motor de estilos en runtime, sin colisiones de nombres de clase, y con seguridad de tipos completa en los design tokens.

***

## Qué incluye

* **Cerca de 50 componentes de UI** bajo `app/components/ui/`, cubriendo layout, formularios, overlays y presentación de datos, cada uno con su contraparte interactiva en `app/islands/` cuando es necesario.
* **Un blog** (`content/posts/`) con etiquetas, páginas de autor y una API JSON de solo lectura.
* **Un constructor de páginas visual** (`content/pages/`) para componer páginas a partir de componentes anidados enteramente desde el CMS.
* **Documentación** (esta sección), escrita en Markdown plano o MDX, este último para páginas que necesitan un ejemplo renderizado en vivo incrustado en el texto.
* **i18n** en seis idiomas (`en`, `zh`, `es`, `pt`, `fr`, `de`) para la documentación, los componentes y la interfaz del sitio.

***

## Por dónde seguir

* [Primeros Pasos](/docs/es/Getting-Started) —— instala las dependencias y ejecuta el proyecto en local.
* [Arquitectura](/docs/es/Architecture) —— una mirada más profunda al build, el enrutamiento, la estructura de componentes y los pipelines de contenido.
* [Hidratación](/docs/es/Hydration) —— cómo los componentes optan por la interactividad del lado del cliente.
* [Constructor de Páginas CMS](/docs/es/PageBuilder) —— composición visual de páginas a través de Sveltia CMS.
