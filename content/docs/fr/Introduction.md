---
title: Introduction
---

Ceci est un starter full-stack construit sur [**HonoX**](https://github.com/honojs/honox), associant un système de style typé à un CMS adossé à Git, le tout livré comme un site statique. Il se veut une base tout-en-un pour les sites orientés contenu —— documentation, blogs, pages marketing —— qui veulent malgré tout de vrais composants interactifs là où c'est utile.

| Élément | Rôle |
| --- | --- |
| [HonoX](https://honox.dev) | Méta-framework sur [Hono](https://hono.dev) —— routage basé sur les fichiers, îlots serveur/client |
| [PandaCSS](https://panda-css.com) | CSS-in-JS typé et sans runtime, compilé à l'avance |
| [Sveltia CMS](https://sveltiacms.app) | Édition de contenu adossée à Git sur `/admin/` —— pas de base de données, pas de service backend |
| [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) | Pré-rend chaque route en HTML statique au moment du build |

***

## Pourquoi cette stack

* **Statique par défaut.** Le résultat du build est du simple HTML/CSS/JS —— aucun processus serveur n'est requis au moment de la requête, donc le déploiement fonctionne partout où des fichiers statiques peuvent être servis (Cloudflare Pages et Vercel sont déjà configurés).
* **Interactif là où ça compte.** Tous les composants n'ont pas besoin d'envoyer du JavaScript. Un modèle d'[hydratation](/docs/fr/Hydration) à trois niveaux permet à chaque composant de décider s'il s'hydrate immédiatement, conditionnellement, ou jamais —— gardant le bundle client léger sans sacrifier une UI riche.
* **Contenu modifiable sans toucher au code.** [Sveltia CMS](https://sveltiacms.app) s'exécute entièrement côté client et commit directement dans les fichiers sous `content/`, si bien que les éditeurs peuvent rédiger des articles de blog, de la documentation, et même composer des pages entières visuellement via le [Constructeur de pages](/docs/fr/PageBuilder), pendant que les développeurs gardent tout sous contrôle de version.
* **Un style fiable.** [PandaCSS](https://panda-css.com) génère tout le CSS à l'avance à partir d'appels de style analysables statiquement —— pas de moteur de style en runtime, pas de collisions de noms de classe, et une sécurité de type complète sur les design tokens.

***

## Ce que contient le projet

* **Environ 50 composants d'UI** sous `app/components/ui/`, couvrant la mise en page, les formulaires, les overlays et l'affichage de données, chacun avec son îlot interactif correspondant dans `app/islands/` lorsque nécessaire.
* **Un blog** (`content/posts/`) avec des tags, des pages auteur et une API JSON en lecture seule.
* **Un constructeur de pages visuel** (`content/pages/`) pour composer des pages à partir de composants imbriqués, entièrement depuis le CMS.
* **De la documentation** (cette section), rédigée en Markdown pur ou en MDX, ce dernier pour les pages ayant besoin d'un exemple rendu en direct intégré dans le texte.
* **Le i18n** sur six langues (`en`, `zh`, `es`, `pt`, `fr`, `de`) pour la documentation, les composants et l'interface du site.

***

## Pour continuer

* [Bien démarrer](/docs/fr/Getting-Started) —— installer les dépendances et exécuter le projet en local.
* [Architecture](/docs/fr/Architecture) —— un aperçu plus approfondi du build, du routage, de la structure des composants et des pipelines de contenu.
* [Hydratation](/docs/fr/Hydration) —— comment les composants activent l'interactivité côté client.
* [Constructeur de pages CMS](/docs/fr/PageBuilder) —— composition visuelle de pages via Sveltia CMS.
