---
title: Arquitetura
---

Este projeto é construído sobre [**HonoX**](https://github.com/honojs/honox), um meta-framework sobre [Hono](https://hono.dev) que adiciona roteamento baseado em arquivos, ilhas (islands) servidor/cliente e geração de sites estáticos. O estilo é gerenciado por [PandaCSS](https://panda-css.com) (CSS-in-JS tipado, sem runtime em tempo de execução), o conteúdo é redigido via [Sveltia CMS](https://sveltiacms.app) (`/admin/`), e todo o site é pré-renderizado para HTML estático.

| Camada | Ferramenta |
| --- | --- |
| Framework | [HonoX](https://honox.dev) |
| Roteamento | Baseado em arquivos, sob `app/routes/` |
| Estilo | [PandaCSS](https://panda-css.com) → `design-system/` |
| Conteúdo | Markdown / MDX / JSON sob `content/` |
| CMS | [Sveltia CMS](https://sveltiacms.app), apoiado por Git, em `/admin/` |
| SSG | [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) |
| Implantação | Cloudflare Pages (`wrangler.jsonc`) ou Vercel (`vercel.json`) |

***

## O build: duas passadas do Vite, um site estático

`bun run build` executa `vite build --mode client && vite build` — duas passadas separadas sobre o mesmo `vite.config.ts`, alternadas por `mode`:

- **`--mode client`** compila `app/client.ts` (`createClient()` de `honox/client`) com `jsxImportSource: "hono/jsx/dom"`. Este é o bundle do navegador: hidrata as ilhas e nada mais.
- **A passada padrão (servidor)** compila `app/server.ts` (`createApp()` de `honox/server`) com `jsxImportSource: "hono/jsx"` (o runtime JSX de SSR), e então entrega toda a aplicação ao plugin [`ssg()`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg), que rastreia cada rota e escreve o HTML pré-renderizado em `dist/`.

### Roteamento SSG e correções de URL localizadas

Para evitar erros de roteamento 404 em hospedagens de arquivos estáticos após a compilação das rotas, um `fixSsgRoutingPlugin` personalizado em `vite.config.ts` processa recursivamente todos os arquivos `.html` da saída de compilação (`dist/`). Ele renomeia e move os arquivos de índice/página inicial localizados (p. ex. `zh.html`, `docs/fr.html`) para caminhos limpos aninhados (`zh/index.html`, `docs/fr/index.html`) se existir um diretório correspondente ou se o nome corresponder a uma locale suportada. Isso garante que `/zh` e outros endpoints localizados se resolvam corretamente como índices de diretório em qualquer hospedagem estática.

### Resolução do ambiente de teste

Para executar testes unitários de componentes Hono JSX no Bun, `bunfig.toml` é configurado especificamente com:

```toml
[jsx]
runtime = "classic"
pragma = "h"
fragment = "Fragment"
importSource = "hono/jsx"
```

Isso garante uma resolução padrão do runtime do Hono e evita erros de runtime JSX de desenvolvimento ausente durante a execução dos testes.

O plugin `mdx()` é restrito a `include: /\.mdx$/` apenas — o `.md` simples (postagens de blog, a maioria dos docs) é deliberadamente deixado de fora para que os imports `?raw` de `app/utils/markdown.ts` não sejam corrompidos pela transformação MDX.

***

## Roteamento baseado em arquivos

As rotas ficam sob `app/routes/`, registradas em `app/server.ts` via `import.meta.glob` sobre `**/*.{ts,tsx,md,mdx}`, excluindo as convenções de arquivos privados do HonoX (`_*`, `-*`, `$*`) e os arquivos de teste. Um arquivo de rota exporta handlers (`GET`, `POST`, …) ou um componente padrão; `[slug].tsx` / `[[slug]].tsx` fornecem segmentos dinâmicos/opcionais, conforme as próprias convenções de roteamento do HonoX.

### Rotas de API estáticas personalizadas

No HonoX, as rotas de API estáticas personalizadas (p. ex. `app/routes/api/posts.json.ts`) que exportam uma rota padrão retornando `c.json(...)` são compiladas automaticamente em arquivos JSON estáticos (p. ex. `dist/api/posts.json`) pelo plugin `@hono/vite-ssg` durante o build SSG. Nenhuma configuração de parâmetro dinâmico é necessária para esses endpoints estáticos.

### Pré-renderização de rotas dinâmicas via ssgParams

Qualquer rota dinâmica (como `/blog/by-author/[author].tsx`) deve implementar e exportar o middleware `ssgParams` na definição da rota para declarar todos os valores de parâmetros potenciais para a pré-renderização em tempo de build.

### Roteamento localizado e redirecionamentos legados

As rotas das coleções traduzíveis (`docs`, `blog`, `pages`) seguem `/<collection>/<locale?>/<item>`, sem que a locale padrão (`en`) ocupe um segmento:

```plain
/docs/AbsoluteCenter        (en)
/docs/fr/AbsoluteCenter     (fr)
/blog/my-post               (en)
/blog/zh/my-post            (zh)
```

As **páginas iniciais de idioma** independentes de locale ficam no segmento de locale nu (`/fr`, `/zh`, …). Tudo isso é centralizado em `app/lib/i18n.ts` (`detectLocale`, `localiseHref`, `stripLocale`, `localeToggleUrl`) — nenhum arquivo de rota implementa manualmente a lógica de locale. Uma forma de rota legada, `/<locale>/<collection>/<item>`, é redirecionada com 301 para a forma atual por um middleware em `app/server.ts`, de modo que favoritos/links antigos continuem funcionando.

As locales suportadas são declaradas uma única vez, em `ALL_LOCALES` / `TRANSLATED_LOCALES` (`app/lib/i18n.ts`) — esta lista deve permanecer sincronizada com `i18n.locales` de `public/admin/config.yml` e os diretórios de rotas espelhadas `app/routes/<locale>/`.

***

## Arquitetura de componentes

A base de código mantém duas árvores paralelas sob `app/`:

- **`app/components/ui/`** — a API de componentes pública (~100 componentes).
- **`app/islands/`** — as contrapartes hidratadas no cliente, uma por componente interativo, integradas no bundle do cliente e montadas por `honox/client`.

### Segurança de servidor sem hooks

Para garantir a geração de site estático sem problemas, **todos os hooks reativos do lado do cliente (`useEffect`, `useRef`, `useState` de `hono/jsx`) são estritamente restritos ao diretório `/islands/`**. Os arquivos sob o diretório `/components/ui/` permanecem totalmente livres de hooks e seguros para renderização estática/SSR do servidor. Os wrappers estáticos (como `Dialog` e `Drawer` em `components/ui/`) que encaminham referências usam um objeto plano estático de fallback (`{ current: null }`) em vez de `useRef` para evitar a execução de hooks do cliente no servidor.

### Resolução segura de estilos entre ilhas

Componentes multiparte como `HoverCard` que renderizam filhos através das fronteiras de ilha do HonoX devem implementar uma resolução de estilo de fallback segura (p. ex. `context?.styles || recipe()`) em seus subcomponentes primitivos para garantir que os nomes de classe sejam totalmente preenchidos tanto nos estados SSR/SSG pré-renderizados quanto nos estados do cliente hidratado.

### Posicionamento de sobreposições e truques de interação

- **Posicionamento correto:** Os wrappers raiz dos componentes `Popover` e `HoverCard` usam os estilos inline `position: 'relative'` e `display: 'inline-block'` (tanto nas implementações estáticas quanto nas interativas/de ilha). Isso evita que ocupem espaço em linha em nível de bloco e posiciona corretamente seu conteúdo sobreposto absoluto em relação ao gatilho.
- **Gerenciamento de foco:** Em `app/components/ui/popover-primitive.tsx`, `InteractivePopoverRoot` usa uma referência `isFirstRender` para garantir que `closePopover` não foca o elemento gatilho na renderização/montagem inicial quando o popover está fechado, evitando assim um auto-foco inesperado ao carregar a página.
- **Eventos de ponteiro transparentes:** Para evitar um aninhamento HTML inválido de tags de âncora (`<a>`) dentro de grandes elementos pais clicáveis (como slides de card ou carrossel), o contêiner de texto da sobreposição é estruturado com `pointer-events: none` e `pointer-events: auto` é aplicado aos elementos `<Anchor>` ou `<a>` aninhados alvo.

### Mecanismos avançados de componentes

- **Componente Menu interativo (`app/islands/menu.tsx`):** Lida com eventos de rolagem e redimensionamento de janela recalculando e reposicionando dinamicamente o contêiner do menu suspenso (via `updatePosition()`), garantindo que permaneça ancorado ao seu gatilho. Suporta um estado aberto controlado (`open` e `onOpenChange`), posicionamentos mapeados de configurações clássicas e em kebab-case com detecção de colisão em limites, e ações de gatilho personalizáveis com temporizadores de entrada/saída de hover.
- **API de Menu simplificada (`app/components/ui/menu.tsx`):** Renderiza recursivamente submenus em cascata ao encontrar um item de menu do tipo `"submenu"`, exibindo um ícone chevron e aproveitando primitivas `Menu` compostas aninhadas. Expõe `Menu.Arrow`, `Menu.ArrowTip` e `Menu.TriggerItem` como subcomponentes compostos.
- **Verificações de referências de nós VDOM:** Para verificar corretamente a referência de nó VDOM de um componente filho (como `MenuTriggerItem` dentro de `Trigger`) no Hono JSX, o código verifica tanto `child.tag` quanto `child.type`, pois nós de função JSX clássicos são mapeados para `tag` em vez de `type` sob a compilação JSX clássica.
- **DatePicker:** Suporta visualizações granulares via a prop `picker` (`"date" | "month" | "year"`), mapeando transparentemente tamanhos e variantes para as configurações de token do Panda CSS. Suporta um estilo semântico profundamente personalizável via as props `classNames` e `styles` em elementos internos específicos (p. ex. label, control, input, positioner, clearTrigger).
- **Componente Tabs:** Portado integralmente para Hono/JSX. As primitivas de layout SSR estáticas são definidas em `app/components/ui/tabs-primitive.tsx`, enquanto o wrapper de ilha do cliente interativo e diligente `app/islands/tabs.tsx` gerencia o estado ativo, o rastreamento do indicador via um `ResizeObserver` e as regras padrão de navegação ARIA/teclado. Mapeia as propriedades de estilo do Ant Design (`activeKey`, `defaultActiveKey`, `onChange`, `onTabClick`, tamanhos e tipos) para as primitivas subjacentes.
- **Componente Select:** Mapeia dinamicamente as entradas de framework tradicionais como `size="small"`/`"medium"`/`"large"` e `variant="outlined"`/`"flushed"` para as escalas padrão do Panda CSS (`sm`/`md`/`lg` e `outline`/`underlined`) antes de calcular as classes de slot, para assegurar compatibilidade entre frameworks. Foi refinado para suportar a busca/filtragem no lado do cliente em listas suspensas via a prop `showSearch`, bem como renderizar os itens selecionados como Tags interativas e dispensáveis no modo de seleção múltipla (personalizável via `tagRender`).
- **Componente PinField:** Implementado com uma primitiva SSR estática (`app/components/ui/pin-field-primitive.tsx`) e uma ilha interativa (`app/islands/pin-field.tsx`). Normaliza `value` e `defaultValue` para suportar tanto tipos string quanto array, define `selectOnFocus` como `true` por padrão, suporta a execução de formulário `autoSubmit`, sanitiza caracteres colados removendo espaços e hífens, e lida com a navegação de teclado RTL.
- **Sistema de layout em grade:** Fornece um contêiner flexbox de 24 colunas de alto desempenho via os componentes `Row` e `Col`, mapeando as configurações de pontos de interrupção responsivos (como `xs`, `sm`, `md`, `lg`, `xl`, `xxl`) para os pontos de interrupção padrão do Panda CSS. Row mapeia as gutters estáticas, baseadas em array e responsivas para saídas abreviadas de espaçamento do Panda CSS (`cg` e `rg`), enquanto Col converte props responsivas e objetos de pontos de interrupção em classes de sistema de design correspondentes dinamicamente.
- **Layout em grade achatado:** Os componentes de layout `Grid` e `GridItem` planos em `app/components/ui/grid.tsx` são baseados nos padrões de layout nativos do Panda CSS, suportando controle 2D via `columns` e `rows`. Esses padrões são registrados em `staticCss.patterns` de `panda.config.ts` (`grid` e `gridItem`) e vinculados recursivamente no `config.yml` do Sveltia CMS sob `pages` para simplificar layouts multicoluna sem elementos Row/Col aninhados. Os pontos de interrupção responsivos suportam objetos responsivos serializados em JSON (p. ex. `"columns": "{\"base\": 1, \"md\": 3}"`).
- **Receitas de grade de layout:** As receitas de grade de layout para `row` e `col` são compiladas programaticamente em variantes estáticas e discretas (spans, offsets, ordens 0 a 24) e registradas no CSS estático de `panda.config.ts` para suportar o aninhamento de layout de página estática no Sveltia CMS e PageRenderer sem hidratação de JavaScript dinâmica.
- **Diretório de ícones SVG centralizado:** A base de código usa componentes de ícone SVG individuais e reutilizáveis localizados em `app/icons/*` (p. ex. `CloseIcon`, `ChevronDownIcon`, `CheckIcon`, etc.) que aceitam `JSX.IntrinsicElements["svg"]` para encaminhar atributos como `width`, `height` e estilos personalizados. Os SVGs inline codificados em hardcode nos componentes de UI e rotas foram refatorados para importar desse diretório de ícones centralizado para promover a reutilização de código e evitar duplicação.

***

## Pipelines de conteúdo e i18n

Tudo o que está sob `content/` é descoberto em tempo de build via `import.meta.glob` do Vite e pré-renderizado por SSG.

### Particionamento de coleções CMS

O repositório particiona o conteúdo documental em duas coleções CMS distintas definidas em `public/admin/config.yml`:

- `"docs"`: Guias localizados sob `/content/docs/` como arquivos `.md`.
- `"components"`: Referências de componentes localizadas sob `/content/components/` como arquivos `.mdx`.

Os links de página de edição de administração do Sveltia CMS são construídos no formato `/admin/#/collections/[docs|components]/entries/[slug]`.

### Modelo de classificação de hidratação

O repositório usa um modelo de classificação de hidratação de três níveis, configurado via frontmatter do Sveltia CMS e documentado em [Hydration](/docs/Hydration):

- **"Interativo imediato" (Nível 1):** Hidrata imediatamente, por padrão, como uma ilha do cliente.
- **"Adaptativo inteligente" (Nível 2):** Hidrata condicionalmente com base em sinais comportamentais.
- **"Estático sem JS" (Nível 3):** Componentes puramente estáticos sem hidratação JS.

### i18n e adição de uma nova locale de tradução

O Sveltia CMS está configurado para internacionalização (i18n) em `public/admin/config.yml` suportando as locales `en`, `zh`, `es`, `pt`, `fr` e `de`, com o inglês (`en`) como locale padrão. Ele usa a estrutura `multiple_folders` com `omit_default_locale_from_file_path: true`, mantendo os arquivos de locale padrão nos caminhos raiz originais e colocando as traduções sob subpastas de locale (para docs/components) ou usando sufixos `.<locale>` (para configs e posts).

Para adicionar uma nova locale de tradução ao repositório, siga este fluxo de trabalho passo a passo:

1. **Configuração CMS:** Adicione o código da locale (p. ex. `fr` ou `de`) à seção `i18n.locales` de `public/admin/config.yml`.
2. **Chaves de tradução:** Crie um arquivo de configuração correspondente sob `content/configs.<locale>.json` com as chaves de tradução localizadas.
3. **Registro do seletor de idioma:** Registre o código da locale e seu nome legível por humanos em `ALL_LOCALES` e `LOCALE_NAMES` dentro de `app/components/language-switcher.tsx`.
4. **Array do carregador de docs:** Adicione o código da locale ao array `LOCALES` dentro de `app/lib/docs.ts`.
5. **Reexportação de rota:** Reexporte as rotas padrão criando um diretório `app/routes/<locale>/` que corresponda à estrutura dos arquivos de rota raiz.
6. **Traduções:** Forneça as traduções dos docs markdown/MDX e das referências de componentes respectivamente sob `content/docs/<locale>/*.md` e `content/components/<locale>/*.mdx`.

***

## Estilo

[PandaCSS](https://panda-css.com) gera todo o CSS antecipadamente — não há motor de estilo em tempo de execução. `panda.config.ts` estende o tema base de `app/theme/`, varre `app/**/*.{js,jsx,ts,tsx}` para o uso de estilos, e escreve o sistema gerado (receitas, tokens, padrões, helpers JSX) em `design-system/`, que os componentes importam via o alias Vite `design-system`.

### Designs de receita de slot e componentes multiparte

As receitas de tema para componentes multiparte (p. ex. `RadioGroup`, `SegmentGroup`, `Tabs`, `ToggleGroup`, `Select`, `Avatar`, `Pagination`, `HoverCard`) devem definir explicitamente seus `slots` como um array de strings dentro de `defineSlotRecipe` em vez de importar de `@ark-ui/react/anatomy` ou `@ark-ui/anatomy` para eliminar as dependências de React na camada de estilo.

Os componentes multiparte que usam `defineSlotRecipe` devem ser registrados em `slotRecipes` em `app/theme/recipes/index.ts` e explicitamente incluídos em `staticCss.recipes` dentro de `panda.config.ts` (p. ex. `radioGroup: ['*']`, `select: ['*']`, `tabs: ['*']`) para garantir que todas as variantes como `size` sejam geradas corretamente para as ilhas Hono.

### Conflitos de nomenclatura de receitas personalizadas

Nomear uma receita personalizada `stack` entra em conflito com os padrões de layout integrados do Panda CSS, disparando um aviso durante o `codegen`, embora a receita permaneça funcional.

### Tokens de cor vs tokens semânticos

No sistema de design PandaCSS do projeto:

- **Tokens (`tokens.colors`):** Cores estáticas puras (como preto e branco) são definidas como valores brutos sob `app/theme/tokens/colors.ts`.
- **Tokens semânticos (`semanticTokens.colors`):** Paletas de escalas condicionais ou adaptativas (como slate/gray, blue, red, etc.) são declaradas aqui para habilitar a compilação automática de variáveis dos modos claro e escuro.

### Diretrizes de uso explícito de tokens semânticos

Na config do Panda CSS e estilos personalizados, **evite usar tokens de cor genéricos como `bg` e `fg`** (que compilam para CSS transparente/inválido). Em vez disso, use tokens semânticos explícitos como `gray.surface.bg`, `fg.default` e `gray.outline.border` para preservar os estados de tema adequados.
Além disso, ao estilizar sobreposições pop-up, listas suspensas ou componentes de autocompletar (como `app/islands/search.tsx`), use o token de fundo semântico `gray.surface.bg` para garantir um fundo sólido nos modos claro/escuro e evitar a sobreposição de texto.

***

## CMS

[Sveltia CMS](https://sveltiacms.app) é executado inteiramente no cliente em `/admin/`, configurado por `public/admin/config.yml`. `app/server.ts` serve os arquivos estáticos desse diretório (config, HTML, assets) diretamente de `public/admin/` em vez de pelo roteamento normal, então a UI do CMS funciona de forma idêntica em desenvolvimento e após a implantação. Ele é apoiado por Git: as edições feitas na UI do CMS são confirmadas diretamente nos arquivos de conteúdo sob `content/`, que o próximo build coleta como qualquer outra alteração.

***

## Ferramentas de desenvolvimento e integridade

### Comandos Node e Bun

Para configurar o ambiente de desenvolvimento, instalar dependências e executar a geração de código do PandaCSS:

```bash
bun install
```

Para executar o servidor de desenvolvimento local (Vite na porta 5173 por padrão):

```bash
bun run dev
```

Para construir a saída do site estático (`dist/`):

```bash
bun run build
```

### Testes unitários proativos

Para executar os testes unitários da base de código:

```bash
bun test unit
```

_Observação: Execute sempre os testes unitários com `bun test unit` para contornar possíveis falhas de dependências ausentes dos testes de integração que dependem de pacotes externos pesados como `@playwright/test`._

### Biome Linter e qualidade de código

O repositório utiliza **Biome** para lint e formatação de código. Para garantir que `bun run check` e `bun run fix` sejam executados com sucesso com código de saída 0, as regras restritivas e muito ruidosas que geram falsos positivos em atributos de componentes dinâmicos padrão são explicitamente desativadas em `biome.json`. Essas regras incluem:

- `useExportsLast`
- `useAriaPropsSupportedByRole`
- `noLabelWithoutControl`
- `useSemanticElements`
- `noNoninteractiveElementToInteractiveRole`

### Restrição de CLIs orientadas a React

Executar comandos CLI orientados a React (como `@park-ui/cli`) diretamente neste repositório sobrescreverá as implementações Hono/JSX personalizadas e as receitas de slot por modelos específicos de React, quebrando o modelo SSG/ilha do HonoX. Sempre verifique os arquivos existentes da base de código antes de executar scripts externos de instalação de componentes.

***

## Implantação

A saída de build (`dist/`) é um site totalmente estático — nenhum processo de servidor é necessário no momento da solicitação. Dois destinos são configurados prontos para uso:

- **Cloudflare Pages** (`wrangler.jsonc`) — `assets.directory` aponta para `dist/`; `bun run deploy` constrói e então executa `wrangler pages deploy ./dist`.
- **Vercel** (`vercel.json`) — o mesmo comando de build, `outputDirectory: "dist"`, `cleanUrls: true` (de modo que a reescritura clean-URL própria da Vercel complementa as correções de índice de diretório do `fixSsgRoutingPlugin`).

`bun run preview` (`wrangler dev`) serve o `dist/` construído localmente através do runtime local da Cloudflare, distinto de `bun run dev` (`vite`), que executa o servidor de desenvolvimento HonoX ao vivo com HMR.
