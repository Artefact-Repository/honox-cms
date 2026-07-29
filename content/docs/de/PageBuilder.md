---
title: CMS-Seitenbaukasten
---

## Einführung

Der auf [Sveltia CMS](https://sveltiacms.app/en/docs/intro) basierende dynamische Seitenbaukasten ermöglicht es nicht-technischen Redakteuren, komplexe, rekursiv verschachtelte Seiten vollständig über die CMS-Benutzeroberfläche (`/admin/`) zu erstellen.

Seitenlayouts werden als JSON-Dateien in `content/pages/*.json` gespeichert und bei Bedarf kompiliert oder statisch vorab generiert (über Hono SSG) unter `/pages/[slug]`.

---

## Unterstützte Komponenten

Der Seitenbaukasten unterstützt eine reichhaltige Palette von über 40 Layout-, Typografie-, dekorativen und interaktiven Komponenten.

### 1. Struktur & Layout

* **Stack**: Gruppiert Kindelemente vertikal oder horizontal mit steuerbarer Ausrichtung, Justierung und Abstand.
* **Grid**: Responsives CSS-Grid-Layout — feste Spalten-/Zeilenanzahl oder automatische Anpassung nach minimaler Kindbreite.
* **Group**: Richtet Elemente wie Buttons eng aneinander aus (unterstützt die Eigenschaften `attached` und `grow`).
* **Fieldset**: Organisiert zusammengehörige Formularkomponenten unter einem gestylten Container mit `legend`, `helperText` und `errorText`.
* **AbsoluteCenter**: Zentriert einen einzelnen verschachtelten Block innerhalb seines Elternelements entlang einer oder beider Achsen.
* **Splitter**: Größenveränderbare Panels, getrennt durch Ziehgriffe. Wird im Seitenbaukasten immer statisch gerendert (Panel-Inhalt kann die Island-Hydration-Grenze nicht überschreiten).
* **Breadcrumb**: Navigationspfad aus verlinkten Elementen mit anpassbarem Trennzeichen.

### 2. Typografie & Inhalt

* **Heading**: Gestylte Überschriften der Stufen `h1` bis `h6` und verschiedene responsive Textgrößen.
* **Text**: Text auf Absatzebene mit anpassbaren Größen.

### 3. Anzeige & Präsentation

* **Alert**: Rendert Warn-/Erfolgs-/Fehler-/Info-Hinweise mit Standardstatus und Icons.
* **Badge**: Farbige Metadaten-Labels mit benutzerdefinierten Farbpaletten und Stilen.
* **Card**: Ein umfangreicher Container, der verschachtelte Blöcke, Kopf- und Fußzeilen sowie Bildpositionen oben/unten/links/rechts unterstützt.
* **Progress**: Rendert lineare oder kreisförmige Fortschrittsanzeigen.
* **Skeleton**: Hochgradig anpassbare Platzhalter-Skeletons (unterstützt Kreis- und mehrzeilige Textformen).
* **Loader** / **Spinner**: Ladeanzeigen mit optionalem Begleittext.
* **Table**: Statische Tabellendaten mit konfigurierbaren Spalten und einem JSON-kodierten Zeilen-Array.
* **Icon**: Rohes Inline-SVG-Markup mit Größen-/Farbsteuerung.

### 4. Interaktiv & Overlays

* **Button**: Primäre anklickbare Ziele mit Unterstützung für benutzerdefinierte Paletten, Größen und Stilvarianten.
* **Checkbox**: Kontrollkästchen für boolesche Eingaben mit barrierefreien Aria-Bindungen.
* **Combobox**: Dropdowns mit Löschaktionen und Elementlisten.
* **Collapsible**: Aufklappbare Container, die verschachtelte Komponentenbäume anzeigen/verbergen.
* **Popover**: Schwebender beschreibender Inhalt, verankert an standardmäßigen Text-Triggern.
* **Tooltip**: Kontextbezogener Hinweistext, verankert an einem Trigger-Button bei Hover/Fokus.
* **HoverCard**: Reicherer per Hover ausgelöster Inhalt als ein Tooltip, mit optionalem Titel/Beschreibung.
* **Dialog**: Vollständig fokusgefangene modale Boxen mit benutzerdefinierten Bestätigen-/Abbrechen-Buttons und benutzerdefinierter Kinderliste.
* **Drawer**: Responsive Seitenpanels, die vom Seitenrand hereingleiten, mit benutzerdefinierter Kinderliste.
* **Dropdown** (Blocktyp `menu`): Aktionsmenüs mit benutzerdefinierten abhakbaren, auswählbaren und Trenner-Optionen.

### 5. Erweitert & Daten

* **Select**: Benutzerdefiniertes Einzel-/Mehrfachauswahl-Dropdown, formularübermittelbar.
* **DatePicker**: Einzel-/Mehrfach-/Bereichs-Datumsauswahl mit einem Popup-Kalender.
* **TagsField**: Freie Liste von Zeichenketten-Tags.
* **RadioGroup** / **RadioCardGroup**: Benutzerdefinierte Radio-Listen mit barrierefreier Einzelauswahllogik.
* **SegmentGroup**: Gleitende segmentierte Steuerelemente für die Auswahl per Registerkarte.
* **Slider**: Bereichs-Schieberegler-Komponenten.
* **Switch**: Umschalter.
* **Editable**: Inline-Text zum Bearbeiten per Klick.
* **ColorPicker**: Sättigungs-/Farbton-/Alpha-Farbwähler mit Hex-/RGBA-/HSLA-Eingabe.
* **FileUpload**: Dateiauswahl per Drag-and-Drop oder Klick zum Durchsuchen.
* **Carousel**: Automatisch abspielende oder manuelle Bildershow.
* **PaginatedTable**: Interaktive dynamische Tabellenkomponenten mit Paginierungsunterstützung.
* **Pagination**: Interaktive Seitensteuerung.

---

## Architektur

### 1. CMS-Schemadefinitionen (`public/admin/config.yml`)

Wir nutzen fortgeschrittene **YAML-Anker und -Aliase** (`&` und `*`), um die Tatsache zu umgehen, dass YAML echte Rekursion nicht ausdrücken kann.

* **Basis-Feldanker** (`&button_fields`, `&checkbox_fields` usw.) werden einmal deklariert und überall wiederverwendet, wo dieser Komponententyp vorkommen kann — eine Schemaänderung muss also nur an einer Stelle bearbeitet werden.
* **`&root_components`** — die Blocktypen der obersten Ebene (Stack, Grid, Card, Layout, …), die für das `content`-Feld der Seite angeboten werden.
* **`&nestable_components`** — was die Kinder eines Root-Level-Containers enthalten dürfen: wieder Container, eine Ebene tiefer.
* **`&leaf_components`** — die innerste Ebene, auf der Container nur nicht-container "Blatt"-Komponenten (Button, Badge, Text, …) enthalten dürfen, wodurch die Verschachtelung dort endet.
* Dadurch wird die im Editor baubare Verschachtelung auf **\~4 Ebenen tief** entfaltet — eine reine Einschränkung der CMS-_Editieroberfläche_, siehe Hinweis unten.

### 2. Layout-Renderer (`app/components/page-renderer.tsx` + `app/components/page-registry.tsx`)

`PageRenderer` ist ein bewusst schlanker öffentlicher Einstiegspunkt; die eigentliche Block-zu-Komponente-Zuordnung und die rekursive Rendering-Logik leben in `page-registry.tsx`.

* Ein `registry`-Objekt ordnet den `blockType`-String jedes Blocks (`"stack"`, `"button"`, `"card"`, …) einer Renderer-Funktion zu, die echtes JSX aus `app/components/ui/` zurückgibt.
* `resolveType()` führt den Typ zunächst durch eine `TYPE_ALIASES`-Tabelle (z. B. `"link"` → `anchor`, `"hover-card"` → `hoverCard`, `"menu"` → `dropdown`), sodass CMS-Inhalt und Komponentennamen leicht voneinander abweichen können, ohne dass etwas kaputtgeht.
* `propsOf()` (`app/components/block-types.ts`) entfernt den Meta-Key `blockType` aus jedem Block, bevor dessen Felder auf die Komponente gespreadet werden, damit er nie als überflüssiges DOM-Attribut durchsickert.
* Container-Renderer (Stack, Grid, Card, Dialog, Drawer, Collapsible, …) destrukturieren ihr eigenes `children`-Array und rufen `renderChildren()` auf, das dieses Array durchläuft und rekursiv erneut den Block-Renderer aufruft.

**Hinweis:** Das Verschachtelungslimit von \~4 Ebenen im YAML-Schema begrenzt nur, was das CMS-Formular einer nicht-technischen Redakteurin/einem Redakteur zu _bauen_ erlaubt. Die Rekursion von `renderChildren` selbst hat kein Tiefenlimit — eine von Hand bearbeitete oder programmatisch erzeugte `content/pages/*.json`-Datei kann deutlich tiefer verschachtelt sein, als es die CMS-Oberfläche zulässt, und wird trotzdem korrekt gerendert.

---

## Content-Build-Pipelines

Seitenbaukasten-Layouts sind einer von drei Inhaltstypen unter `content/`, die jeweils mit Vites `import.meta.glob` erkannt und über ihre eigene Route gerendert werden. Alle drei werden auf dieselbe Weise statisch generiert: Die `ssgParams`-Middleware einer Route zählt zur Build-Zeit jede Datei in ihrer Sammlung auf, und `bun run build` (über `@hono/vite-ssg`) durchläuft diese Parameter, um pro Slug eine statische HTML-Datei nach `dist/` vorab zu rendern.

### 1. JSON-Seitenlayouts (`content/pages/*.json`)

* Geladen mit `import.meta.glob("/content/pages/*.json", { import: "default" })` in `app/routes/pages/[slug].tsx`.
* Jede Datei wird als reines JSON geparst — kein Markdown involviert — und ihr `content`-Array wird direkt an `<PageRenderer />` übergeben (siehe Architektur oben), das es rekursiv in die passenden UI-Komponenten kompiliert.
* Dies ist die einzige der drei Pipelines ohne separaten Parse-/Kompilierschritt: Das JSON _ist_ der Renderbaum.

### 2. Reines Markdown (`content/posts/*.md`, `content/docs/*.md`)

* Geladen mit `import.meta.glob(..., { query: "?raw", import: "default" })`, das die rohe Markdown-Quelle als Zeichenkette statt als kompiliertes Modul zurückgibt.
* Zur Anfrage-/Build-Zeit geparst von `app/utils/markdown.ts`, einer `remark`/`rehype`-Pipeline (`remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-stringify`): `parseFrontmatter()` trennt den YAML-Frontmatter-Block vom Rumpf, und `markdownToHtml()` wandelt den Rumpf in eine HTML-Zeichenkette um.
* Die resultierende Zeichenkette wird über `dangerouslySetInnerHTML` injiziert (siehe `app/lib/posts.ts` und `app/lib/docs.ts`) — es ist kein JSX beteiligt, daher kann diese Pipeline keine lebendigen Komponenten einbetten.
* Blog-Beiträge lassen ihren Rumpf zusätzlich durch `stripMarkdown()` laufen, um einen Klartext-Suchheuhaufen für `/api/*/search.json` zu erstellen.

### 3. MDX-Dokumente (`content/docs/*.mdx`)

* Vorab kompiliert vom Vite-Plugin `@mdx-js/rollup` (konfiguriert in `vite.config.ts`, auf `.mdx` beschränkt, damit es niemals die obigen rohen `.md`-Importe abfängt) unter Verwendung von `remark-frontmatter` + `remark-mdx-frontmatter` + `remark-gfm`.
* Jede `.mdx`-Datei wird zu einer echten, importierbaren Komponente (plus einem separaten `frontmatter`-Export), geladen in `app/lib/docs.ts` über ein einfaches (nicht `?raw`) `import.meta.glob`.
* Da die Ausgabe eine Komponente statt einer HTML-Zeichenkette ist, können `.mdx`-Dokumente tatsächlich gerenderte, interaktive Beispiele (z. B. eine lebendige `<Button>`-Demo) direkt in den Text einbetten — der Kompromiss dafür ist der Kompilierschritt zur Build-Zeit, den reines `.md` nicht benötigt.

`app/lib/docs.ts` lädt sowohl die `.md`- als auch die `.mdx`-Sammlungen nebeneinander und führt sie zu einer einzigen Seitennavigation zusammen, sodass es ein für Leser unsichtbares Implementierungsdetail ist, welche Pipeline ein bestimmtes Dokument verwendet — wählen Sie `.md` für reinen Text und `.mdx` nur, wenn eine Seite eine eingebettete lebendige Komponente benötigt.

---

## Beispiel-JSON-Struktur

Hier ist eine Beispiel-Layoutdatei, die eine komplexe Dashboard-Seite darstellt (`content/pages/dashboard.json`):

```json
{
  "title": "Interactive Dashboard",
  "content": [
    {
      "blockType": "heading",
      "text": "Dashboard Analytics",
      "as": "h1",
      "size": "3xl"
    },
    {
      "blockType": "stack",
      "direction": "vertical",
      "gap": "6",
      "children": [
        {
          "blockType": "card",
          "title": "Welcome User!",
          "description": "Here is your system status.",
          "variant": "outline",
          "children": [
            {
              "blockType": "alert",
              "status": "success",
              "title": "All Systems Operational",
              "variant": "surface"
            }
          ]
        },
        {
          "blockType": "fieldset",
          "legend": "User Preferences",
          "children": [
            {
              "blockType": "switch",
              "defaultChecked": true,
              "text": "Enable Push Notifications"
            },
            {
              "blockType": "checkbox",
              "text": "Subscribe to Newsletter"
            }
          ]
        }
      ]
    }
  ]
}
```
