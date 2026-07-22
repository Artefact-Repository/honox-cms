---
title: Constructeur de pages CMS
---

## Introduction

Le générateur de pages dynamique basé sur [Sveltia CMS](https://sveltiacms.app/en/docs/intro) permet aux éditeurs non techniques de créer des pages complexes et imbriquées de manière récursive entièrement via l'interface utilisateur du CMS (`/admin/`).

Les mises en page sont enregistrées sous forme de fichiers JSON dans `content/pages/*.json` et sont compilées à la demande ou pré-générées statiquement (via Hono SSG) dans `/pages/[slug]`.

***

## Composants pris en charge

Le Page Builder prend en charge une riche palette de plus de 40 composants de mise en page, de typographie, décoratifs et interactifs.

### 1. Structure et mise en page

* **Pile** : regroupe les enfants verticalement ou horizontalement avec un alignement, une justification et un espacement contrôlables.* **Grille** : disposition de la grille CSS réactive – nombre de colonnes/lignes fixe ou ajustement automatique en fonction de la largeur minimale des enfants.* **Groupe** : aligne les éléments tels que les boutons étroitement ensemble (prend en charge les propriétés « attaché » et « grandir »).* **Fieldset** : organise les composants de formulaire associés sous un conteneur stylisé avec `legend`, `helperText` et `errorText`.* **AbsoluteCenter** : centre un seul bloc imbriqué dans son parent le long d'un ou des deux axes.* **Splitter** : panneaux redimensionnables séparés par des poignées de déplacement. Le rendu est toujours statique dans Page Builder (le contenu du panneau ne peut pas traverser la limite d'hydratation de l'île).* ** Fil d'Ariane ** : parcours de navigation des éléments liés avec un séparateur personnalisable.
### 2. Typographie et contenu

* **Titre** : en-têtes stylisés des niveaux « h1 » à « h6 » et différentes tailles de texte réactif.* **Texte** : texte au niveau du paragraphe avec des tailles réglables.
### 3. Affichage et présentation

* **Alerte** : affiche des alertes d'avertissement/succès/erreur/informations avec des statuts et des icônes standard.* **Badge** : étiquettes de métadonnées colorées avec palettes de couleurs et styles personnalisés.* **Carte** : un conteneur riche prenant en charge les blocs imbriqués, les en-têtes, les pieds de page et les positions d'image haut/bas/gauche/droite.* **Progrès** : affiche des indicateurs de progression linéaires ou circulaires.* **Squelette** : squelettes d'espace réservé hautement personnalisables (prend en charge les formes de texte en cercle et sur plusieurs lignes).* **Loader** / **Spinner** : indicateurs de chargement, avec texte d'accompagnement facultatif.* **Table** : données tabulaires statiques avec des colonnes configurables et un tableau de lignes codé JSON.* **Icône** : balisage SVG brut en ligne avec contrôles de taille/couleur.
### 4. Interactif et superpositions

* **Bouton** : cibles cliquables principales prenant en charge les palettes, tailles et variantes de style personnalisées.* **case à cocher** : cochez les cases pour la saisie booléenne avec des liaisons aria accessibles.* **Combobox** : listes déroulantes avec des listes d'actions et d'éléments claires.* **Réductible** : conteneurs de divulgation qui affichent/masquent les arborescences de composants imbriquées.* **Popover** : contenu descriptif flottant ancré à des déclencheurs de texte standard.* **Info-bulle** : texte d'astuce contextuel ancré à un bouton de déclenchement en survol/mise au point.* **HoverCard** : contenu déclenché par le survol plus riche qu'une info-bulle, avec un titre/description facultatif.* **Dialogue** : boîtes modales entièrement focalisées avec des boutons Confirmer/Annuler personnalisés et une liste d'enfants personnalisée.* **Tiroir** : panneaux latéraux réactifs coulissant depuis le bord de la page avec liste d'enfants personnalisée.* **Déroulant** (type de bloc « menu ») : menus d'action avec des options personnalisées vérifiables, sélectionnables et séparatrices.
### 5. Avancé et données

* **Sélection** : liste déroulante personnalisée à sélection unique/multiple, pouvant être soumise par formulaire.* **DatePicker** : sélection de dates simples/multiples/plage avec un calendrier contextuel.* **TagsField** : liste libre de balises de chaîne.* **RadioGroup** / **RadioCardGroup** : listes de radios personnalisées avec logique de sélection unique accessible.* **SegmentGroup** : contrôles segmentés coulissants pour la sélection par onglets.* **Curseur** : composants du curseur de plage.* **Commutateur** : interrupteurs à bascule.* **Modifiable** : texte en ligne à cliquer pour modifier.* **ColorPicker** : sélecteur de couleurs Saturation/Teinte/Alpha avec entrée hexadécimale/RGBA/HSLA.* **FileUpload** : sélection de fichiers par glisser-déposer ou par clic pour parcourir.* **Carrousel** : diaporama d'images à lecture automatique ou manuelle.* **PaginatedTable** : composants de table dynamique interactive avec prise en charge de la pagination.* **Pagination** : contrôleurs de page interactifs.
***

## Architecture

### 1. Définitions de schéma CMS (`public/admin/config.yml`)

Nous utilisons des **ancres et alias YAML** avancés (`&` et `*`) pour résoudre le défi de la récursivité infinie dans les spécifications YAML.

* Les **Ancres de base** (`button_fields`, `checkbox_fields`, etc.) sont déclarées une fois.* Les **Composants de niveau 1** définissent des éléments plats et un conteneur `Stack`/`Collapsible` qui prend en charge les **Composants de niveau 2** (`*l2_components`).* **Les composants de niveau 2** autorisent récursivement une autre couche de conteneurs imbriqués (`*l3_components`).* Cela permet aux éditeurs d'imbriquer des mises en page jusqu'à **4 niveaux de profondeur** sans dépasser les limites de l'analyseur YAML/CMS.
### 2. Rendu de mise en page (`app/components/page-renderer.tsx`)

Le moteur de mise en page importe tous les modules de composants publics depuis `app/components/ui/` et les mappe dans un compilateur JSX hautes performances et entièrement sécurisé.

* Les types d’entrée sont fortement intégrés dans des dictionnaires d’enregistrements « inconnus » standard pour empêcher la coercition de type et garder les contrôles de peluches Biome parfaitement propres.* Les conteneurs imbriqués sont gérés de manière récursive à l'aide d'appels imbriqués au composant `<PageRenderer content={...} />`.
***

## Pipelines de création de contenu

Les mises en page de Page Builder sont l'un des trois types de contenu sous « content/ », chacun découvert avec « import.meta.glob » de Vite et rendu par son propre itinéraire. Tous les trois sont générés de manière statique de la même manière : le middleware `ssgParams` d'une route énumère chaque fichier de sa collection au moment de la construction, et `bun run build` (via `@hono/vite-ssg`) explore ces paramètres pour pré-restituer un fichier HTML statique par slug dans `dist/`.

### 1. Mises en page JSON (`content/pages/*.json`)

* Chargé avec `import.meta.glob("/content/pages/*.json", { import: "default" })` dans `app/routes/pages/[slug].tsx`.* Chaque fichier est analysé comme du JSON simple — aucune démarque impliquée — et son tableau `content` est transmis directement à `<PageRenderer />` (voir Architecture ci-dessus), qui le compile de manière récursive dans les composants d'interface utilisateur correspondants.* Il s'agit du seul pipeline des trois sans étape d'analyse/compilation distincte : le JSON _est_ l'arbre de rendu.
### 2. Démarquage simple (`content/posts/*.md`, `content/docs/*.md`)

* Chargé avec `import.meta.glob(..., { query: "?raw", import: "default" })`, qui restitue la source de démarque brute sous forme de chaîne plutôt que de module compilé.* Analysé au moment de la requête/construction par `app/utils/markdown.ts`, un pipeline `remark`/`rehype` (`remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-stringify`) : `parseFrontmatter()` sépare le bloc frontmatter YAML du corps, et `markdownToHtml()` transforme le corps en un Chaîne HTML.* La chaîne résultante est injectée via `dangerouslySetInnerHTML` (voir `app/lib/posts.ts` et `app/lib/docs.ts`) — aucun JSX n'est impliqué, donc ce pipeline ne peut pas intégrer de composants actifs.* Les articles de blog exécutent également leur corps via `stripMarkdown()` pour créer une botte de foin de recherche en texte brut pour `/api/*/search.json`.
### 3. Documents MDX (`content/docs/*.mdx`)

* Compilé à l'avance par le plugin Vite `@mdx-js/rollup` (configuré dans `vite.config.ts`, limité à `.mdx` afin qu'il n'intercepte jamais les importations brutes `.md` ci-dessus), en utilisant `remark-frontmatter` + `remark-mdx-frontmatter` + `remark-gfm`.* Chaque fichier `.mdx` devient un véritable composant importable (plus une exportation `frontmatter` distincte), chargé dans `app/lib/docs.ts` via un simple (non `?raw`) `import.meta.glob`.* Étant donné que la sortie est un composant plutôt qu'une chaîne HTML, les documents `.mdx` peuvent intégrer des exemples interactifs réellement rendus (par exemple, une démo `<Button>` en direct) directement dans la prose — le compromis pour cela est l'étape de compilation au moment de la construction dont `.md` n'a pas besoin.
`app/lib/docs.ts` charge les collections `.md` et `.mdx` côte à côte et les fusionne en un seul sidenav, de sorte que le pipeline qu'un document donné utilise est un détail d'implémentation invisible pour les lecteurs - choisissez `.md` pour la prose simple et `.mdx` uniquement lorsqu'une page a besoin d'un composant actif intégré.

***

## Exemple de structure JSON

Voici un exemple de fichier de mise en page représentant une page de tableau de bord complexe (`content/pages/dashboard.json`) :

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
