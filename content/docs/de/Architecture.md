---
title: Architektur
---

Dieses Projekt basiert auf [**HonoX**](https://github.com/honojs/honox), einem Meta-Framework auf Basis von [Hono](https://hono.dev), das dateibasiertes Routing, Server-/Client-Inseln (Islands) und statische Site-Generierung hinzufügt. Das Styling erfolgt über [PandaCSS](https://panda-css.com) (typsicheres CSS-in-JS ohne Laufzeit), der Inhalt wird über [Sveltia CMS](https://sveltiacms.app) (`/admin/`) erstellt, und die gesamte Seite wird als statisches HTML vorgerendert.

| Ebene | Werkzeug |
| --- | --- |
| Framework | [HonoX](https://honox.dev) |
| Routing | Dateibasiert, unter `app/routes/` |
| Styling | [PandaCSS](https://panda-css.com) → `design-system/` |
| Inhalt | Markdown / MDX / JSON unter `content/` |
| CMS | [Sveltia CMS](https://sveltiacms.app), Git-basiert, unter `/admin/` |
| SSG | [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) |
| Deployment | Cloudflare Pages (`wrangler.jsonc`) oder Vercel (`vercel.json`) |

***

## Der Build: Zwei Vite-Durchläufe, eine statische Seite

`bun run build` führt `vite build --mode client && vite build` aus — zwei separate Durchläufe über dieselbe `vite.config.ts`, umgeschaltet über `mode`:

- **`--mode client`** baut `app/client.ts` (`createClient()` aus `honox/client`) mit `jsxImportSource: "hono/jsx/dom"`. Das ist das Browser-Bundle: Es hydriert die Inseln und sonst nichts.
- **Der Standard-(Server-)Durchlauf** baut `app/server.ts` (`createApp()` aus `honox/server`) mit `jsxImportSource: "hono/jsx"` (die SSR-JSX-Laufzeit) und übergibt die gesamte App dann an das [`ssg()`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg)-Plugin, das jede Route crawlt und das vorgerenderte HTML in `dist/` schreibt.

### SSG-Routing und lokalisierte URL-Korrekturen

Um 404-Routing-Fehler auf statischen File-Hostern nach der Routenkompilierung zu vermeiden, verarbeitet ein benutzerdefiniertes `fixSsgRoutingPlugin` in `vite.config.ts` rekursiv alle `.html`-Dateien im Build-Output (`dist/`). Es benennt lokalisierte Index-/Startseiten-Dateien (z. B. `zh.html`, `docs/fr.html`) in verschachtelte, saubere Pfade um (`zh/index.html`, `docs/fr/index.html`), sofern ein passendes Verzeichnis existiert oder der Name einer unterstützten Locale entspricht. Dadurch werden `/zh` und andere lokalisierte Endpunkte auf jedem statischen Hoster sauber als Verzeichnisindex aufgelöst.

### Auflösung der Testumgebung

Um Unit-Tests für Hono-JSX-Komponenten in Bun auszuführen, ist `bunfig.toml` speziell konfiguriert mit:

```toml
[jsx]
runtime = "classic"
pragma = "h"
fragment = "Fragment"
importSource = "hono/jsx"
```

Dies stellt eine standardmäßige Hono-Runtime-Auflösung sicher und vermeidet Fehler durch fehlende JSX-Dev-Runtime während der Testausführung.

Das `mdx()`-Plugin ist bewusst nur auf `include: /\.mdx$/` beschränkt — einfaches `.md` (Blog-Posts, die meisten Docs) wird absichtlich ausgelassen, damit die `?raw`-Imports von `app/utils/markdown.ts` nicht durch die MDX-Transformation korrumpiert werden.

***

## Dateibasiertes Routing

Routen liegen unter `app/routes/` und werden in `app/server.ts` über `import.meta.glob` über `**/*.{ts,tsx,md,mdx}` registriert, wobei die privaten Dateikonventionen von HonoX (`_*`, `-*`, `$*`) und Testdateien ausgeschlossen werden. Eine Routendatei exportiert Handler (`GET`, `POST`, …) oder eine Standardkomponente; `[slug].tsx` / `[[slug]].tsx` liefern dynamische/optionale Segmente und folgen den eigenen Routing-Konventionen von HonoX.

### Benutzerdefinierte statische API-Routen

In HonoX werden benutzerdefinierte statische API-Routen (z. B. `app/routes/api/posts.json.ts`), die eine Standardroute exportieren, die `c.json(...)` zurückgibt, während des SSG-Builds automatisch vom `@hono/vite-ssg`-Plugin in statische JSON-Dateien (z. B. `dist/api/posts.json`) kompiliert. Für diese statischen Endpunkte ist keine dynamische Parameterkonfiguration nötig.

### Vorab-Rendern dynamischer Routen über ssgParams

Jede dynamische Route (wie `/blog/by-author/[author].tsx`) muss das `ssgParams`-Middleware in der Routendefinition implementieren und exportieren, um alle potenziellen Parameterwerte für das Vorab-Rendern zur Build-Zeit zu deklarieren.

### Lokales Routing und Legacy-Redirects

Routen für übersetzbare Collections (`docs`, `blog`, `pages`) folgen `/<collection>/<locale?>/<item>`, wobei die Standard-Locale (`en`) kein Segment belegt:

```plain
/docs/AbsoluteCenter        (en)
/docs/fr/AbsoluteCenter     (fr)
/blog/my-post               (en)
/blog/zh/my-post            (zh)
```

Locale-unabhängige **Sprach-Startseiten** liegen auf dem nackten Locale-Segment (`/fr`, `/zh`, …). All das ist zentral in `app/lib/i18n.ts` (`detectLocale`, `localiseHref`, `stripLocale`, `localeToggleUrl`) gebündelt — keine Routendatei implementiert die Locale-Logik von Hand. Eine veraltete Routenform, `/<locale>/<collection>/<item>`, wird von einem Middleware in `app/server.ts` per 301 auf die aktuelle Form umgeleitet, sodass alte Lesezeichen/Links weiterhin funktionieren.

Die unterstützten Locales werden einmalig in `ALL_LOCALES` / `TRANSLATED_LOCALES` (`app/lib/i18n.ts`) deklariert — diese Liste muss mit `i18n.locales` von `public/admin/config.yml` und den gespiegelten `app/routes/<locale>/`-Routenverzeichnissen synchron bleiben.

***

## Komponenten-Architektur

Die Codebasis pflegt zwei parallele Bäume unter `app/`:

- **`app/components/ui/`** — die öffentliche Komponenten-API (~100 Komponenten).
- **`app/islands/`** — die client-gehydrateten Gegenstücke, eines pro interaktiver Komponente, im Client-Bundle gebündelt und von `honox/client` eingehängt.

### Server-Sicherheit ohne Hooks

Um eine fehlerfreie statische Site-Generierung zu gewährleisten, **sind alle client-seitigen reaktiven Hooks (`useEffect`, `useRef`, `useState` aus `hono/jsx`) streng auf das Verzeichnis `/islands/` beschränkt**. Dateien unterhalb von `/components/ui/` bleiben vollständig hook-frei und für die serverseitige statische Renderung/SSR sicher. Statische Wrapper (wie `Dialog` und `Drawer` in `components/ui/`), die Referenzen weiterleiten, verwenden ein statisches Plain-Object-Fallback (`{ current: null }`) anstelle von `useRef`, um die Ausführung von Client-Hooks auf dem Server zu vermeiden.

### Sichere Style-Auflösung über Inselgrenzen hinweg

Mehrteilige Komponenten wie `HoverCard`, die Kinder über HonoX-Inselgrenzen rendern, müssen eine sichere Fallback-Style-Auflösung (z. B. `context?.styles || recipe()`) in ihren primitiven Subkomponenten implementieren, damit die Klassennamen sowohl in den vorgerenderten SSR/SSG-Zuständen als auch in den hydratierten Client-Zuständen vollständig befüllt sind.

### Overlay-Positionierung & Interaktions-Tricks

- **Korrekte Positionierung:** Die Root-Wrapper der `Popover`- und `HoverCard`-Komponenten verwenden die Inline-Styles `position: 'relative'` und `display: 'inline-block'` (sowohl für statische als auch für interaktive/Island-Implementierungen). Dadurch nehmen sie keinen Block-Level-Inline-Platz ein und positionieren ihren absoluten Overlay-Inhalt korrekt relativ zum Trigger.
- **Fokus-Management:** In `app/components/ui/popover-primitive.tsx` verwendet `InteractivePopoverRoot` eine `isFirstRender`-Ref, um sicherzustellen, dass `closePopover` beim initialen Render/Mount den Trigger nicht fokussiert, wenn das Popover geschlossen ist, wodurch unerwarteter Auto-Fokus beim Seitenladen vermieden wird.
- **Pointer-Event-Durchleitung:** Um ungültiges HTML-Nesting von Anker-Tags (`<a>`) innerhalb großer klickbarer Elternelemente (wie Card- oder Carousel-Slides) zu vermeiden, wird der Overlay-Textcontainer mit `pointer-events: none` strukturiert, und `pointer-events: auto` wird auf die gezielten verschachtelten `<Anchor>`- oder `<a>`-Elemente angewendet.

### Erweiterte Komponenten-Mechaniken

- **Interaktive Menu-Komponente (`app/islands/menu.tsx`):** Behandelt Window-Scroll- und Resize-Events, indem der Dropdown-Container dynamisch neu berechnet und repositioniert wird (via `updatePosition()`), sodass er am Trigger verankert bleibt. Er unterstützt kontrollierten Open-State (`open` und `onOpenChange`), Placements, die aus klassischen und kebab-case-Konfigurationen gemappt werden, inkl. Boundary-Collision-Detection, sowie anpassbare Trigger-Aktionen mit Hover-Enter/Leave-Timern.
- **Vereinfachte Menu-API (`app/components/ui/menu.tsx`):** Rendert beim Auftreten eines Menüeintrags vom Typ `"submenu"` rekursiv kaskadierende Untermenüs, zeigt ein Chevron-Icon und nutzt verschachtelte zusammengesetzte `Menu`-Primitives. Er stellt `Menu.Arrow`, `Menu.ArrowTip` und `Menu.TriggerItem` als zusammengesetzte Subkomponenten bereit.
- **VDOM-Knoten-Referenzprüfungen:** Um die VDOM-Knotenreferenz einer Kindkomponente (wie `MenuTriggerItem` innerhalb von `Trigger`) in Hono JSX korrekt zu prüfen, werden sowohl `child.tag` als auch `child.type` geprüft, da klassische JSX-Funktionsknoten unter klassischer JSX-Kompilierung auf `tag` statt auf `type` gemappt werden.
- **DatePicker:** Unterstützt granulare Ansichten über die `picker`-Prop (`"date" | "month" | "year"`) und mappt Größen und Varianten nahtlos auf Panda-CSS-Token-Konfigurationen. Er unterstützt tiefes, semantisches Custom-Styling über `classNames`- und `styles`-Props auf spezifischen inneren Elementen (z. B. label, control, input, positioner, clearTrigger).
- **Tabs-Komponente:** Vollständig nach Hono/JSX portiert. Die statischen SSR-Layout-Primitives sind in `app/components/ui/tabs-primitive.tsx` definiert, während der eagerly interaktive Client-Island-Wrapper `app/islands/tabs.tsx` den Active-State, die Indikator-Verfolgung über einen `ResizeObserver` und die Standard-ARIA/Tastatur-Navigationsregeln übernimmt. Er mappt Ant-Design-Props (`activeKey`, `defaultActiveKey`, `onChange`, `onTabClick`, Größen und Typen) auf die zugrunde liegenden Primitives.
- **Select-Komponente:** Mappt traditionelle Framework-Inputs wie `size="small"`/`"medium"`/`"large"` und `variant="outlined"`/`"flushed"` dynamisch auf die Standard-Panda-CSS-Skalen (`sm`/`md`/`lg` und `outline`/`underlined`), bevor die Slot-Klassen berechnet werden, um nahtlose Framework-übergreifende Kompatibilität sicherzustellen. Sie wurde erweitert, um Client-seitige Suche/Filterung in Dropdown-Listen über die `showSearch`-Prop sowie die Darstellung ausgewählter Elemente als interaktive, schließbare Tags im Mehrfachauswahl-Modus (anpassbar über `tagRender`) zu unterstützen.
- **PinField-Komponente:** Implementiert mit einem statischen SSR-Primitive (`app/components/ui/pin-field-primitive.tsx`) und einer interaktiven Insel (`app/islands/pin-field.tsx`). Sie normalisiert `value` und `defaultValue`, um sowohl String- als auch Array-Typen zu unterstützen, setzt `selectOnFocus` standardmäßig auf `true`, unterstützt `autoSubmit`-Formularausführung, bereinigt eingefügte Zeichen durch Entfernen von Leerzeichen und Bindestrichen und behandelt RTL-Tastaturnavigation.
- **Grid-Layout-System:** Bietet einen hochperformanten 24-Spalten-Flexbox-Container über die Komponenten `Row` und `Col` und mappt responsive Breakout-Einstellungen (wie `xs`, `sm`, `md`, `lg`, `xl`, `xxl`) auf Standard-Panda-CSS-Breakpoints. Row mappt statische, array-basierte und responsive Gutters in Panda-CSS-Spacing-Kurzform-Ausgaben (`cg` und `rg`), während Col responsive Props und Breakpoint-Objekte dynamisch in passende Design-System-Klassen konvertiert.
- **Flaches Grid-Layout:** Flache `Grid`- und `GridItem`-Layout-Komponenten in `app/components/ui/grid.tsx` basieren auf den nativen Layout-Patterns von Panda CSS und unterstützen 2D-Steuerung über `columns` und `rows`. Diese Patterns sind in `staticCss.patterns` innerhalb von `panda.config.ts` (`grid` und `gridItem`) registriert und rekursiv in der `config.yml` von Sveltia CMS unter `pages` gebunden, um mehrspaltige Layouts ohne verschachtelte Row/Col-Elemente zu vereinfachen. Responsive Breakpoints unterstützen JSON-stringifizierte responsive Objekte (z. B. `"columns": "{\"base\": 1, \"md\": 3}"`).
- **Layout-Grid-Recipes:** Layout-Grid-Recipes für `row` und `col` werden programmatisch in statische, diskrete Varianten (Spans, Offsets, Orders 0 bis 24) kompiliert und im statischen CSS von `panda.config.ts` registriert, um statisches Seitenlayout-Nesting innerhalb von Sveltia CMS und PageRenderer ohne dynamische JavaScript-Hydration zu unterstützen.
- **Zentrales SVG-Icon-Verzeichnis:** Die Codebasis verwendet einzelne, wiederverwendbare SVG-Icon-Komponenten in `app/icons/*` (z. B. `CloseIcon`, `ChevronDownIcon`, `CheckIcon` usw.), die `JSX.IntrinsicElements["svg"]` akzeptieren, um Attribute wie `width`, `height` und Custom-Styles weiterzuleiten. Hartcodierte Inline-SVGs in UI-Komponenten und Routen wurden refaktoriert, um aus diesem zentralen Icon-Verzeichnis zu importieren, um Code-Wiederverwendung zu fördern und Duplikate zu vermeiden.

***

## Content-Pipelines & i18n

Alles unter `content/` wird zur Build-Zeit über Vite's `import.meta.glob` entdeckt und von SSG vorgerendert.

### CMS-Collection-Partitionierung

Das Repository partitioniert Dokumentationsinhalte in zwei unterschiedliche CMS-Collections, die in `public/admin/config.yml` definiert sind:

- `"docs"`: Guides unter `/content/docs/` als `.md`-Dateien.
- `"components"`: Komponenten-Referenzen unter `/content/components/` als `.mdx`-Dateien.

Die Admin-Bearbeitungsseiten-Links von Sveltia CMS werden im Format `/admin/#/collections/[docs|components]/entries/[slug]` gebaut.

### Hydration-Klassifizierungsmodell

Das Repository verwendet ein dreistufiges Hydration-Klassifizierungsmodell, das über Sveltia-CMS-Frontmatter konfiguriert und in [Hydration](/docs/Hydration) dokumentiert ist:

- **„Sofort interaktiv" (Stufe 1):** Wird standardmäßig sofort als Client-Insel hydriert.
- **„Intelligent adaptiv" (Stufe 2):** Wird bedingt basierend auf Verhaltenssignalen hydriert.
- **„Statisch ohne JS" (Stufe 3):** Reine statische Komponenten ohne JS-Hydration.

### i18n und Hinzufügen einer neuen Übersetzungs-Locale

Sveltia CMS ist für Internationalisierung (i18n) unter `public/admin/config.yml` konfiguriert und unterstützt die Locales `en`, `zh`, `es`, `pt`, `fr` und `de`, wobei Englisch (`en`) die Standard-Locale ist. Es verwendet die `multiple_folders`-Struktur mit `omit_default_locale_from_file_path: true` und belässt Standard-Locale-Dateien in den ursprünglichen Root-Pfaden, während Übersetzungen in Locale-Unterordnern abgelegt werden (für docs/components) oder `.<locale>`-Suffixe verwendet werden (für configs und posts).

Um dem Repository eine neue Übersetzungs-Locale hinzuzufügen, befolge diesen schrittweisen Workflow:

1. **CMS-Konfiguration:** Füge den Locale-Code (z. B. `fr` oder `de`) zum `i18n.locales`-Abschnitt von `public/admin/config.yml` hinzu.
2. **Übersetzungsschlüssel:** Erstelle eine passende Konfigurationsdatei unter `content/configs.<locale>.json` mit den lokalisierten Übersetzungsschlüsseln.
3. **Language-Switcher-Registrierung:** Registriere den Locale-Code und seinen menschenlesbaren Namen in `ALL_LOCALES` und `LOCALE_NAMES` innerhalb von `app/components/language-switcher.tsx`.
4. **Docs-Loader-Array:** Füge den Locale-Code zum `LOCALES`-Array innerhalb von `app/lib/docs.ts` hinzu.
5. **Routen-Re-Export:** Exportiere die Standard-Routen erneut, indem du ein Verzeichnis `app/routes/<locale>/` erstellst, das der Root-Routen-Dateistruktur entspricht.
6. **Übersetzungen:** Stelle Übersetzungen für die Markdown/MDX-Docs und Komponenten-Referenzen jeweils unter `content/docs/<locale>/*.md` und `content/components/<locale>/*.mdx` bereit.

***

## Styling

[PandaCSS](https://panda-css.com) generiert das gesamte CSS im Voraus — es gibt keine Runtime-Style-Engine. `panda.config.ts` erweitert das Basistheme aus `app/theme/`, scannt `app/**/*.{js,jsx,ts,tsx}` nach Style-Verwendung und schreibt das generierte System (Recipes, Tokens, Patterns, JSX-Helper) in `design-system/`, das Komponenten über den `design-system`-Vite-Alias importieren.

### Slot-Recipe-Designs & mehrteilige Komponenten

Theme-Recipes für mehrteilige Komponenten (z. B. `RadioGroup`, `SegmentGroup`, `Tabs`, `ToggleGroup`, `Select`, `Avatar`, `Pagination`, `HoverCard`) müssen ihre `slots` explizit als String-Array innerhalb von `defineSlotRecipe` definieren, anstatt aus `@ark-ui/react/anatomy` oder `@ark-ui/anatomy` zu importieren, um React-Abhängigkeiten in der Style-Ebene zu eliminieren.

Mehrteilige Komponenten, die `defineSlotRecipe` verwenden, müssen in `slotRecipes` in `app/theme/recipes/index.ts` registriert und explizit in `staticCss.recipes` innerhalb von `panda.config.ts` eingeschlossen werden (z. B. `radioGroup: ['*']`, `select: ['*']`, `tabs: ['*']`), damit alle Varianten wie `size` korrekt für Hono-Inseln generiert werden.

### Konflikte bei benutzerdefinierten Recipe-Namen

Die Benennung eines Custom-Recipes als `stack` kollidiert mit den eingebauten Layout-Patterns von Panda CSS und löst eine Warnung während `codegen` aus, obwohl das Recipe funktional bleibt.

### Token-Farben vs. semantische Tokens

Im PandaCSS-Design-System des Projekts:

- **Tokens (`tokens.colors`):** Reine statische Farben (wie Schwarz und Weiß) werden als Rohwerte unter `app/theme/tokens/colors.ts` definiert.
- **Semantische Tokens (`semanticTokens.colors`):** Bedingte oder adaptive Skalen-Paletten (wie slate/gray, blue, red usw.) werden hier deklariert, um die automatische Kompilierung von Light- und Dark-Mode-Variablen zu ermöglichen.

### Explizite Richtlinien für semantische Tokens

In der Panda-CSS-Config und Custom-Styles **sollten generische Farb-Tokens wie `bg` und `fg` vermieden werden** (diese kompilieren zu transparentem/ungültigem CSS). Verwende stattdessen explizite semantische Tokens wie `gray.surface.bg`, `fg.default` und `gray.outline.border`, um korrekte Theme-Zustände zu erhalten.
Zusätzlich solltest du beim Stylen von Popup-Overlays, Dropdown-Listen oder Autocomplete-Komponenten (wie `app/islands/search.tsx`) das semantische Hintergrund-Token `gray.surface.bg` verwenden, um einen soliden Hintergrund in Light/Dark-Mode zu garantieren und Textüberlappung zu vermeiden.

***

## CMS

[Sveltia CMS](https://sveltiacms.app) läuft vollständig client-seitig unter `/admin/`, konfiguriert über `public/admin/config.yml`. `app/server.ts` liefert die statischen Dateien dieses Verzeichnisses (Config, HTML, Assets) direkt aus `public/admin/`, statt über das normale Routing, sodass die CMS-UI in der Entwicklung und nach dem Deployment identisch funktioniert. Es ist Git-basiert: Bearbeitungen in der CMS-UI werden direkt in die Content-Dateien unter `content/` committet, die der nächste Build wie jede andere Änderung aufnimmt.

***

## Development-Tooling & Integrität

### Node- & Bun-Befehle

Um die Entwicklungsumgebung einzurichten, Abhängigkeiten zu installieren und die PandaCSS-Code-Generierung auszuführen:

```bash
bun install
```

Um den lokalen Entwicklungsserver auszuführen (Vite auf Port 5173 standardmäßig):

```bash
bun run dev
```

Um den statischen Site-Output (`dist/`) zu bauen:

```bash
bun run build
```

### Proaktive Unit-Tests

Um die Unit-Tests der Codebasis auszuführen:

```bash
bun test unit
```

_Hinweis: Führe Unit-Tests immer mit `bun test unit` aus, um potenzielle Fehler durch fehlende Abhängigkeiten aus Integrations-Tests zu umgehen, die auf externe, schwere Pakete wie `@playwright/test` angewiesen sind._

### Biome Linter & Code-Qualität

Das Repository verwendet **Biome** für Code-Linting und -Formatierung. Damit `bun run check` und `bun run fix` erfolgreich mit Exit-Code 0 ausgeführt werden, sind restriktive und sehr lautstarke Regeln, die bei standardmäßigen dynamischen Komponenten-Attributen Fehlalarme erzeugen, in `biome.json` explizit deaktiviert. Diese Regeln umfassen:

- `useExportsLast`
- `useAriaPropsSupportedByRole`
- `noLabelWithoutControl`
- `useSemanticElements`
- `noNoninteractiveElementToInteractiveRole`

### Einschränkung von React-orientierten CLIs

Die direkte Ausführung von React-orientierten CLI-Befehlen (wie `@park-ui/cli`) in diesem Repository überschreibt die benutzerdefinierten Hono/JSX-Implementierungen und Slot-Recipes mit React-spezifischen Modellen und bricht das HonoX-SSG/Island-Modell. Prüfe immer die vorhandenen Codebasis-Dateien, bevor du externe Component-Installer-Skripte ausführst.

***

## Deployment

Der Build-Output (`dist/`) ist eine vollständig statische Seite — zur Request-Zeit ist kein Server-Prozess erforderlich. Zwei Ziele sind out-of-the-box konfiguriert:

- **Cloudflare Pages** (`wrangler.jsonc`) — `assets.directory` zeigt auf `dist/`; `bun run deploy` baut und führt dann `wrangler pages deploy ./dist` aus.
- **Vercel** (`vercel.json`) — derselbe Build-Befehl, `outputDirectory: "dist"`, `cleanUrls: true` (sodass Vercels eigene Clean-URL-Rewrites die Verzeichnis-Index-Korrekturen von `fixSsgRoutingPlugin` ergänzen).

`bun run preview` (`wrangler dev`) liefert das gebaute `dist/` lokal über Cloudflares lokale Runtime aus, was sich von `bun run dev` (`vite`) unterscheidet, das den live HonoX-Dev-Server mit HMR ausführt.
