---
title: Hydratation
---

Ce projet utilise l'architecture **Islands Hydration** de [HonoX](https://github.com/honojs/honox) et [**@hono/vite-ssg**](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) pour **SSG**, génération de sites statiques de pages, émettant du **HTML statique** par défaut, et seuls les composants qui ont réellement besoin d'interactivité côté client sont "promu" sur les îles (extraits de code JS client).

> Le comportement d'hydratation de chaque composant passe par le prédicat « shouldHydrate »> dans `app/components/ui/island-utils.ts`. Toute décision concernant _quand rendre le HTML statique_> versus _quand monter un îlot côté client_ est résolu ici — voir> [Hydration](/docs/Hydration) pour le modèle de niveau complet, les règles de décision et par composant> classification.
1. **Zéro JS redondant** : les composants sans interaction n'ont jamais besoin d'envoyer un script d'hydratation.2. **Zéro rupture silencieuse** — les composants qui _do_ ont besoin d'interaction devraient s'hydrater automatiquement, même si l'appelant oublie de passer « interactif ».3. **Source unique de vérité** — chaque « est-ce que cela devrait hydrater ? » la décision passe par une fonction partagée « shouldHydrate », éliminant les branches ad hoc « if (interactive) » par composant.
## Le prédicat de base

`app/components/ui/island-utils.ts` :

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

### Table de vérité

| `interactive` | `hasSignal` | Résultat | Signification |
| --- | --- | --- | --- |
| `false` | any | `false` | Explicitement interdit de s'hydrater (purement statique) |
| `true` | any | `true` | Explicitement obligé de s'hydrater |
| `undefined` | `true` | `true` | Détection intelligente : signal présent → hydrater |
| `undefined` | `false` | `false` | Détection intelligente : aucun signal → statique |

***

## Le modèle à 3 niveaux

### Niveau 1 – Auto-interactif

> **Règle de base : `shouldHydrate(interactive, true)`**
Ces composants _sont_ une interaction — toute leur valeur dépend du client JS
(superpositions, modaux, poignées de déplacement, développer/réduire). Ils s'hydratent
sauf si l'appelant passe explicitement `interactive={false}`.

S'applique à :

- Familles de superpositions/popovers (info-bulle, hover-card, popover, menu)- Modaux / tiroirs / glisser (dialogue, tiroir, séparateur)- Développer/Réduire (réductible)- Singletons clients purs (toast)
### Niveau 2 — Détection automatique intelligente

> **Règle de base : `shouldHydrate(interactive, hasSignal)`**
Ces composants sont _statiques par défaut, interactifs uniquement lorsqu'un signal est présent_.
Il s'agit de **contrôles de forme contrôlés/non contrôlés ou de groupes sélectionnables** : hydratation uniquement
est important lorsque l'état (`value` / `checked` / `defaultValue`) ou un gestionnaire
(`onChange` / `onClick` …) est fourni ; sinon, un balisage statique suffit.

S'applique à :

- Contrôles de formulaire (bouton, case à cocher, commutateur, zone de texte, champ, curseur, zone de liste déroulante, groupe radio)- Groupes sélectionnables (groupe de segments, groupe à bascule)- Tableaux avec clics sur les lignes (tableau)- Avatar avec un `src` (le cycle de vie de chargement/erreur de l'image asynchrone est un signal réservé au client)- Pagination / tags-field / pin-field (état + gestionnaires ; une pagination `type="link"` qui  fournit `getPageUrl` est une pure navigation et reste statique)

### Niveau 3 – Présentation

> **Ne monte jamais sur une île**
Des composants typographiques/décoratifs purs sans comportement du client. Ils **ne doivent pas déclarer**
**un accessoire `interactif`** (historiquement `badge` / `heading` / `text` / `fieldset` par erreur
l'a déclaré et a divulgué l'attribut sur le DOM - maintenant supprimé).

S'applique à :

- Typographie (texte, titre, badge)- Disposition (groupe, centre absolu, ensemble de champs)- Indicateurs d'état (alerte, fil d'Ariane, chargeur, squelette, spinner, progression)- Graphiques (icône)
***

## Classification complète des composants

> Légende du statut : `✅` est conforme à la convention ; `⚠️` s'écarte de la convention et> a besoin d’une migration (voir Section 7). Après la dernière passe de nettoyage, **tous les composants sont `✅`**.
### Niveau 1 (auto-interactif)

| Component | Rule | Trigger | Statut |
| --- | --- | --- | --- |
| `dialog` | `shouldHydrate(interactive, true)` | Always hydrates unless `interactive={false}` | ✅ `dialog.tsx` |
| `drawer` | `shouldHydrate(interactive, true)` | Always hydrates unless `interactive={false}` | ✅ `tiroir.tsx` |
| `splitter` | `shouldHydrate(interactive, true)` | Always hydrates unless `interactive={false}` | ✅ `splitter.tsx` |
| `tooltip` | `shouldHydrate(interactive, true)` | Always hydrates | ✅ `tooltip.tsx` |
| `hover-card` | `shouldHydrate(interactive, true)` | Always hydrates | ✅ `hover-card.tsx` |
| `popover` | `shouldHydrate(interactive, true)` | Always hydrates | ✅ `popover.tsx` |
| `menu` | `shouldHydrate(interactive, true)` | Always hydrates | ✅ `menu.tsx` |
| `select` | `shouldHydrate(interactive, true)` | Always hydrates — opening the dropdown and selecting an item require JS; there is no static fallback (the native `<select>` is visually hidden and exists only for form submission) | ✅ `select.tsx` (Niveau 1) |
| `collapsible` | `shouldHydrate(interactive, true)` | Always hydrates (expand/collapse needs JS) | ✅ `collapsible.tsx` (Niveau 1) |
| `toast` | Always island (client singleton) | No prop, always an island | ✅ `toast.tsx` |

### Niveau 2 (détection automatique intelligente)

| Component | Behaviour signal (`hasSignal` is true when…) | Status |
| --- | --- | --- |
| `button` | `onClick` / `onPointerDown` / `onSubmit` | ✅ `button.tsx` |
| `card` | `onClick` / `onPointerDown` | ✅ `card.tsx` |
| `table` | any `row.onClick` | ✅ `table.tsx` |
| `segment-group` | `value` / `defaultValue` / `onValueChange` | ✅ `segment-group.tsx` |
| `toggle-group` | `value` / `defaultValue` / `onValueChange` | ✅ `toggle-group.tsx` |
| `slider` | `value` / `defaultValue` / `onChange` / `onDraggingChange` | ✅ `slider.tsx` |
| `checkbox` | `checked` / `defaultChecked` / `onCheckedChange` | ✅ `checkbox.tsx` |
| `switch` | `checked` / `defaultChecked` / `onCheckedChange` | ✅ `switch.tsx` |
| `textarea` | `value` / `defaultValue` / `onValueChange` / `validator` / `minLength` | ✅ `textarea.tsx` |
| `field` | `value` / `defaultValue` / `onValueChange` / `validator` / `minLength` | ✅ `field.tsx` |
| `combobox` | `open` / `inputValue` / `onToggle` / `onInputChange` / `onItemSelect` | ✅ `combobox.tsx` |
| `radio-group` | `value` / `defaultValue` / `onValueChange` | ✅ `radio-group.tsx` |
| `avatar` | `src` (async image load / error lifecycle) | ✅ `avatar.tsx` (Tier-2) |
| `pagination` | `onPageChange`, or non-link `page` / `defaultPage` / `pageSize` / `defaultPageSize` | ✅ `pagination.tsx` |
| `tags-field` | `onValueChange` / `onInputValueChange` / `value` / `inputValue` / `defaultValue` / `defaultInputValue` | ✅ `tags-field.tsx` |
| `pin-field` | `value` / `defaultValue` / `onValueChange` / `onValueComplete` / `onValueInvalid` / `validator` / `autoSubmit` / `onAutoSubmit` | ✅ `pin-field.tsx` |
| `paginated-table` | Always island (manages internal pagination state) | ✅ `paginated-table.tsx` (Tier-2 logic) |
| `date-picker` | `value` / `defaultValue` / `focusedValue` / `open` / `defaultOpen` / `onValueChange` / `onOpenChange` / (keyboard/click/typing events) | ✅ `date-picker.tsx` |
| `color-picker` | `value` / `defaultValue` / `format` / `defaultFormat` / `open` / `defaultOpen` / `onValueChange` / `onFormatChange` / `onOpenChange` / (pointer/keyboard/input events) | ✅ `color-picker.tsx` |

### Niveau 3 (présentation)

| Component | Notes | Status |
| --- | --- | --- |
| `text` | Typographic text | ✅ |
| `heading` | Heading | ✅ |
| `badge` | Badge | ✅ (dead `interactive` prop removed) |
| `fieldset` | Form fieldset | ✅ (dead `interactive` prop removed) |
| `alert` | Alert box | ✅ |
| `breadcrumb` | Breadcrumb | ✅ |
| `group` | Layout grouping | ✅ |
| `absolute-center` | Centering layout | ✅ |
| `loader` | Loading indicator | ✅ |
| `skeleton` | Skeleton screen | ✅ |
| `spinner` | Spinner indicator | ✅ |
| `progress` | Progress bar (value-driven, static by default) | ✅ |
| `icon` | SVG icon wrapper (size/color only, no client state) | ✅ `icon.tsx` |

***

## Conditions de déclenchement par niveau

### Conditions de niveau 1

- L'interaction principale du composant (ouvrir une superposition, faire glisser un séparateur, développer/réduire,  modal focus-trap) **ne peut pas être exprimé en HTML pur**, donc `hasSignal`
  la valeur par défaut est « vrai ».
- Le seul opt-out légal est `interactive={false}` (par exemple, forcer la désactivation d'une superposition à l'intérieur d'un  document purement statique).
- `toast` est spécial : c'est un client singleton global (`toaster.create(...)`), et ne  exposer un accessoire « interactif ».

### Conditions de niveau 2

Le « hasSignal » de chaque composant est un OU booléen sur « cet accessoire est-il défini ? » :

```typescript
// Typical pattern (segment-group shown)
const hasSignal =
	rest.value !== undefined ||
	rest.defaultValue !== undefined ||
	rest.onValueChange !== undefined;
if (shouldHydrate(interactive, hasSignal)) return <SegmentGroupIsland {...rest} />;
return <Root {...rest}>{/* static structure */}</Root>;
```

Principes de décision :

1. **État contrôlé** (`value` / `checked` / `open` / `inputValue`) → nécessite que JS reste synchronisé.2. **Valeur initiale non contrôlée** (`defaultValue` / `defaultChecked`) → nécessite JS pour conserver l'état interne.3. **Gestionnaires d'événements** (`onChange` / `onClick` / `onValueChange` / `onItemSelect` …) → a besoin de JS pour répondre.4. **Validation / contraintes** (`validator` / `minLength`) → nécessite JS pour s'exécuter.5. **Indices asynchrones/client uniquement** — `src` sur `avatar` (implique un cycle de vie de chargement/erreur),   ou tout accessoire dont le seul but est un effet côté client (média, intersection, paresseux
   chargement). Ceux-ci ne peuvent pas être résolus sans JS, ils comptent donc comme un signal.
6. N'importe lequel des éléments ci-dessus étant présent rend « hasSignal » vrai, ce qui déclenche l'hydratation ;   si tous sont absents, le composant s'affiche sous forme de balisage statique pur.

> **`avatar` est spécial parmi les composants de niveau 2 :** son signal est le signal de chargement asynchrone `src`.> Lorsque `src` est présent, l'image nécessite une gestion du chargement/des erreurs côté client, donc> `shouldHydrate(interactive, Boolean(src))` l'hydrate ; un `avatar` sans `src` (par exemple un> initiales de secours) reste statique. Un `interactive={false}` explicite supprime l'hydratation même> lorsque `src` existe (conformément à la sémantique "`false` wins" à l'échelle de la bibliothèque).
> **Exception en mode lien `pagination` :** une pagination `type="link"` qui fournit `getPageUrl`> est une pure navigation (chaque page est une ancre), elle reste donc statique sauf indication explicite> Le gestionnaire `onPageChange` est fourni. Uniquement en mode bouton (ou avec `onPageChange`) faites le> Les accessoires `page` / `defaultPage` / `pageSize` / `defaultPageSize` comptent comme des signaux.
### Conditions de niveau 3

- Le composant ne contient aucun état client et ne répond à aucun événement.- Il ne déclare pas de prop « interactive ». (Historiquement `badge` / `titre` / `texte` /  `fieldset` l'a déclaré à tort et a divulgué `interactive="true"` sur le DOM ; ça a
  été supprimé lors du nettoyage.)

***

## Liste de contrôle de décision pour les nouveaux composants

Parcourez la liste dans l’ordre ; s'arrêter au premier match :

1. **Son existence dépend-elle entièrement du client JS ?**   Superposition / modal / glisser / développer-réduire → **Tier-1**, utiliser
   `shouldHydrate(interactif, vrai)`.
2. **Est-ce un contrôle de formulaire ou un composant visuellement sélectionnable qui peut être contrôlé ou**\*\* incontrôlé ?\*\*
   bouton / case à cocher / commutateur / curseur / combobox / tableau de clic de ligne… → **Tier-2**,
   définissez `hasSignal` (état + gestionnaires) puis appelez `shouldHydrate(interactive, hasSignal)`.
3. **Est-ce purement typographique/mise en page/décoratif ?**   texte / titre / alerte / groupe / progression… → **Tier-3**, pas d'accessoire « interactif », pas d'îlot.

**Exigences strictes en matière de mise en œuvre :**

- Aucun composant ne peut écrire une simple branche `if (interactive) { … }` ; passez toujours par « shouldHydrate ».- « interactif » n'est qu'un « bouton » : « vrai » force, « faux » interdit, « non défini » s'en remet à « hasSignal ».- Chaque composant de niveau 1/niveau 2 doit ajouter une section « # Hydratation » à son  `content/components/<Component>.mdx` et faites une référence croisée à ce fichier, et définissez
  son champ « hydratation » de premier plan (`1` / `2` / `3`) doit correspondre.

***

## Journal de nettoyage historique (déjà corrigé)

Les divergences suivantes ont été résolues lors du déploiement de la convention : conservé ici pour traçabilité :

| # | Component | Original divergence | Réparer |
| --- | --- | --- | --- |
| 1 | `splitter` / `dialog` / `drawer` | Hardcoded `interactive = true` + `if (interactive)`, bypassing `shouldHydrate` | Passé à `shouldHydrate(interactive, true)`, rétablissant la désinscription `interactive={false}` |
| 2 | `radio-group` | `interactive ? Island : Root`, forcing callers to pass `interactive` | Basculé vers `shouldHydrate(interactive, hasSignal)`, signale `value` / `defaultValue` / `onValueChange` |

| 3 | `avatar` | Ad-hoc \`if (rest.src |  | interactive)\` | Switched to `shouldHydrate(interactive, Boolean(rest.src))`, unified entry point |

| 4 | `badge` / `heading` / `text` / `fieldset` | Dead `interactive` prop declared, leaked onto the DOM via `restProps` (`interactive="true"`) | Suppression de la déclaration de prop « interactive » |
| 5 | `collapsible` | Tier not documented explicitly | Ajout d'une section `# Hydration` à `docs/Collapsible.md`, la marquant de niveau 1 |
| 6 | `tags-input` | Bare `if (isInteractive)` branch, no `interactive` prop, no `shouldHydrate`, and `defaultValue` / `defaultInputValue` omitted from the signal set (an uncontrolled tags-input rendered static) | Passé à `shouldHydrate(interactive, hasSignal)`, ajout du bouton `interactive`, extension de l'ensemble de signaux pour inclure `defaultValue` / `defaultInputValue` |
| 7 | `pagination` / `avatar` | Missing from the tier tables (`pagination` absent entirely; `avatar` mis-classified as Tier-1) and `pagination` over-hydrated in link mode | Ajout de « pagination » + « tags-input » au niveau 2 ; déplacement de « avatar » au niveau 2 (signal de signal de charge) ; Mode lien `pagination` fermé pour que la navigation pure reste statique |

> Remarque : l'élément 4 était un vrai bug — `badge` / `heading` / `text` / `fieldset` serait rendu> « interactif » comme attribut HTML non valide sur le DOM ; il était prioritaire pour la réparation.
***

## Documentation connexe

- [Architecture des composants de l'interface utilisateur](/docs/Architecture) – la présentation au niveau du projet- `app/components/ui/island-utils.ts` — le point d'entrée de décision unique- `content/components/<Component>.mdx` (chaque composant de niveau 1/niveau 2) — sa propre section `# Hydratation`, plus le thème principal `hydratation`/`catégorie`
