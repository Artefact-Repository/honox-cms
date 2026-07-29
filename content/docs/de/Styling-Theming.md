---
title: Styling & Theming
---

Dieses Projekt stylt jede Komponente mit [PandaCSS](https://panda-css.com) (typsicheres CSS-in-JS ohne Laufzeit) auf Basis von rohem `hono/jsx` — **nicht** eines von Pandas offiziell unterstützten JSX-Frameworks (React/Vue/Solid/Qwik). Genau diese eine Tatsache — `jsxFramework: undefined` in `panda.config.ts` — ist die Grundursache für nahezu jede Styling-Regression, die dieses Projekt bisher erlebt hat, weil dadurch stillschweigend mehrere Dinge deaktiviert werden, die Panda normalerweise automatisch übernimmt. Diese Seite dokumentiert die daraus resultierende Architektur, die konkreten Bugs, die sie bereits verursacht hat, sowie die Checkliste, der zu folgen ist, damit sie nicht erneut auftreten.

---

## Wie Styles von einem Recipe zur Seite gelangen

1. **Recipes** werden unter `app/theme/recipes/*.ts` mit Pandas `defineRecipe` (einzelne Klasse, z. B. `badge.ts`) oder `defineSlotRecipe` (mehrteilige Komponenten mit benannten Slots, z. B. `switch.ts` — `root`/`control`/`thumb`/…) erstellt.
2. Jedes Recipe wird per Objekt-Key in `app/theme/recipes/index.ts` registriert, unter `recipes` (flach) oder `slotRecipes` (mit Slots). **Der Registrierungs-Key ist das, worüber alles andere darauf verweist** — nicht die `className` des Recipes und auch nicht sein Dateiname. `switch.ts` exportiert `switchRecipe` (`switch` ist ein reserviertes Wort) und wird als `switchRecipe: switchRecipe` registriert; `panda.config.ts` und jeder Code, der auf das Recipe verweist, muss `switchRecipe` verwenden, niemals `switch`.
3. `panda.config.ts` erweitert die kombinierte Config aus `app/theme/` (`theme: { extend: { ...theme.config } }`) und durchsucht `include: ["./app/**/*.{js,jsx,ts,tsx}"]` nach Style-Verwendung.
4. Panda schreibt das generierte System — Recipe-Helper-Funktionen, Tokens, Patterns, die `css`/`cx`-Laufzeit — nach `design-system/`, importiert über den `design-system`-Vite-Alias (`vite.config.ts`). **`design-system/` ist gitignored** — es handelt sich um ein Build-Artefakt, das bei jedem Install/Build über PostCSS (`postcss.config.cjs` bindet `@pandacss/dev/postcss` ein) und das `prepare`-Skript (`panda codegen`, einmalig bei `bun install` ausgeführt) frisch neu erzeugt wird. Nur die *Quell*-Dateien — `app/theme/recipes/*.ts`, `panda.config.ts` — sind das, was tatsächlich ausgeliefert wird; nichts, was direkt an `design-system/` geändert wird, wird jemals committet.

### `codegen` vs. `cssgen` — oft werden beide manuell benötigt

| Befehl | Regeneriert | Nötig nach |
| --- | --- | --- |
| `bunx panda codegen` | `design-system/recipes/*.mjs` + `.d.ts` — die Recipe-Helper-Funktionen (`switchRecipe()`, `.splitVariantProps()`, `.variantKeys`, `.variantMap`), die der Anwendungscode zur Laufzeit aufruft | Hinzufügen/Entfernen/Umbenennen einer **Variante** an einem beliebigen Recipe |
| `bunx panda cssgen` | `design-system/styles.css` — die tatsächlich generierten CSS-Regeln | Hinzufügen/Entfernen eines **Varianten-Werts** oder Ändern von `staticCss` |

Die PostCSS-Integration von `vite dev` extrahiert CSS beim Bearbeiten fortlaufend neu, regeneriert dabei aber **nicht** die Recipe-Helper-Dateien `.mjs`/`.d.ts` — das sind einfache generierte Dateien, die der Code direkt importiert (`import { switchRecipe } from "design-system/recipes"`), kein von Vite transformiertes virtuelles Modul. Wird einer `variants`-Definition eines Recipes eine `colorPalette`-Prop hinzugefügt und nur die Datei gespeichert, verwendet `switchRecipe.splitVariantProps()` weiterhin die **veraltete** `variantKeys`-Liste, bis `panda codegen` ausgeführt wird — die neue Prop wird also stillschweigend in „lokale Props" statt in „Varianten-Props" einsortiert und landet entweder als ungültiges Attribut im DOM oder erreicht die Style-Funktion überhaupt nie. **Beide Befehle sind nach dem Bearbeiten jeder Recipe-Datei von Hand auszuführen** — es sollte nicht angenommen werden, dass der Dev-Server das automatisch erkannt hat.

---

## `staticCss`: warum fast jedes Recipe auf `["*"]` gezwungen wird

Pandas statische Analyse kann CSS nur für Werte im Voraus generieren, die sie wörtlich im Quellcode sieht (`<Badge size="sm">`) — oder, bei JSX-Framework-Integrationen, über das `jsx: [...]`-Mapping des jeweiligen Recipes (`button.ts` und einige wenige andere nutzen das). Die Komponenten dieser Codebasis werden innerhalb von Primitive-Dateien als `recipeName(variantProps)` aufgerufen, immer mit einem **zur Laufzeit berechneten Objekt** (`switchRecipe.splitVariantProps(props)`), und der Großteil des Inhalts ist CMS-verfasstes JSON (`content/pages/*.json`) mit Farb-/Größen-/Varianten-Werten, die überhaupt nirgends als String-Literal im `.tsx`-Quellcode existieren. Pandas Extraktor kann davon nichts sehen, daher **muss jedes Recipe ohne `jsx`-Mapping gezwungen werden, alle seine Varianten-Kombinationen zu generieren** — über `staticCss.recipes: { <recipeKey>: ["*"] }` in `panda.config.ts` — unter Verwendung des *Registrierungs-Keys* aus `app/theme/recipes/index.ts`, nicht der `className` des Recipes.

Genau so ist der Switch-Size-Bug (unten) entstanden, und es handelt sich um eine systemische Gefahr: **jeder Tippfehler zwischen dem Key in `staticCss.recipes` und dem tatsächlichen Export-/Registrierungsnamen des Recipes lässt die Generierung dieses Recipes stillschweigend auf null Nicht-Standard-Varianten fallen** — ohne jeden Fehler, jede Warnung oder jeden Typfehler irgendwo; Panda gibt dann einfach nur Base- + Default-Varianten-CSS aus und sonst nichts. Wird ein brandneues Recipe hinzugefügt, muss dessen Registrierungs-Key-Eintrag sofort zu `staticCss.recipes` hinzugefügt werden, wobei genau zu prüfen ist, dass der Key exakt mit `app/theme/recipes/index.ts` übereinstimmt (im Zweifel den Key in beiden Dateien per `grep` suchen).

---

## Bekannte Regressionen und die Regeln, die sie verhindern

### 1. Der `staticCss.recipes`-Key muss dem Registrierungsnamen des Recipes entsprechen, nicht seiner `className`

**Symptom:** Jeder Nicht-Standard-Varianten-Wert (z. B. `size="sm"`/`"lg"` bei `<Switch>`) rendert mit schlicht ungesetzten CSS Custom Properties — ein kollabiertes, unsichtbares 0×0-Element oder komplett fehlendes Styling — während die Standard-Variante einwandfrei aussieht.

**Ursache:** `switch.ts` exportiert `switchRecipe` (unter diesem Key in `slotRecipes` registriert), aber `staticCss.recipes` in `panda.config.ts` enthielt `switch: ["*"]` — einen Key, der auf nichts passt. Es wird nur Base- + `defaultVariants`-CSS ausgeliefert (das gibt Panda unabhängig von `staticCss` immer aus); jeder andere Varianten-Wert erhält stillschweigend null generiertes CSS.

**Fix:** Der Key in `staticCss.recipes` muss exakt der Registrierungs-Key aus `app/theme/recipes/index.ts` sein (`switchRecipe`, nicht `switch`). Das ist bei jedem Recipe, dessen Datei-/`className`-Name nicht mit seinem Export-Namen übereinstimmt, leicht falsch zu machen, und liefert im Fehlerfall **null** Compile- oder Laufzeit-Signal — nach jeder `staticCss`-Änderung per Grep über das generierte CSS nach der erwarteten Varianten-Klasse verifizieren (z. B. `grep "switch__root--size_sm" design-system/styles.css`), nicht einfach nur die Config überfliegen.

**Das ist beim selben Recipe dreimal wieder aufgetreten**, bevor der Fix tatsächlich dauerhaft landete, weil `design-system/` gitignored ist — `cssgen` nach der Config-Korrektur auszuführen erzeugt korrekten *lokalen* Output, aber wenn die `panda.config.ts`-Änderung selbst nie committet wird, kehrt der Bug zurück, sobald jemand anderes neu generiert. **Der einzige dauerhafte Teil jedes `staticCss`-/Recipe-Fixes ist die Änderung der Quelldatei** (`panda.config.ts`, `app/theme/recipes/*.ts`) — immer mit `git status`/`git diff` bestätigen, dass diese Dateien tatsächlich gestaged sind, nicht nur, dass das lokale CSS gut aussieht.

### 2. Slot-Recipe-Varianten müssen slot-keyed sein, sonst verwirft Panda sie stillschweigend

**Symptom:** Eine Varianten-Klasse ist im gerenderten HTML vorhanden (`carousel__root--colorPalette_green`), der beabsichtigte Style fehlt komplett, und das generierte CSS enthält für diese Klasse **null** Regeln — nicht einmal eine leere.

**Ursache:** In einem `defineSlotRecipe` muss jeder Varianten-Wert seine Styles unter dem Namen des Slots verschachteln, den er anspricht:

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

Ein flaches `defineRecipe` (ohne Slots — `badge.ts`, `anchor.ts`, `button.ts`) verwendet die *unslotted* Form korrekt; dieses Muster in ein `defineSlotRecipe` (alles mit einem `slots: [...]`-Array) zu kopieren, ist der Fehler. Das hat `rating-group.ts`, `carousel.ts` und `clipboard.ts` unabhängig voneinander getroffen — es ist eine leicht zu übersehende Copy-Paste-Falle zwischen den beiden Recipe-Arten und einen zweiten Blick wert, sobald die neue Variante eines Slot-Recipes „nichts tut".

### 3. Bedingte `base`-Styles verlieren immer gegen `variant`-Styles derselben CSS-Eigenschaft — unabhängig von der Spezifität

**Symptom:** Ein bedingter/zustandsgesteuerter Style im `base`-Block eines Slot-Recipes (z. B. `&[data-complete]: { borderColor: ... }`) wird nie angewendet, obwohl bestätigt ist, dass das Attribut/die Klasse im DOM vorhanden ist und die CSS-Regel selbst bestätigt im Stylesheet steht.

**Ursache:** Panda gibt `base`-Styles und `variants`-Styles in **separate CSS-Cascade-Layer** aus, wobei der Variants-Layer nach dem Base-Layer angeordnet ist. Die CSS-Layer-Reihenfolge schlägt Selektor-Spezifität bedingungslos — ein hochspezifischer `base`-Selektor verliert trotzdem gegen eine schlichte, unbedingte Regel im `variants`-Layer, wenn beide dieselbe Eigenschaft setzen.

**Fix:** Den bedingten Override in **jeden relevanten `variant.<name>.<slot>`-Block** verschieben statt in `base`, wobei bei sich wiederholenden Styles ein gemeinsames Objekt in jeden hineingespreadet wird. Die `_invalid`-Behandlung in `app/theme/recipes/input.ts` (pro Variante dupliziert, nicht in `base` zentralisiert) ist das bestehende Referenzmuster.

### 4. `colorPalette.*`-Tokens lösen zu einer echten (grau-ähnlichen, fast schwarzen) Farbe auf, nie zu „keine Farbe" — ein *aktiver Scope* ist erforderlich

**Symptom:** Eine mit `bg: "colorPalette.solid.bg"` o. Ä. gestylte Komponente rendert in einem dunklen, gedämpften Grau/Schwarz — unabhängig davon, welche `colorPalette`-Prop übergeben wurde (oder selbst wenn das Recipe überhaupt kein `colorPalette`-Konzept besitzt).

**Ursache:** `colorPalette.*` sind virtuelle Tokens, die sich gegen die jeweils an diesem DOM-Knoten im Scope befindlichen `--colors-color-palette-*`-Custom-Properties auflösen. Das Theme setzt an `:root`/`html` einen **globalen Default-Scope auf `gray`**, sodass überall dort, wo kein spezifischerer colorPalette-Scope aktiv ist, `colorPalette.solid.bg` stillschweigend zu `gray.solid.bg` auflöst — nicht transparent, kein Fehler, sondern eine echte (dunkle) Farbe. Das lässt sich leicht als „kaputt" fehldiagnostizieren, wenn es eigentlich nur „ungescoped" ist.

**Fix:** Einen tatsächlichen colorPalette-Scope anwenden, gemäß dem zentralisierten Muster weiter unten — nicht annehmen, eine Komponente „hat einfach keine Farbe", nur weil sie grau/schwarz aussieht.

### 5. Responsive Varianten-Props erzeugen kein Breakpoint-CSS

`<Heading size={{ base: "2xl", md: "3xl" }}>` rendert im HTML korrekt `class="heading--size_2xl md:heading--size_3xl"`, aber es wird nie eine `@media`-Regel für die `md:`-Klasse generiert — `staticCss.recipes: ["*"]` erzwingt nur die Generierung literaler, nicht-responsiver Varianten-Klassen, es verknüpft sie nicht kreuzweise mit Breakpoint-Bedingungen. **Niemals ein responsives Objekt als Varianten-Prop übergeben**; stattdessen einen flachen Literal-Wert verwenden, oder einen umschließenden `css()`/Utility-Klassen-Override für die spezifische Eigenschaft, die sich pro Breakpoint ändern muss (reine Utility-Klassen haben diese Einschränkung nicht, nur Recipe-Varianten-Props).

---

## `colorPalette`-Theming: das zentralisierte Muster

Pandas offiziell unterstützte JSX-Frameworks bekommen `colorPalette` „gratis": Deren `styled()`-Wrapper spaltet eine `colorPalette`-Prop automatisch von jeder Komponente ab und mischt sie als generische Utility-Klasse ein, zusätzlich zu dem, was die eigenen Varianten des Recipes produzieren. **Dieses Repo bekommt das nicht**, weil `jsxFramework: undefined`. Die vorgelagerten [Park UI](https://park-ui.com)-Recipes (die ursprüngliche Komponenten-Quelle dieses Projekts, von Hand nach `hono/jsx` portiert) verlassen sich genau auf diese fehlende Integration — auch deren eigenes `switch.ts` hat keine `colorPalette`-Variante.

Für einen Teilbereich der Komponenten wurde das jahrelang umgangen, indem **von Hand eine `colorPalette`-Variante direkt am Recipe deklariert** wurde (`badge.ts`, `anchor.ts`, `button.ts`, …), wobei dieselbe ~11 Einträge umfassende Paletten-Map in jedes einzelne hineinkopiert wurde. Genau dieser Ansatz hat die meisten der oben genannten Bugs verursacht: Er wird bei einer neuen Komponente leicht vergessen (`switch.ts`/`avatar.ts`/`card.ts`/`checkbox.ts` haben ihn nie bekommen, sodass deren `colorPalette`-Prop stillschweigend nichts bewirkte), die slotted-vs-unslotted-Form wird dabei leicht falsch gemacht (§2), und er hat dieselbe Palettennamen-Liste — mit Drift — über ein Dutzend Dateien verstreut (manche handgerollten Maps in Recipes referenzierten `teal`/`indigo`/`pink`/`yellow`, Palettennamen, die in `app/theme/colors/` dieses Themes überhaupt nicht existieren — auch die hätten stillschweigend nichts bewirkt).

**Das aktuelle Muster** (Stand der `colorPalette`-Zentralisierungs-Runde) ersetzt all das durch ein gemeinsam genutztes Utility:

- `staticCss.css` in `panda.config.ts` erzwingt die Generierung der einfachen Panda-`colorPalette`-Utility-Klasse (`.color-palette_blue` usw.) für jeden echten Palettennamen, den das Theme tatsächlich definiert (`gray`/`blue`/`green`/`red`/`orange`/`purple`/`cyan`/`amber` — vor dem Hinzufügen eines neuen Namens an beliebiger Stelle die aktuelle Liste in `app/theme/colors/*.ts` prüfen).
- `app/components/ui/color-palette.ts` exportiert `colorPaletteClass(colorPalette?: string)`, das Aliase auflöst (`success`→green, `error`→red, `warning`→orange, `slate`→gray — insbesondere `slate` wird durchgehend im CMS-Content verwendet, obwohl die Graustufen-Skala dieses Themes ausschließlich als `gray` registriert ist) und die passende Utility-Klasse zurückgibt.

**Um `colorPalette`-Unterstützung zu einer Komponente hinzuzufügen** (eine Komponente, deren Recipe zwar `colorPalette.*`-Tokens referenziert, deren Konsument aber keine Möglichkeit hat, tatsächlich eine auszuwählen):

1. **Keine** `colorPalette`-Variante zum Recipe hinzufügen. Die `colorPalette.*`-Token-Referenzen des Recipes unverändert lassen.
2. Im Primitive der Komponente (`*-primitive.tsx`) `colorPalette` aus den Props destrukturieren, **bevor** ein `...rest`/`...restProps`-Spread auf dem DOM-Knoten landet — genau wie bei jeder anderen bekannten Prop — damit es niemals als ungültiges `colorpalette="..."`-HTML-Attribut durchsickert.
3. Falls die Komponente zuvor eine fest codierte Standardfarbe hatte, diese als einfachen JS-Default bei der Destrukturierung erhalten (`colorPalette = "blue"`), nicht als `defaultVariants`-Eintrag im Recipe.
4. `colorPaletteClass(colorPalette)` in die Klassenliste des **Root-/Primär-Slots** einmischen — `cx(styles.root, colorPaletteClass(colorPalette), classProp)` — sodass es über die normale CSS-Custom-Property-Vererbung an nachgeordnete Slots kaskadiert. Es muss nur auf dem äußersten Element stehen, das den Scope etabliert, niemals auf jedem Slot.
5. Falls die Komponente über einen Context-Provider zusammengesetzt wird (z. B. `ButtonGroup` → `Button` via `ButtonContext`), muss sichergestellt werden, dass `colorPalette` explizit durch diesen Context-Wert hindurchgereicht wird — es ist nicht mehr Teil von `variantProps`, daher muss überall dort, wo bisher allein `variantProps` weitergereicht wurde, um Farbe zu propagieren, `colorPalette` von Hand wieder hinzugefügt werden.
6. Neu generieren (`panda codegen && panda cssgen`) und verifizieren: die Komponente rendern, das SSR-HTML (oder `design-system/styles.css`) per Grep nach der erwarteten `color-palette_<name>`-Klasse durchsuchen und bestätigen, dass kein nacktes `colorpalette=`-Attribut ins DOM durchgesickert ist.

Für eine neue Komponente keine pro-Recipe `colorPalette`-Varianten-Map wieder einführen — genau dieses Muster hat die Zentralisierung ersetzt, gerade weil es nicht skaliert und stillschweigend regressiert.

---

## Token-Farben vs. semantische Tokens

- **`tokens.colors`** (`app/theme/tokens/colors.ts`) — reine statische Werte (Schwarz, Weiß).
- **`semanticTokens.colors`** (`app/theme/index.ts`, `app/theme/colors/*.ts`) — die adaptiven Paletten-Skalen (gray/slate, blue, red, green, orange, purple, cyan, amber), jede kompiliert zu automatischen Light-/Dark-Custom-Properties.

**Generische `bg`/`fg`-Tokens vermeiden** — sie kompilieren in diesem Theme zu transparentem/ungültigem CSS (das „Remove Panda Preset Colors"-Plugin in `panda.config.ts` entfernt Pandas Standard-Farb-Preset, und die generischen `bg`/`fg` wurden nie ersetzt). Stattdessen explizite semantische Tokens verwenden: `gray.surface.bg`, `fg.default`, `gray.outline.border` usw. Insbesondere Popups/Dropdowns/Autocomplete-Panels sollten `gray.surface.bg` (nicht `colorPalette.surface.bg`) verwenden, damit der Panel-Hintergrund eine neutrale, opake Fläche bleibt — unabhängig davon, welche Akzentfarbe am Trigger aktiv ist.

### Wo der seitenweite Standard-Akzent tatsächlich lebt

Jede Farbdatei unter `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate`) ist eine vollständig ausgeformte, einsatzbereite `colorPalette`-Option — mit identischer Form (eine 1–12-Skala, eine a1–a12-Alpha-Skala und `solid`/`subtle`/`surface`/`outline`/`plain`-Untergruppen, jede mit `bg`/`fg`). Dass eine Farbe in diesem Verzeichnis existiert, bedeutet nur, dass sie generiert wurde (z. B. durch die Park UI CLI bei der Projekt-Initialisierung) — es sagt nichts darüber aus, ob sie irgendwo *aktiv* ist.

**Weder Panda selbst noch der CLI-Output von Park UI (`components.json`) speichern, welche Farbe bei der Initialisierung als „der" Akzent gewählt wird** — in keinem von beiden gibt es dafür einen Config-Key. Das Einzige, was den seitenweiten Standard tatsächlich festlegt, ist eine einzige handgeschriebene Zeile:

```ts
// app/theme/global-css.ts
html: {
  colorPalette: "gray",
  // ...
},
```

Das setzt den Root-`colorPalette`-Scope, den jedes ungescopte Element erbt. Es ist eine schlichte CSS-Deklaration, leicht zu übersehen und leicht aus den Augen zu verlieren — falls sich jemals die Frage stellt „warum verwendet dieses Projekt `gray` als Akzent statt `cyan`/was auch immer bei der Initialisierung gewählt wurde", ist diese Zeile die Antwort, und sie zu ändern ist eine risikoarme Ein-Zeilen-Änderung (jede Farbdatei hat dieselbe Token-Form, sodass das Austauschen des Werts ein sauberer Drop-in ist).

**Dieser Default ist nur ein Fallback.** Jede der 13 Komponenten, die auf das oben zentralisierte `colorPaletteClass()`-Muster migriert wurden (switch, badge, button, card, …), trägt ihren **eigenen** expliziten Default (siehe die pro-Komponente-Liste in diesem Abschnitt) und folgt einer Änderung dieser Zeile nicht — nur Komponenten/Utilities ohne eigene explizite `colorPalette` (die globalen Focus-Ring-/Selection-Custom-Properties, ebenfalls in `global-css.ts` deklariert, sowie jedes noch nicht migrierte Recipe) lesen diesen Root-Wert tatsächlich.

### `fg`/`border`/`canvas` sind absichtlich immer nur grau

`fg.default`, `fg.muted`, `fg.subtle`, `border` und `canvas` (deklariert in `semanticTokens.colors` in `app/theme/index.ts`) sind fest auf `colors.gray.*` verdrahtet — **nicht** auf `colors.colorPalette.*`. Das ist beabsichtigt, keine Lücke: Es ist die übliche Radix-/Park-UI-Konvention „ein Akzent + ein Grau" — Fließtext, Rahmen und Seitenhintergrund müssen unabhängig davon, welcher Akzent aktiv ist, neutral bleiben, sowohl wegen Kontrast/Lesbarkeit als auch damit der Akzent als Akzent wahrgenommen wird und nicht die ganze Seite einfärbt. Diese nicht „reparieren", indem sie auf `colorPalette.*` verweisen, in der Erwartung, dass sie dann den Seiten-Akzent übernehmen — das wäre eine Regression, keine Verbesserung. Nur wirklich interaktive/markenbezogene Flächen (der Checked-Zustand eines Controls, die Solid-Füllung eines Buttons, der Hintergrund eines Badges, …) sollten `colorPalette.*` referenzieren — bestätigt als das tatsächliche Muster in jedem Control-Recipe (`switch.ts`, `checkbox.ts`, `badge.ts`, `button.ts`: Der neutrale/unchecked Zustand verwendet ein fest codiertes `gray.*`-Token, der checked/Akzent-Zustand verwendet `colorPalette.*`).

---

## Verifikations-Checkliste nach jeder Recipe- oder `panda.config.ts`-Änderung

Kein bloßer visueller Blick sollte vertraut werden — die oben genannten Bugs *sahen* alle so aus, als sei nichts falsch, bis genau hingesehen wurde (ein schwarzes/graues Element liest sich als „Standard-Styling", nicht als „kaputt").

1. `bunx panda codegen && bunx panda cssgen` (vom Repo-Root aus — zuerst `pwd` prüfen; werden diese Befehle aus einem Unterverzeichnis ausgeführt, schreiben sie `design-system/` stillschweigend an den falschen verschachtelten Ort statt einen Fehler zu werfen).
2. Das generierte CSS per Grep nach der konkret erwarteten Klasse durchsuchen: `grep "switch__root--size_sm" design-system/styles.css`, `grep "color-palette_blue" design-system/styles.css`.
3. Die tatsächliche Seite rendern (Dev-Server oder `bun test`) und den SSR-HTML-Output per Grep nach derselben Klasse durchsuchen sowie auf die *Abwesenheit* jedes durchgesickerten rohen Prop-Namens als DOM-Attribut (`colorpalette="..."`, `size="..."` usw. an einem Element, das es nicht haben sollte).
4. `bun test` — die vollständige Unit-Test-Suite ausführen; ein veralteter Test, der ein altes Klassennamen-Format prüft, ist nach einem Styling-Refactor ein häufiger False-Positive — vor der Annahme einer echten Regression lohnt sich ein kurzer Blick hinein.
5. `git status`/`git diff` der **Quell**-Dateien (`panda.config.ts`, `app/theme/recipes/*.ts`, `app/components/ui/*.tsx`) — niemals `design-system/`, das gitignored ist und verworfen wird. Ein Fix, der „lokal funktioniert", aber nie tatsächlich in den Quelldateien committet wurde, ist kein Fix.

---

## FAQ

### Wie kann die seitenweite Standard-Akzentfarbe geändert werden?

Eine Zeile in `app/theme/global-css.ts` ändern:

```ts
html: {
  colorPalette: "cyan", // was "gray"
  colorScheme: { _light: "light", _dark: "dark" },
},
```

Der Wert muss einer der Palettennamen sein, die tatsächlich unter `app/theme/colors/*.ts` existieren (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate` — registriert als `gray`). Jede dieser Dateien hat die identische Token-Form (`solid`/`subtle`/`surface`/`outline`/`plain`, jeweils mit `bg`/`fg`), daher ist das ein sauberer, sicherer Austausch — kein anderes Token muss dabei mitgeändert werden.

Danach:

1. `bunx panda codegen && bunx panda cssgen` zur Neugenerierung.
2. Das Ergebnis prüfen: `fg`/`border`/`canvas` (Fließtext, Trennlinien, Seitenhintergrund) ändern sich **nicht** — sie sind, unabhängig vom Akzent, absichtlich fest auf die neutrale Grauskala verdrahtet, siehe oben. Nur wirklich akzentgesteuerte Flächen (ein checked Switch/Checkbox, ein Solid-Button, ein ungescoptes Badge, Focus-Ringe, Textmarkierung) übernehmen die neue Farbe.
3. Zu beachten: Das ändert nur den **Fallback**. Jede der 13 Komponenten, die bereits auf `colorPaletteClass()` migriert wurden (switch, badge, button, anchor, card, checkbox, carousel, clipboard, date-picker, radio-card-group, rating-group), trägt ihren eigenen expliziten pro-Komponente-Default und muss einzeln von Hand in ihrem Primitive aktualisiert werden (`app/components/ui/*-primitive.tsx`, der `colorPalette = "..."`-Destrukturierungs-Default), falls auch sie dem neuen Seiten-Akzent folgen sollen, statt ihren aktuellen individuell gewählten Default zu behalten.
