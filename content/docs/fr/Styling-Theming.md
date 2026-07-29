---
title: Style et thématisation
---

Ce projet met en style chaque composant avec [PandaCSS](https://panda-css.com) (CSS-in-JS typé, sans exécution à l'exécution) au-dessus de `hono/jsx` brut — **pas** l'un des frameworks JSX officiellement pris en charge par Panda (React/Vue/Solid/Qwik). Ce seul fait — `jsxFramework: undefined` dans `panda.config.ts` — est la cause profonde de presque toutes les régressions de style que ce projet a rencontrées, parce qu'il retire silencieusement à la base de code plusieurs choses que Panda fait normalement pour vous. Cette page documente l'architecture qui en résulte, les bugs concrets qu'elle a déjà causés, et la checklist à suivre pour éviter qu'ils ne se reproduisent.

---

## Comment les styles vont d'une recette à la page

1. Les **recettes** sont écrites sous `app/theme/recipes/*.ts` avec `defineRecipe` de Panda (classe unique, par ex. `badge.ts`) ou `defineSlotRecipe` (composants multiparties avec des emplacements nommés, par ex. `switch.ts` — `root`/`control`/`thumb`/…).
2. Chaque recette est enregistrée par clé d'objet dans `app/theme/recipes/index.ts`, sous `recipes` (plate) ou `slotRecipes` (à emplacements). **La clé d'enregistrement est ce à quoi tout le reste se réfère** — pas le `className` de la recette, et pas son nom de fichier. `switch.ts` exporte `switchRecipe` (`switch` est un mot réservé) et est enregistrée sous `switchRecipe: switchRecipe` ; `panda.config.ts` et tout code faisant référence à la recette doit utiliser `switchRecipe`, jamais `switch`.
3. `panda.config.ts` étend la configuration combinée d'`app/theme/` (`theme: { extend: { ...theme.config } }`) et analyse `include: ["./app/**/*.{js,jsx,ts,tsx}"]` pour l'usage des styles.
4. Panda écrit le système généré — fonctions d'aide des recettes, tokens, patterns, le runtime `css`/`cx` — dans `design-system/`, importé via l'alias Vite `design-system` (`vite.config.ts`). **`design-system/` est gitignoré** — c'est un artefact de build, régénéré à neuf à chaque installation/build via PostCSS (`postcss.config.cjs` connecte `@pandacss/dev/postcss`) et le script `prepare` (`panda codegen`, exécuté une fois lors de `bun install`). Seuls les fichiers *sources* — `app/theme/recipes/*.ts`, `panda.config.ts` — sont réellement livrés ; rien de ce que vous faites directement à `design-system/` n'est jamais commité.

### `codegen` vs `cssgen` — il faut souvent les deux, à la main

| Commande | Régénère | Nécessaire après |
| --- | --- | --- |
| `bunx panda codegen` | `design-system/recipes/*.mjs` + `.d.ts` — les fonctions d'aide de recette (`switchRecipe()`, `.splitVariantProps()`, `.variantKeys`, `.variantMap`) que le code applicatif appelle à l'exécution | L'ajout/la suppression/le renommage d'une **variante** sur n'importe quelle recette |
| `bunx panda cssgen` | `design-system/styles.css` — les règles CSS réellement générées | L'ajout/la suppression d'une **valeur de variante**, ou un changement de `staticCss` |

L'intégration PostCSS de `vite dev` réextrait le CSS à la volée pendant que vous éditez, mais elle ne régénère **pas** les fichiers d'aide de recette `.mjs`/`.d.ts` — ce sont de simples fichiers générés que votre code importe directement (`import { switchRecipe } from "design-system/recipes"`), pas un module virtuel transformé par Vite. Si vous ajoutez une prop `colorPalette` aux `variants` d'une recette et que vous vous contentez d'enregistrer le fichier, `switchRecipe.splitVariantProps()` continue d'utiliser la liste **périmée** de `variantKeys` jusqu'à ce que vous exécutiez `panda codegen` — la nouvelle prop est alors silencieusement routée vers les « props locales » au lieu des « props de variante », et soit fuit vers le DOM comme un attribut invalide, soit n'atteint jamais du tout la fonction de style. **Exécutez les deux commandes à la main après avoir édité un fichier de recette**, ne présumez pas que le serveur de développement l'a détecté.

---

## `staticCss` : pourquoi presque chaque recette est forcée à `["*"]`

L'analyse statique de Panda ne peut pré-générer du CSS que pour les valeurs qu'elle peut voir littéralement dans le code source (`<Badge size="sm">`) — ou, pour les intégrations de framework JSX, via le mapping `jsx: [...]` de chaque recette (`button.ts` et une poignée d'autres l'utilisent). Les composants de cette base de code sont appelés comme `recipeName(variantProps)` à l'intérieur des fichiers primitifs, toujours avec un **objet calculé à l'exécution** (`switchRecipe.splitVariantProps(props)`), et la plupart du contenu est du JSON rédigé via le CMS (`content/pages/*.json`) avec des valeurs de couleur/taille/variante qui n'existent nulle part comme littéral de chaîne dans le code source `.tsx`. L'extracteur de Panda ne peut rien voir de tout cela, donc **chaque recette sans mapping `jsx` doit être forcée à générer toutes ses combinaisons de variantes** via `staticCss.recipes: { <recipeKey>: ["*"] }` de `panda.config.ts` — en utilisant la *clé d'enregistrement* depuis `app/theme/recipes/index.ts`, pas le `className` de la recette.

C'est exactement ainsi que le bug de taille du switch (ci-dessous) est arrivé, et c'est un risque systémique : **toute faute de frappe entre la clé de `staticCss.recipes` et le nom d'export/d'enregistrement réel de la recette fait silencieusement tomber la génération de cette recette à zéro variante non par défaut**, sans aucune erreur, avertissement ou échec de typage nulle part — Panda se contente d'émettre discrètement le CSS de base + variante par défaut et rien d'autre. Si vous ajoutez une toute nouvelle recette, pensez à ajouter immédiatement son entrée à clé d'enregistrement dans `staticCss.recipes`, et vérifiez que la clé correspond exactement à `app/theme/recipes/index.ts` (`grep` la clé dans les deux fichiers en cas de doute).

---

## Régressions connues et les règles qui les préviennent

### 1. La clé de `staticCss.recipes` doit correspondre au nom d'enregistrement de la recette, pas à son `className`

**Symptôme :** chaque valeur de variante non par défaut (par ex. `size="sm"`/`"lg"` sur `<Switch>`) se rend avec les propriétés personnalisées CSS simplement non définies — un élément 0×0 effondré et invisible, ou un style manquant entièrement — tandis que la variante par défaut a l'air normale.

**Cause :** `switch.ts` exporte `switchRecipe` (enregistrée sous cette clé dans `slotRecipes`), mais `staticCss.recipes` de `panda.config.ts` avait `switch: ["*"]` — une clé qui ne correspond à rien. Seul le CSS de base + `defaultVariants` est livré (Panda émet toujours cela, indépendamment de `staticCss`) ; chaque autre valeur de variante se retrouve silencieusement avec zéro CSS généré.

**Correction :** la clé dans `staticCss.recipes` doit être la clé d'enregistrement exacte depuis `app/theme/recipes/index.ts` (`switchRecipe`, pas `switch`). C'est facile à mal faire pour toute recette dont le fichier/className ne correspond pas à son nom d'export, et cela ne donne **aucun** signal au moment de la compilation ou de l'exécution en cas d'erreur — vérifiez en grepant le CSS généré pour la classe de variante attendue (par ex. `grep "switch__root--size_sm" design-system/styles.css`) après toute modification de `staticCss`, ne vous fiez pas à un simple coup d'œil sur la config.

**Ceci s'est reproduit trois fois** sur la même recette avant d'être réellement corrigé, parce que `design-system/` est gitignoré — exécuter `cssgen` après avoir corrigé la config produit une sortie *locale* correcte, mais si la modification de `panda.config.ts` elle-même n'est jamais commitée, le bug revient dès que quelqu'un d'autre régénère. **La seule partie durable de toute correction `staticCss`/recette est la modification du fichier source** (`panda.config.ts`, `app/theme/recipes/*.ts`) — confirmez toujours avec `git status`/`git diff` que ces fichiers sont réellement mis en staging, pas seulement que le CSS local a l'air correct.

### 2. Les variantes de recette à emplacements doivent être indexées par emplacement, sinon Panda les abandonne silencieusement

**Symptôme :** une classe de variante est présente dans le HTML rendu (`carousel__root--colorPalette_green`), le style prévu est complètement absent, et le CSS généré comporte **zéro** règle pour cette classe — pas même une règle vide.

**Cause :** dans un `defineSlotRecipe`, chaque valeur de variante doit imbriquer ses styles sous le nom de l'emplacement qu'elle cible :

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

Un `defineRecipe` plat (sans emplacements — `badge.ts`, `anchor.ts`, `button.ts`) utilise correctement la forme *non indexée par emplacement* ; copier ce motif dans un `defineSlotRecipe` (tout ce qui a un tableau `slots: [...]`) est l'erreur. Cela a touché `rating-group.ts`, `carousel.ts` et `clipboard.ts` indépendamment — c'est un piège de copier-coller facile entre les deux types de recette, et cela vaut la peine d'y regarder à deux fois chaque fois qu'une nouvelle variante d'une recette à emplacements « ne fait rien ».

### 3. Les styles conditionnels de `base` perdent face aux styles de `variant` pour la même propriété CSS — toujours, indépendamment de la spécificité

**Symptôme :** un style conditionnel/piloté par un état placé dans le bloc `base` d'une recette à emplacements (par ex. `&[data-complete]: { borderColor: ... }`) ne s'applique jamais, même si l'attribut/la classe est confirmé présent dans le DOM et que la règle CSS elle-même est confirmée présente dans la feuille de style.

**Cause :** Panda émet les styles de `base` et de `variants` dans des **couches de cascade CSS séparées**, la couche des variantes étant ordonnée après celle de base. L'ordre des couches CSS l'emporte inconditionnellement sur la spécificité des sélecteurs — un sélecteur `base` très spécifique perd quand même face à une règle inconditionnelle nue dans la couche `variants` si elles fixent la même propriété.

**Correction :** déplacez le remplacement conditionnel dans **chaque bloc `variant.<name>.<slot>` pertinent** au lieu de `base`, en dispersant un objet partagé dans chacun si les styles se répètent. La gestion de `_invalid` d'`app/theme/recipes/input.ts` (dupliquée par variante, pas centralisée dans `base`) est le motif de référence existant.

### 4. Les tokens `colorPalette.*` se résolvent en une vraie couleur (gris-ish, presque noir), jamais en « aucune couleur » — une *portée active* est requise

**Symptôme :** un composant stylé avec `bg: "colorPalette.solid.bg"` etc. se rend dans un gris/noir sombre et sourd, quelle que soit la prop `colorPalette` passée (ou même si la recette n'a aucun concept de `colorPalette`).

**Cause :** `colorPalette.*` sont des tokens virtuels qui se résolvent par rapport aux propriétés personnalisées `--colors-color-palette-*` en portée à ce nœud du DOM. Le thème définit une **portée par défaut globale sur `gray`** à `:root`/`html`, donc partout où aucune portée `colorPalette` plus spécifique n'est active, `colorPalette.solid.bg` se résout silencieusement en `gray.solid.bg` — pas transparent, pas une erreur, une vraie couleur (sombre). C'est facile à mal diagnostiquer comme « cassé » alors que c'est en fait simplement « sans portée ».

**Correction :** appliquez une véritable portée `colorPalette`, selon le motif centralisé ci-dessous — ne présumez pas qu'un composant « n'a tout simplement pas de couleur » parce qu'il a l'air gris/noir.

### 5. Les props de variante responsives n'émettent pas de CSS de point de rupture

`<Heading size={{ base: "2xl", md: "3xl" }}>` se rend correctement en `class="heading--size_2xl md:heading--size_3xl"` dans le HTML, mais aucune règle `@media` pour la classe `md:` n'est jamais générée — `staticCss.recipes: ["*"]` ne force la génération que des classes de variante littérales, non responsives, il ne les multiplie pas avec les conditions de point de rupture. **Ne passez jamais un objet responsive comme prop de variante** ; utilisez une valeur littérale plate, ou un remplacement `css()`/classe utilitaire englobant pour la propriété spécifique qui doit changer par point de rupture (les classes utilitaires ordinaires n'ont pas cette limitation, seules les props de variante de recette l'ont).

---

## Thématisation `colorPalette` : le motif centralisé

Les frameworks JSX officiellement pris en charge par Panda obtiennent `colorPalette` « gratuitement » : leur wrapper `styled()` détache automatiquement une prop `colorPalette` de tout composant et la fusionne en tant que classe utilitaire générique, aux côtés de ce que produisent déjà les variantes propres de la recette. **Ce dépôt n'obtient pas cela**, parce que `jsxFramework: undefined`. Les recettes en amont de [Park UI](https://park-ui.com) (la source originelle des composants de ce projet, portée à la main vers `hono/jsx`) s'appuient exactement sur cette intégration manquante — leur propre `switch.ts` n'a pas non plus de variante `colorPalette`.

Pendant des années, pour un sous-ensemble de composants, cela a été contourné en **déclarant à la main une variante `colorPalette` sur la recette elle-même** (`badge.ts`, `anchor.ts`, `button.ts`, …), en copiant-collant la même carte de palette d'environ 11 entrées dans chacune. Cette approche est ce qui a causé la plupart des bugs ci-dessus : c'est facile à oublier sur un nouveau composant (`switch.ts`/`avatar.ts`/`card.ts`/`checkbox.ts` ne l'ont jamais reçue, donc leur prop `colorPalette` ne faisait silencieusement rien), facile à se tromper entre la forme indexée par emplacement et la forme non indexée (§2), et cela a dispersé la même liste de noms de palette — avec des dérives — à travers une douzaine de fichiers (les cartes faites à la main de certaines recettes référençaient `teal`/`indigo`/`pink`/`yellow`, des noms de palette qui n'existent même pas dans `app/theme/colors/` de ce thème — ceux-là aussi n'auraient rien fait silencieusement).

**Le motif actuel** (depuis la passe de centralisation de `colorPalette`) remplace tout cela par un utilitaire partagé unique :

- `staticCss.css` de `panda.config.ts` force la génération de la classe utilitaire Panda `colorPalette` ordinaire (`.color-palette_blue`, etc.) pour chaque nom de palette réel que le thème définit effectivement (`gray`/`blue`/`green`/`red`/`orange`/`purple`/`cyan`/`amber` — vérifiez `app/theme/colors/*.ts` pour la liste actuelle avant d'ajouter un nouveau nom où que ce soit).
- `app/components/ui/color-palette.ts` exporte `colorPaletteClass(colorPalette?: string)`, qui résout les alias (`success`→green, `error`→red, `warning`→orange, `slate`→gray — `slate` en particulier est utilisé dans tout le contenu du CMS bien que l'échelle de gris de ce thème ne soit jamais enregistrée que sous `gray`) et renvoie la bonne classe utilitaire.

**Pour ajouter le support de `colorPalette` à un composant** (un composant dont la recette référence des tokens `colorPalette.*` mais qui n'offre aucun moyen à un consommateur d'en choisir une réellement) :

1. N'ajoutez **pas** de variante `colorPalette` à la recette. Laissez les références de tokens `colorPalette.*` de la recette telles quelles.
2. Dans la primitive du composant (`*-primitive.tsx`), déstructurez `colorPalette` hors des props **avant** que tout `...rest`/`...restProps` étalé n'atterrisse sur le nœud DOM — comme toute autre prop connue — afin qu'elle ne fuie jamais comme un attribut HTML invalide `colorpalette="..."`.
3. Si le composant avait auparavant une couleur par défaut codée en dur, préservez-la comme une simple valeur par défaut JS sur la déstructuration (`colorPalette = "blue"`), pas comme une entrée `defaultVariants` de recette.
4. Fusionnez `colorPaletteClass(colorPalette)` dans la liste de classes de l'**emplacement racine/primaire** — `cx(styles.root, colorPaletteClass(colorPalette), classProp)` — afin qu'elle se propage aux emplacements descendants via l'héritage normal des propriétés personnalisées CSS. Elle doit uniquement aller sur l'élément le plus externe qui établit la portée, jamais sur chaque emplacement.
5. Si le composant est composé via un fournisseur de contexte (par ex. `ButtonGroup` → `Button` via `ButtonContext`), assurez-vous que `colorPalette` est propagé explicitement à travers cette valeur de contexte — elle ne fait plus partie de `variantProps`, donc tout ce qui transmettait auparavant `variantProps` seul pour propager la couleur doit avoir `colorPalette` rajouté à la main.
6. Régénérez (`panda codegen && panda cssgen`) et vérifiez : rendez le composant, grepez le HTML SSR (ou `design-system/styles.css`) pour la classe `color-palette_<name>` attendue, et confirmez qu'aucun attribut nu `colorpalette=` n'a fui sur le DOM.

Ne réintroduisez pas une carte de variante `colorPalette` par recette pour un nouveau composant — c'est exactement le motif que cette centralisation a remplacé, précisément parce qu'il ne passe pas à l'échelle et régresse silencieusement.

---

## Couleurs de tokens vs tokens sémantiques

- **`tokens.colors`** (`app/theme/tokens/colors.ts`) — valeurs statiques pures (noir, blanc).
- **`semanticTokens.colors`** (`app/theme/index.ts`, `app/theme/colors/*.ts`) — les échelles de palette adaptatives (gray/slate, blue, red, green, orange, purple, cyan, amber), chacune compilée en propriétés personnalisées automatiques pour les modes clair/sombre.

**Évitez les tokens génériques `bg`/`fg`** — ils se compilent en CSS transparent/invalide dans ce thème (le plugin « Remove Panda Preset Colors » dans `panda.config.ts` retire le preset de couleurs par défaut de Panda, et les `bg`/`fg` génériques n'ont jamais été remplacés). Utilisez plutôt des tokens sémantiques explicites : `gray.surface.bg`, `fg.default`, `gray.outline.border`, etc. Les popups/menus déroulants/panneaux d'autocomplétion en particulier devraient utiliser `gray.surface.bg` (pas `colorPalette.surface.bg`) afin que le fond du panneau reste une surface opaque neutre, indépendamment de la couleur d'accent active sur le déclencheur.

### Où vit réellement l'accent par défaut à l'échelle du site

Chaque fichier de couleur sous `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate`) est une option `colorPalette` entièrement formée et prête à l'emploi — de forme identique (une échelle 1–12, une échelle alpha a1–a12, et des sous-groupes `solid`/`subtle`/`surface`/`outline`/`plain`, chacun avec `bg`/`fg`). Le fait qu'une couleur existe dans ce répertoire signifie seulement qu'elle a été générée (par ex. par le CLI Park UI à l'initialisation du projet) — cela ne dit rien sur le fait qu'elle soit *active* où que ce soit.

**Rien dans Panda lui-même, et rien dans la sortie du CLI de Park UI (`components.json`), ne conserve la couleur que vous choisissez comme « l' » accent pendant l'initialisation** — il n'y a de clé de config pour cela dans aucun des deux. La seule chose qui décide réellement de l'accent par défaut à l'échelle du site est une ligne écrite à la main :

```ts
// app/theme/global-css.ts
html: {
  colorPalette: "gray",
  // ...
},
```

Cela définit la portée `colorPalette` racine que tout élément sans portée hérite. C'est une simple déclaration CSS, facile à négliger et facile à perdre de vue — si vous vous demandez un jour « pourquoi ce projet utilise-t-il `gray` comme accent au lieu de `cyan`/peu importe ce que j'ai choisi à l'initialisation », cette ligne est la réponse, et la modifier est une édition d'une seule ligne, à faible risque (chaque fichier de couleur a la forme de token identique, donc échanger la valeur est un remplacement propre et direct).

**Cette valeur par défaut n'est qu'un repli.** N'importe lequel des 13 composants migrés vers le motif centralisé `colorPaletteClass()` ci-dessus (switch, badge, button, card, …) porte sa **propre** valeur par défaut explicite (voir la liste par composant dans cette section) et ne suivra pas un changement de cette ligne — seuls les composants/utilitaires sans `colorPalette` explicite propre (les propriétés personnalisées globales d'anneau de focus/sélection également déclarées dans `global-css.ts`, et toute recette pas encore migrée) lisent réellement cette valeur racine.

### `fg`/`border`/`canvas` sont délibérément gris uniquement, toujours

`fg.default`, `fg.muted`, `fg.subtle`, `border` et `canvas` (déclarés dans `semanticTokens.colors` d'`app/theme/index.ts`) sont codés en dur directement sur `colors.gray.*` — **pas** `colors.colorPalette.*`. C'est intentionnel, pas une lacune : c'est la convention standard Radix/Park UI « un accent + un gris » — le texte du corps, les bordures et le fond de page doivent rester neutres indépendamment de l'accent actif, à la fois pour le contraste/la lisibilité et pour que l'accent se lise comme un accent plutôt que de teinter toute la page. Ne « corrigez » pas ces tokens pour référencer `colorPalette.*` en espérant qu'ils reprennent l'accent du site ; ce serait une régression, pas une amélioration. Seules les surfaces véritablement interactives/de marque (l'état coché d'un contrôle, le remplissage solide d'un bouton, le fond d'un badge, …) devraient référencer `colorPalette.*` — confirmé comme le motif réel dans chaque recette de contrôle (`switch.ts`, `checkbox.ts`, `badge.ts`, `button.ts` : l'état neutre/non coché utilise un token `gray.*` codé en dur, l'état coché/accent utilise `colorPalette.*`).

---

## Checklist de vérification après toute modification de recette ou de `panda.config.ts`

Ne faites pas confiance à un coup d'œil visuel — les bugs ci-dessus avaient tous *l'air* de rien de cassé jusqu'à un examen attentif (un élément noir/gris se lit comme « style par défaut », pas « cassé »).

1. `bunx panda codegen && bunx panda cssgen` (depuis la racine du dépôt — vérifiez `pwd` d'abord ; exécuter ces commandes depuis un sous-répertoire écrit silencieusement `design-system/` au mauvais emplacement imbriqué au lieu de renvoyer une erreur).
2. Grepez le CSS généré pour la classe spécifique attendue : `grep "switch__root--size_sm" design-system/styles.css`, `grep "color-palette_blue" design-system/styles.css`.
3. Rendez la page réelle (serveur de développement ou `bun test`) et grepez la sortie HTML SSR pour la même classe, et pour l'*absence* de tout nom de prop brut ayant fui comme attribut DOM (`colorpalette="..."`, `size="..."` etc. sur un élément qui ne devrait pas l'avoir).
4. `bun test` — exécutez la suite de tests unitaires complète ; un test périmé affirmant un ancien format de nom de classe est un faux positif courant après un refactoring de style, cela vaut la peine d'une lecture rapide avant de présumer une vraie régression.
5. `git status`/`git diff` les fichiers **source** (`panda.config.ts`, `app/theme/recipes/*.ts`, `app/components/ui/*.tsx`) — jamais `design-system/`, qui est gitignoré et sera abandonné. Une correction qui « fonctionne localement » mais qui n'a jamais été réellement commitée dans le source n'est pas une correction.

---

## FAQ

### Comment puis-je changer la couleur d'accent par défaut à l'échelle du site ?

Éditez une ligne dans `app/theme/global-css.ts` :

```ts
html: {
  colorPalette: "cyan", // was "gray"
  colorScheme: { _light: "light", _dark: "dark" },
},
```

La valeur doit être l'un des noms de palette qui existent réellement sous `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate` — enregistré sous `gray`). Chacun de ces fichiers a la forme de token identique (`solid`/`subtle`/`surface`/`outline`/`plain`, chacun avec `bg`/`fg`), donc c'est un échange propre et sûr — aucun autre token n'a besoin de changer en parallèle.

Ensuite :

1. `bunx panda codegen && bunx panda cssgen` pour régénérer.
2. Vérifiez le résultat : `fg`/`border`/`canvas` (texte du corps, séparateurs, fond de page) ne changeront **pas** — ils sont délibérément codés en dur sur l'échelle de gris neutre indépendamment de l'accent, voir ci-dessus. Seules les surfaces véritablement pilotées par l'accent (un switch/checkbox coché, un bouton solide, un badge sans portée, les anneaux de focus, la sélection de texte) reprendront la nouvelle couleur.
3. Rappelez-vous que ceci ne change que le **repli**. N'importe lequel des 13 composants déjà migrés vers `colorPaletteClass()` (switch, badge, button, anchor, card, checkbox, carousel, clipboard, date-picker, radio-card-group, rating-group) porte sa propre valeur par défaut explicite par composant et doit être mis à jour à la main un par un dans sa primitive (`app/components/ui/*-primitive.tsx`, la valeur par défaut de la déstructuration `colorPalette = "..."`) si vous voulez qu'ils suivent aussi le nouvel accent du site, plutôt que de garder leur valeur par défaut actuelle choisie individuellement.
