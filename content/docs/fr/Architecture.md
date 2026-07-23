---
title: Architecture
---

Ce projet est construit sur [**HonoX**](https://github.com/honojs/honox), un méta-framework au-dessus de [Hono](https://hono.dev) qui ajoute le routage basé sur les fichiers, les îlots (islands) serveur/client et la génération de sites statiques. Le style est géré par [PandaCSS](https://panda-css.com) (CSS-in-JS typé, sans exécution à l'exécution), le contenu est rédigé via [Sveltia CMS](https://sveltiacms.app) (`/admin/`), et l'ensemble du site est pré-rendu en HTML statique.

| Couche | Outil |
| --- | --- |
| Framework | [HonoX](https://honox.dev) |
| Routage | Basé sur les fichiers, sous `app/routes/` |
| Style | [PandaCSS](https://panda-css.com) → `design-system/` |
| Contenu | Markdown / MDX / JSON sous `content/` |
| CMS | [Sveltia CMS](https://sveltiacms.app), adossé à Git, sur `/admin/` |
| SSG | [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) |
| Déploiement | Cloudflare Pages (`wrangler.jsonc`) ou Vercel (`vercel.json`) |

***

## Le build : deux passes Vite, un site statique

`bun run build` exécute `vite build --mode client && vite build` — deux passes distinctes sur le même `vite.config.ts`, commutées par `mode` :

- **`--mode client`** compile `app/client.ts` (`createClient()` depuis `honox/client`) avec `jsxImportSource: "hono/jsx/dom"`. C'est le bundle navigateur : il hydrate les îlots et rien d'autre.
- **La passe par défaut (serveur)** compile `app/server.ts` (`createApp()` depuis `honox/server`) avec `jsxImportSource: "hono/jsx"` (le moteur JSX SSR), puis confie l'ensemble de l'application au plugin [`ssg()`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg), qui explore chaque route et écrit le HTML pré-rendu dans `dist/`.

### Routage SSG et corrections d'URL localisées

Pour éviter les erreurs de routage 404 sur les hébergeurs de fichiers statiques après la compilation des routes, un `fixSsgRoutingPlugin` personnalisé dans `vite.config.ts` traite de façon récursive tous les fichiers `.html` de la sortie de build (`dist/`). Il renomme et déplace les fichiers d'index/page d'accueil localisés (par ex. `zh.html`, `docs/fr.html`) vers des chemins propres imbriqués (`zh/index.html`, `docs/fr/index.html`) si un répertoire correspondant existe ou si le nom correspond à une locale prise en charge. Cela garantit que `/zh` et les autres points de terminaison localisés se résolvent proprement comme index de répertoire sur n'importe quel hébergeur statique.

### Résolution de l'environnement de test

Pour exécuter les tests unitaires des composants Hono JSX sous Bun, `bunfig.toml` est configuré spécifiquement avec :

```toml
[jsx]
runtime = "classic"
pragma = "h"
fragment = "Fragment"
importSource = "hono/jsx"
```

Cela garantit une résolution standard du moteur d'exécution Hono et évite les erreurs de runtime JSX de développement manquant lors de l'exécution des tests.

Le plugin `mdx()` est limité à `include: /\.mdx$/` uniquement — le `.md` simple (articles de blog, la plupart des docs) est délibérément laissé hors champ afin que les imports `?raw` de `app/utils/markdown.ts` ne soient pas corrompus par la transformation MDX.

***

## Routage basé sur les fichiers

Les routes se trouvent sous `app/routes/`, enregistrées dans `app/server.ts` via `import.meta.glob` sur `**/*.{ts,tsx,md,mdx}`, en excluant les conventions de fichiers privés de HonoX (`_*`, `-*`, `$*`) et les fichiers de test. Un fichier de route exporte des handlers (`GET`, `POST`, …) ou un composant par défaut ; `[slug].tsx` / `[[slug]].tsx` fournissent des segments dynamiques/optionnels, conformes aux propres conventions de routage de HonoX.

### Routes API statiques personnalisées

Dans HonoX, les routes API statiques personnalisées (par ex. `app/routes/api/posts.json.ts`) qui exportent une route standard renvoyant `c.json(...)` sont automatiquement compilées en fichiers JSON statiques (par ex. `dist/api/posts.json`) par le plugin `@hono/vite-ssg` lors du build SSG. Aucune configuration de paramètre dynamique n'est nécessaire pour ces points de terminaison statiques.

### Pré-rendu des routes dynamiques via ssgParams

Toute route dynamique (telle que `/blog/by-author/[author].tsx`) doit implémenter et exporter le middleware `ssgParams` dans la définition de la route afin de déclarer toutes les valeurs de paramètres potentielles pour le pré-rendu au moment du build.

### Routage localisé et redirections héritées

Les routes des collections traduisibles (`docs`, `blog`, `pages`) suivent `/<collection>/<locale?>/<item>`, la locale par défaut (`en`) ne prenant pas de segment :

```plain
/docs/AbsoluteCenter        (en)
/docs/fr/AbsoluteCenter     (fr)
/blog/my-post               (en)
/blog/zh/my-post            (zh)
```

Les **pages d'accueil linguistiques** indépendantes de la locale se trouvent sur le segment de locale nu (`/fr`, `/zh`, …). Tout cela est centralisé dans `app/lib/i18n.ts` (`detectLocale`, `localiseHref`, `stripLocale`, `localeToggleUrl`) — aucun fichier de route ne gère manuellement la logique de locale. Une ancienne forme de route, `/<locale>/<collection>/<item>`, est redirigée en 301 vers la forme actuelle par un middleware dans `app/server.ts`, afin que les signets/liens anciens continuent de fonctionner.

Les locales prises en charge sont déclarées une seule fois, dans `ALL_LOCALES` / `TRANSLATED_LOCALES` (`app/lib/i18n.ts`) — cette liste doit rester synchronisée avec `i18n.locales` de `public/admin/config.yml` et les répertoires de routes miroirs `app/routes/<locale>/`.

***

## Architecture des composants

La base de code maintient deux arbres parallèles sous `app/` :

- **`app/components/ui/`** — l'API de composants publique (~100 composants).
- **`app/islands/`** — les contreparties hydratées côté client, une par composant interactif, intégrées au bundle client et montées par `honox/client`.

### Sécurité serveur sans hook

Pour garantir une génération de site statique sans accroc, **tous les hooks réactifs côté client (`useEffect`, `useRef`, `useState` depuis `hono/jsx`) sont strictement restreints au répertoire `/islands/`**. Les fichiers sous le répertoire `/components/ui/` restent entièrement sans hook et sûrs pour le rendu statique/SSR côté serveur. Les wrappers statiques (comme `Dialog` et `Drawer` dans `components/ui/`) qui transmettent des références utilisent un repli d'objet simple statique (`{ current: null }`) à la place de `useRef` pour éviter l'exécution de hooks client sur le serveur.

### Résolution sûre des styles entre îlots

Les composants multiparties comme `HoverCard` qui rendent des enfants à travers les frontières d'îlots HonoX doivent implémenter une résolution de style de repli sûre (par ex. `context?.styles || recipe()`) dans leurs sous-composants primitifs afin de garantir que les noms de classe sont entièrement renseignés à la fois dans les états SSR/SSG pré-rendus et les états client hydratés.

### Positionnement des superpositions et astuces d'interaction

- **Positionnement correct :** Les wrappers racine des composants `Popover` et `HoverCard` utilisent les styles en ligne `position: 'relative'` et `display: 'inline-block'` (pour les implémentations statiques et interactives/îlots). Cela les empêche de prendre de l'espace en ligne de niveau bloc et positionne correctement leur contenu superposé absolu par rapport au déclencheur.
- **Gestion du focus :** Dans `app/components/ui/popover-primitive.tsx`, `InteractivePopoverRoot` utilise une référence `isFirstRender` pour garantir que `closePopover` ne focalise pas l'élément déclencheur lors du rendu/montage initial lorsque la popover est fermée, évitant ainsi une auto-focalisation inattendue au chargement de la page.
- **Transparence des événements pointeur :** Pour éviter une imbrication HTML invalide de balises d'ancrage (`<a>`) à l'intérieur de grands éléments parents cliquables (comme des diapositives de carte ou de carrousel), le conteneur de texte de superposition est structuré avec `pointer-events: none` et `pointer-events: auto` est appliqué aux éléments `<Anchor>` ou `<a>` imbriqués ciblés.

### Mécanismes avancés des composants

- **Composant Menu interactif (`app/islands/menu.tsx`) :** Gère les événements de défilement et de redimensionnement de la fenêtre en recalculant et repositionnant dynamiquement le conteneur du menu déroulant (via `updatePosition()`), garantissant qu'il reste ancré à son déclencheur. Il prend en charge un état ouvert contrôlé (`open` et `onOpenChange`), des placements mappés à partir de configurations classiques et en kebab-case avec détection de collision aux limites, et des actions de déclencheur personnalisables avec minuteurs d'entrée/sortie de survol.
- **API Menu simplifiée (`app/components/ui/menu.tsx`) :** Rend de manière récursive des sous-menus en cascade lorsqu'elle rencontre un élément de menu de type `"submenu"`, affichant une icône chevron et tirant parti de primitives `Menu` composées imbriquées. Elle expose `Menu.Arrow`, `Menu.ArrowTip` et `Menu.TriggerItem` comme sous-composants composés.
- **Vérifications des références de nœuds VDOM :** Pour vérifier correctement la référence de nœud VDOM d'un composant enfant (comme `MenuTriggerItem` dans `Trigger`) en Hono JSX, le code vérifie à la fois `child.tag` et `child.type` car les nœuds de fonction JSX classiques sont mappés sur `tag` plutôt que `type` sous la compilation JSX classique.
- **DatePicker :** Prend en charge des vues granulaires via la prop `picker` (`"date" | "month" | "year"`), mappant de manière transparente les tailles et variantes vers les configurations de token Panda CSS. Il prend en charge un style sémantique profondément personnalisable via les props `classNames` et `styles` sur des éléments internes spécifiques (par ex. label, control, input, positioner, clearTrigger).
- **Composant Tabs :** Entièrement porté vers Hono/JSX. Les primitives de mise en page SSR statiques sont définies dans `app/components/ui/tabs-primitive.tsx`, tandis que le wrapper d'îlot client interactif et actif `app/islands/tabs.tsx` gère l'état actif, le suivi de l'indicateur via un `ResizeObserver`, et les règles standard de navigation ARIA/clavier. Il mappe les propriétés de style Ant Design (`activeKey`, `defaultActiveKey`, `onChange`, `onTabClick`, tailles et types) vers les primitives sous-jacentes.
- **Composant Select :** Mappe dynamiquement les entrées de framework traditionnelles comme `size="small"`/`"medium"`/`"large"` et `variant="outlined"`/`"flushed"` vers les échelles standard Panda CSS (`sm`/`md`/`lg` et `outline`/`underlined`) avant de calculer les classes de slot, afin d'assurer une compatibilité trans-framework. Il a été affiné pour prendre en charge la recherche/filtrage côté client dans les listes déroulantes via la prop `showSearch`, ainsi que le rendu des éléments sélectionnés sous forme de Tags interactifs et fermables en mode sélection multiple (personnalisable via `tagRender`).
- **Composant PinField :** Implémenté avec une primitive SSR statique (`app/components/ui/pin-field-primitive.tsx`) et un îlot interactif (`app/islands/pin-field.tsx`). Il normalise `value` et `defaultValue` pour prendre en charge à la fois les types chaîne et tableau, définit `selectOnFocus` à `true` par défaut, prend en charge l'exécution de formulaire `autoSubmit`, assainit les caractères collés en supprimant les espaces et les traits d'union, et gère la navigation clavier RTL.
- **Système de mise en page en grille :** Fournit un conteneur flexbox 24 colonnes haute performance via les composants `Row` et `Col`, mappant les paramètres de points d'arrêt responsives (comme `xs`, `sm`, `md`, `lg`, `xl`, `xxl`) vers les points d'arrêt standard Panda CSS. Row mappe les gouttières statiques, basées sur tableau et responsives en sorties abrégées d'espacement Panda CSS (`cg` et `rg`), tandis que Col convertit les props responsives et les objets de points d'arrêt en classes de système de design correspondantes de manière dynamique.
- **Mise en page en grille aplatie :** Les composants de mise en page `Grid` et `GridItem` plats dans `app/components/ui/grid.tsx` sont basés sur les motifs de mise en page natifs de Panda CSS, prenant en charge le contrôle 2D via `columns` et `rows`. Ces motifs sont enregistrés dans `staticCss.patterns` de `panda.config.ts` (`grid` et `gridItem`) et liés de manière récursive dans `config.yml` de Sveltia CMS sous `pages` pour simplifier les mises en page multi-colonnes sans éléments Row/Col imbriqués. Les points d'arrêt responsives prennent en charge des objets responsives sérialisés en JSON (par ex. `"columns": "{\"base\": 1, \"md\": 3}"`).
- **Recettes de grille de mise en page :** Les recettes de grille de mise en page pour `row` et `col` sont compilées par programmation en variantes statiques et discrètes (portées, décalages, ordres 0 à 24) et enregistrées dans le CSS statique de `panda.config.ts` pour prendre en charge l'imbrication de mise en page de page statique dans Sveltia CMS et PageRenderer sans hydratation JavaScript dynamique.
- **Répertoire d'icônes SVG centralisé :** La base de code utilise des composants d'icônes SVG individuels et réutilisables situés dans `app/icons/*` (par ex. `CloseIcon`, `ChevronDownIcon`, `CheckIcon`, etc.) qui acceptent `JSX.IntrinsicElements["svg"]` pour transmettre des attributs comme `width`, `height` et des styles personnalisés. Les SVG en ligne codés en dur à travers les composants UI et les routes ont été refactorisés pour importer depuis ce répertoire d'icônes centralisé afin de promouvoir la réutilisation du code et d'éviter la duplication.

***

## Pipelines de contenu et i18n

Tout ce qui se trouve sous `content/` est découvert au moment du build via `import.meta.glob` de Vite et pré-rendu par SSG.

### Partitionnement des collections CMS

Le dépôt partitionne le contenu documentaire en deux collections CMS distinctes définies dans `public/admin/config.yml` :

- `"docs"` : Guides situés sous `/content/docs/` sous forme de fichiers `.md`.
- `"components"` : Références de composants situées sous `/content/components/` sous forme de fichiers `.mdx`.

Les liens de page d'édition d'administration Sveltia CMS sont construits au format `/admin/#/collections/[docs|components]/entries/[slug]`.

### Modèle de classification d'hydratation

Le dépôt utilise un modèle de classification d'hydratation à trois niveaux, configuré via le frontmatter Sveltia CMS et documenté dans [Hydration](/docs/Hydration) :

- **« Interactive avec empressement » (Niveau 1) :** S'hydrate par défaut avec empressement comme îlot client.
- **« Adaptive intelligente » (Niveau 2) :** S'hydrate conditionnellement selon les signaux comportementaux.
- **« Statique zéro-JS » (Niveau 3) :** Composants purement statiques sans hydratation JS.

### i18n et ajout d'une nouvelle locale de traduction

Sveltia CMS est configuré pour l'internationalisation (i18n) sous `public/admin/config.yml` en prenant en charge les locales `en`, `zh`, `es`, `pt`, `fr` et `de`, l'anglais (`en`) étant la locale par défaut. Il utilise la structure `multiple_folders` avec `omit_default_locale_from_file_path: true`, en conservant les fichiers de locale par défaut dans les chemins racine d'origine et en plaçant les traductions sous des sous-dossiers de locale (pour docs/components) ou en utilisant des suffixes `.<locale>` (pour configs et posts).

Pour ajouter une nouvelle locale de traduction au dépôt, suivez ce flux de travail étape par étape :

1. **Configuration CMS :** Ajoutez le code de locale (par ex. `fr` ou `de`) à la section `i18n.locales` de `public/admin/config.yml`.
2. **Clés de traduction :** Créez un fichier de configuration correspondant sous `content/configs.<locale>.json` avec les clés de traduction localisées.
3. **Enregistrement du sélecteur de langue :** Enregistrez le code de locale et son nom lisible par un humain dans `ALL_LOCALES` et `LOCALE_NAMES` à l'intérieur de `app/lib/i18n.ts`.
4. **Tableau du chargeur de docs :** Ajoutez le code de locale au tableau `LOCALES` à l'intérieur de `app/lib/docs.ts`.
5. **Réexportation de route :** Réexportez les routes standard en créant un répertoire `app/routes/<locale>/` correspondant à la structure des fichiers de route racine.
6. **Traductions :** Fournissez les traductions des docs markdown/MDX et des références de composants respectivement sous `content/docs/<locale>/*.md` et `content/components/<locale>/*.mdx`.

***

## Style

[PandaCSS](https://panda-css.com) génère tout le CSS à l'avance — il n'y a pas de moteur de style à l'exécution. `panda.config.ts` étend le thème de base depuis `app/theme/`, analyse `app/**/*.{js,jsx,ts,tsx}` pour l'usage des styles, et écrit le système généré (recettes, tokens, patterns, helpers JSX) dans `design-system/`, que les composants importent via l'alias Vite `design-system`.

### Conceptions de recettes à emplacements et composants multiparties

Les recettes de thème pour les composants multiparties (par ex. `RadioGroup`, `SegmentGroup`, `Tabs`, `ToggleGroup`, `Select`, `Avatar`, `Pagination`, `HoverCard`) doivent définir explicitement leurs `slots` comme un tableau de chaînes dans `defineSlotRecipe` plutôt que d'importer depuis `@ark-ui/react/anatomy` ou `@ark-ui/anatomy` afin d'éliminer les dépendances React dans la couche de style.

Les composants multiparties utilisant `defineSlotRecipe` doivent être enregistrés dans `slotRecipes` dans `app/theme/recipes/index.ts` et explicitement inclus dans `staticCss.recipes` dans `panda.config.ts` (par ex. `radioGroup: ['*']`, `select: ['*']`, `tabs: ['*']`) pour garantir que toutes les variantes comme `size` sont correctement générées pour les îlots Hono.

### Conflits de nommage de recettes personnalisées

Nommer une recette personnalisée `stack` entre en conflit avec les motifs de mise en page intégrés de Panda CSS, déclenchant un avertissement lors de `codegen`, bien que la recette reste fonctionnelle.

### Tokens de couleur vs tokens sémantiques

Dans le système de design PandaCSS du projet :

- **Tokens (`tokens.colors`) :** Les couleurs statiques pures (comme le noir et le blanc) sont définies comme valeurs brutes sous `app/theme/tokens/colors.ts`.
- **Tokens sémantiques (`semanticTokens.colors`) :** Les palettes d'échelles conditionnelles ou adaptatives (comme slate/gray, blue, red, etc.) sont déclarées ici pour permettre la compilation automatique des variables des modes clair et sombre.

### Directives d'utilisation explicite des tokens sémantiques

Dans la config Panda CSS et les styles personnalisés, **évitez d'utiliser des tokens de couleur génériques comme `bg` et `fg`** (qui compilent en CSS transparent/invalide). Utilisez plutôt des tokens sémantiques explicites comme `gray.surface.bg`, `fg.default` et `gray.outline.border` pour préserver les bons états de thème.
De plus, lors du style de superpositions contextuelles, de listes déroulantes ou de composants d'auto-complétion (comme `app/islands/search.tsx`), utilisez le token de fond sémantique `gray.surface.bg` pour garantir un fond opaque en modes clair/sombre et éviter le chevauchement de texte.

***

## CMS

[Sveltia CMS](https://sveltiacms.app) s'exécute entièrement côté client sur `/admin/`, configuré par `public/admin/config.yml`. `app/server.ts` sert les fichiers statiques de ce répertoire (config, HTML, assets) directement depuis `public/admin/` plutôt que via le routage normal, donc l'interface CMS fonctionne de manière identique en développement et une fois déployée. Elle est adossée à Git : les modifications apportées dans l'interface CMS sont validées directement dans les fichiers de contenu sous `content/`, que le prochain build récupère comme n'importe quel autre changement.

***

## Outils de développement et intégrité

### Commandes Node et Bun

Pour configurer l'environnement de développement, installer les dépendances et exécuter la génération de code PandaCSS :

```bash
bun install
```

Pour exécuter le serveur de développement local (Vite sur le port 5173 par défaut) :

```bash
bun run dev
```

Pour construire la sortie de site statique (`dist/`) :

```bash
bun run build
```

### Tests unitaires proactifs

Pour exécuter les tests unitaires de la base de code :

```bash
bun test unit
```

_Note : Exécutez toujours les tests unitaires avec `bun test unit` pour contourner les échecs de dépendances manquantes potentiels des tests d'intégration qui dépendent de paquets externes lourds comme `@playwright/test`._

### Biome Linter et qualité de code

Le dépôt utilise **Biome** pour le lint et le formatage du code. Pour garantir que `bun run check` et `bun run fix` s'exécutent avec succès avec un code de sortie 0, les règles restrictives et très bruyantes qui génèrent des faux positifs sur les attributs de composants dynamiques standard sont explicitement désactivées dans `biome.json`. Ces règles incluent :

- `useExportsLast`
- `useAriaPropsSupportedByRole`
- `noLabelWithoutControl`
- `useSemanticElements`
- `noNoninteractiveElementToInteractiveRole`

### Restriction des CLI orientées React

L'exécution de commandes CLI orientées React (comme `@park-ui/cli`) directement dans ce dépôt écrasera les implémentations Hono/JSX personnalisées et les recettes à emplacements par des modèles spécifiques à React, cassant le modèle SSG/îlots HonoX. Vérifiez toujours les fichiers existants de la base de code avant d'exécuter des scripts d'installation de composants externes.

***

## Déploiement

La sortie de build (`dist/`) est un site entièrement statique — aucun processus serveur n'est requis au moment de la requête. Deux cibles sont configurées prêtes à l'emploi :

- **Cloudflare Pages** (`wrangler.jsonc`) — `assets.directory` pointe vers `dist/` ; `bun run deploy` construit puis exécute `wrangler pages deploy ./dist`.
- **Vercel** (`vercel.json`) — même commande de build, `outputDirectory: "dist"`, `cleanUrls: true` (ainsi la réécriture clean-URL propre de Vercel complète les corrections d'index de répertoire de `fixSsgRoutingPlugin`).

`bun run preview` (`wrangler dev`) sert le `dist/` construit localement via le runtime local de Cloudflare, distinct de `bun run dev` (`vite`), qui exécute le serveur de développement HonoX en direct avec HMR.
