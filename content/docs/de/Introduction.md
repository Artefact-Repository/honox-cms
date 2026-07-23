---
title: Einführung
---

Dies ist ein Full-Stack-Starter auf Basis von [**HonoX**](https://github.com/honojs/honox), der ein typsicheres Styling-System mit einem Git-basierten CMS kombiniert und das Ganze als statische Seite ausliefert. Er soll eine rundum ausgestattete Grundlage für inhaltsgetriebene Seiten sein —— Dokumentation, Blogs, Marketingseiten —— die trotzdem an den entscheidenden Stellen echte interaktive Komponenten wollen.

| Baustein | Aufgabe |
| --- | --- |
| [HonoX](https://honox.dev) | Meta-Framework auf [Hono](https://hono.dev) —— dateibasiertes Routing, Server-/Client-Islands |
| [PandaCSS](https://panda-css.com) | Typsicheres, laufzeitfreies CSS-in-JS, im Voraus kompiliert |
| [Sveltia CMS](https://sveltiacms.app) | Git-basiertes Content-Editing unter `/admin/` —— keine Datenbank, kein Backend-Service |
| [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) | Rendert jede Route zur Build-Zeit vorab als statisches HTML |

***

## Warum dieser Stack

* **Standardmäßig statisch.** Das Build-Ergebnis ist reines HTML/CSS/JS —— zur Laufzeit einer Anfrage ist kein Serverprozess nötig, daher lässt es sich überall dort deployen, wo statische Dateien ausgeliefert werden können (Cloudflare Pages und Vercel sind bereits vorkonfiguriert).
* **Interaktiv, wo es zählt.** Nicht jede Komponente muss JavaScript ausliefern. Ein dreistufiges [Hydration](/docs/de/Hydration)-Modell lässt jede Komponente selbst entscheiden, ob sie sofort, bedingt oder gar nicht hydratisiert —— so bleibt das Client-Bundle klein, ohne auf eine reichhaltige UI zu verzichten.
* **Inhalte bearbeitbar, ohne Code anzufassen.** [Sveltia CMS](https://sveltiacms.app) läuft vollständig im Client und committet Änderungen direkt in die Dateien unter `content/`, sodass Redakteure Blogbeiträge und Dokumentation schreiben oder über den [Seitenbaukasten](/docs/de/PageBuilder) sogar ganze Seiten visuell zusammenstellen können, während Entwickler weiterhin alles unter Versionskontrolle behalten.
* **Verlässliches Styling.** [PandaCSS](https://panda-css.com) generiert das gesamte CSS im Voraus aus statisch analysierbaren Style-Aufrufen —— keine Laufzeit-Styling-Engine, keine Klassennamenkollisionen und volle Typsicherheit bei den Design-Tokens.

***

## Was enthalten ist

* **Rund 50 UI-Komponenten** unter `app/components/ui/`, die Layout, Formulare, Overlays und Datenanzeige abdecken, jede bei Bedarf mit einer passenden interaktiven Island in `app/islands/`.
* **Ein Blog** (`content/posts/`) mit Tags, Autorenseiten und einer schreibgeschützten JSON-API.
* **Ein visueller Seitenbaukasten** (`content/pages/`) zum Zusammenstellen von Seiten aus verschachtelten Komponenten, vollständig über das CMS.
* **Dokumentation** (dieser Bereich), verfasst als reines Markdown oder MDX —— letzteres für Seiten, die ein live gerendertes Beispiel direkt im Fließtext brauchen.
* **i18n** in sechs Sprachen (`en`, `zh`, `es`, `pt`, `fr`, `de`) für Dokumentation, Komponenten und die Seiten-Oberfläche.

***

## Wie es weitergeht

* [Erste Schritte](/docs/de/Getting-Started) —— Abhängigkeiten installieren und das Projekt lokal ausführen.
* [Architektur](/docs/de/Architecture) —— ein tieferer Blick auf Build, Routing, Komponentenstruktur und Content-Pipelines.
* [Hydration](/docs/de/Hydration) —— wie Komponenten client-seitige Interaktivität aktivieren.
* [CMS-Seitenbaukasten](/docs/de/PageBuilder) —— visuelles Zusammenstellen von Seiten über Sveltia CMS.
