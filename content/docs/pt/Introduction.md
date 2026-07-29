---
title: Introdução
---

Este é um starter full-stack construído sobre o [**HonoX**](https://github.com/honojs/honox), combinando um sistema de estilos tipado com um CMS respaldado por Git, e entregando tudo isso como um site estático. Foi pensado como uma base completa para sites orientados a conteúdo —— documentação, blogs, páginas de marketing —— que ainda assim querem componentes realmente interativos onde importa.

| Peça | O que faz |
| --- | --- |
| [HonoX](https://honox.dev) | Meta-framework sobre o [Hono](https://hono.dev) —— roteamento baseado em arquivos, ilhas servidor/cliente |
| [PandaCSS](https://panda-css.com) | CSS-in-JS tipado e sem runtime, compilado antecipadamente |
| [Sveltia CMS](https://sveltiacms.app) | Edição de conteúdo respaldada por Git em `/admin/` —— sem banco de dados, sem serviço de backend |
| [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) | Pré-renderiza cada rota como HTML estático em tempo de build |

---

## Por que essa stack

A maioria das bibliotecas de componentes de UI é construída para um framework JavaScript específico —— um peso no momento em que você precisa misturar frameworks ou trocar depois. [HonoX](https://honox.dev) contorna isso como um **meta-framework**: ele permite que você _traga o seu próprio framework_ (BYOF), de modo que nossos componentes permanecem _agnósticos a frameworks_, resolvidos inteiramente em tempo de build em vez de ficarem atrelados a uma runtime do cliente. Somado ao [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg), isso também nos dá:

* **Estático e sem framework por padrão.** O resultado do build é HTML/CSS/JS puro —— nenhum processo de servidor é necessário em tempo de requisição, então ele pode ser implantado em qualquer lugar que sirva arquivos estáticos (Cloudflare Pages e Vercel já vêm configurados).
* **Interativo onde importa.** Nem todo componente precisa enviar JavaScript. Um modelo de [hidratação](/docs/pt/Hydration) de três camadas permite que cada componente decida se hidrata de forma antecipada, condicional, ou nunca —— mantendo o bundle do cliente pequeno sem abrir mão de uma UI rica.

Esses componentes de UI começaram como um port de [Park UI](https://park-ui.com/) ([Ark UI](https://ark-ui.com/)) do React para Hono/jsx. Para cada um, construímos bindings correspondentes para o [Sveltia CMS](https://sveltiacms.app), um CMS respaldado por Git, de modo que o conteúdo permanece facilmente editável por meio de uma interface de administração web sem precisar tocar em código. Isso também torna o código de UI mais limpo e orientado a dados. O CMS é local-first, roda inteiramente no cliente e faz commit diretamente nos arquivos sob `content/`, de modo que os editores podem escrever posts de blog, documentação, e até compor páginas inteiras visualmente através do [Construtor de Páginas](/docs/pt/PageBuilder), enquanto os desenvolvedores mantêm tudo sob controle de versão.

[PandaCSS](https://panda-css.com) é usado para gerar todo o CSS antecipadamente a partir de chamadas de estilo estaticamente analisáveis —— sem motor de estilos em runtime, sem colisões de nomes de classe, e com segurança total de tipos nos design tokens.

---

## O que tem por dentro

* **Cerca de 60 componentes de UI** em `app/components/ui/`, cobrindo layout, formulários, overlays e exibição de dados, cada um com uma ilha interativa correspondente em `app/islands/` quando necessário.
* **Um blog** (`content/posts/`) com tags, páginas de autor e uma API JSON somente leitura.
* **Um construtor de páginas visual** (`content/pages/`) para compor páginas a partir de componentes aninhados inteiramente pelo CMS.
* **Documentação** (esta seção), escrita em Markdown puro ou MDX, este último para páginas que precisam de um exemplo renderizado ao vivo embutido no texto.
* **i18n** em seis idiomas (`en`, `zh`, `es`, `pt`, `fr`, `de`) para documentação, componentes e a interface do site.

---

## Por onde seguir

* [Primeiros Passos](/docs/pt/Getting-Started) —— instale as dependências e execute o projeto localmente.
* [Arquitetura](/docs/pt/Architecture) —— um olhar mais profundo sobre o build, o roteamento, a estrutura de componentes e os pipelines de conteúdo.
* [Hidratação](/docs/pt/Hydration) —— como os componentes optam pela interatividade do lado do cliente.
* [Construtor de Páginas CMS](/docs/pt/PageBuilder) —— composição visual de páginas através do Sveltia CMS.
