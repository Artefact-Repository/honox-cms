---
title: Estilo e Temas
---

Este projeto estiliza cada componente com [PandaCSS](https://panda-css.com) (CSS-in-JS tipado, sem runtime em tempo de execução) sobre o `hono/jsx` puro — **não** um dos frameworks JSX oficialmente suportados pelo Panda (React/Vue/Solid/Qwik). Esse único fato — `jsxFramework: undefined` em `panda.config.ts` — é a causa raiz de quase toda regressão de estilo que este projeto já sofreu, porque exclui silenciosamente a base de código de várias coisas que o Panda normalmente faz por você. Esta página documenta a arquitetura resultante, os bugs concretos que ela já causou, e a checklist a seguir para que não se repitam.

---

## Como os estilos vão de uma receita até a página

1. **Receitas** são escritas em `app/theme/recipes/*.ts` com `defineRecipe` do Panda (classe única, p. ex. `badge.ts`) ou `defineSlotRecipe` (componentes multiparte com slots nomeados, p. ex. `switch.ts` — `root`/`control`/`thumb`/…).
2. Toda receita é registrada por chave de objeto em `app/theme/recipes/index.ts`, sob `recipes` (plana) ou `slotRecipes` (com slots). **A chave de registro é o que tudo mais usa para referenciá-la** — não o `className` da receita, e não o nome do arquivo. `switch.ts` exporta `switchRecipe` (`switch` é uma palavra reservada) e é registrado como `switchRecipe: switchRecipe`; `panda.config.ts` e qualquer código que referencie a receita deve usar `switchRecipe`, nunca `switch`.
3. `panda.config.ts` estende a config combinada de `app/theme/` (`theme: { extend: { ...theme.config } }`) e varre `include: ["./app/**/*.{js,jsx,ts,tsx}"]` em busca de uso de estilos.
4. O Panda escreve o sistema gerado — funções auxiliares de receita, tokens, patterns, o runtime `css`/`cx` — em `design-system/`, importado via o alias Vite `design-system` (`vite.config.ts`). **`design-system/` está no gitignore** — é um artefato de build, regenerado do zero a cada instalação/build via PostCSS (`postcss.config.cjs` conecta `@pandacss/dev/postcss`) e o script `prepare` (`panda codegen`, executado uma vez em `bun install`). Somente os arquivos *fonte* — `app/theme/recipes/*.ts`, `panda.config.ts` — são de fato distribuídos; nada que você fizer diretamente em `design-system/` é jamais commitado.

### `codegen` vs `cssgen` — muitas vezes você precisa dos dois, manualmente

| Comando | Regenera | Necessário após |
| --- | --- | --- |
| `bunx panda codegen` | `design-system/recipes/*.mjs` + `.d.ts` — as funções auxiliares de receita (`switchRecipe()`, `.splitVariantProps()`, `.variantKeys`, `.variantMap`) que o código da aplicação chama em tempo de execução | Adicionar/remover/renomear uma **variante** em qualquer receita |
| `bunx panda cssgen` | `design-system/styles.css` — as regras CSS geradas de fato | Adicionar/remover um **valor de variante**, ou alterar `staticCss` |

A integração PostCSS do `vite dev` re-extrai o CSS dinamicamente conforme você edita, mas ela **não** regenera os arquivos auxiliares de receita `.mjs`/`.d.ts` — esses são arquivos gerados comuns que seu código importa diretamente (`import { switchRecipe } from "design-system/recipes"`), não um módulo virtual transformado pelo Vite. Se você adicionar uma prop `colorPalette` às `variants` de uma receita e apenas salvar o arquivo, `switchRecipe.splitVariantProps()` continua usando a lista **desatualizada** de `variantKeys` até você rodar `panda codegen` — então a nova prop é silenciosamente roteada para "props locais" em vez de "props de variante", e ou vaza para o DOM como um atributo inválido, ou nunca chega à função de estilo. **Execute os dois comandos manualmente após editar qualquer arquivo de receita**, não presuma que o servidor de dev já captou a mudança.

---

## `staticCss`: por que quase toda receita é forçada a `["*"]`

A análise estática do Panda só consegue pré-gerar CSS para valores que consegue ver literalmente no código-fonte (`<Badge size="sm">`) — ou, para integrações com frameworks JSX, via o mapeamento `jsx: [...]` de cada receita (`button.ts` e algumas outras usam isso). Os componentes desta base de código são chamados como `recipeName(variantProps)` dentro de arquivos primitivos, sempre com um **objeto computado em tempo de execução** (`switchRecipe.splitVariantProps(props)`), e a maior parte do conteúdo é JSON escrito via CMS (`content/pages/*.json`) com valores de cor/tamanho/variante que não existem em nenhum lugar como literal de string no código-fonte `.tsx`. O extrator do Panda não consegue enxergar nada disso, então **toda receita sem um mapeamento `jsx` precisa ser forçada a gerar todas as suas combinações de variante** via `staticCss.recipes: { <recipeKey>: ["*"] }` em `panda.config.ts` — usando a *chave de registro* de `app/theme/recipes/index.ts`, não o `className` da receita.

Foi exatamente assim que o bug do tamanho do switch (abaixo) aconteceu, e é um risco sistêmico: **qualquer erro de digitação entre a chave em `staticCss.recipes` e o nome real de exportação/registro da receita zera silenciosamente a geração de qualquer variante não padrão dessa receita**, sem nenhum erro, aviso ou falha de tipo em lugar algum — o Panda simplesmente emite base + CSS da variante padrão e mais nada. Se você adicionar uma receita nova, lembre-se de adicionar sua entrada de chave de registro em `staticCss.recipes` imediatamente, e confira duas vezes que a chave corresponde exatamente a `app/theme/recipes/index.ts` (dê um `grep` pela chave em ambos os arquivos se tiver dúvida).

---

## Regressões conhecidas e as regras que as previnem

### 1. A chave de `staticCss.recipes` deve corresponder ao nome de registro da receita, não ao seu `className`

**Sintoma:** todo valor de variante não padrão (p. ex. `size="sm"`/`"lg"` em `<Switch>`) renderiza com as custom properties CSS simplesmente não definidas — um elemento colapsado, invisível, de 0×0, ou completamente sem estilo — enquanto a variante padrão parece normal.

**Causa:** `switch.ts` exporta `switchRecipe` (registrada sob essa chave em `slotRecipes`), mas o `staticCss.recipes` de `panda.config.ts` tinha `switch: ["*"]` — uma chave que não corresponde a nada. Só o CSS de base + `defaultVariants` é distribuído (o Panda sempre emite isso independentemente de `staticCss`); todo outro valor de variante silenciosamente fica com zero CSS gerado.

**Correção:** a chave em `staticCss.recipes` deve ser exatamente a chave de registro de `app/theme/recipes/index.ts` (`switchRecipe`, não `switch`). É fácil errar isso em qualquer receita cujo arquivo/className não coincidam com o nome de exportação, e não dá **nenhum** sinal de compilação ou de tempo de execução quando está errado — verifique dando `grep` no CSS gerado pela classe de variante que você espera (p. ex. `grep "switch__root--size_sm" design-system/styles.css`) após qualquer edição de `staticCss`, não confie apenas em olhar a config.

**Isso se repetiu três vezes** na mesma receita antes de ser realmente resolvido, porque `design-system/` está no gitignore — rodar `cssgen` depois de corrigir a config produz saída *local* correta, mas se a própria edição de `panda.config.ts` nunca for commitada, o bug volta assim que outra pessoa regenerar. **A única parte durável de qualquer correção de `staticCss`/receita é a edição do arquivo-fonte** (`panda.config.ts`, `app/theme/recipes/*.ts`) — sempre confirme com `git status`/`git diff` que esses arquivos estão de fato staged, não apenas que o CSS local parece correto.

### 2. Variantes de receita com slots precisam ser indexadas por slot, ou o Panda as descarta silenciosamente

**Sintoma:** uma classe de variante está presente no HTML renderizado (`carousel__root--colorPalette_green`), o estilo pretendido está completamente ausente, e o CSS gerado tem **zero** regras para essa classe — nem mesmo uma vazia.

**Causa:** em uma `defineSlotRecipe`, todo valor de variante precisa aninhar seus estilos sob o nome do slot que ele mira:

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

Uma `defineRecipe` plana (sem slots — `badge.ts`, `anchor.ts`, `button.ts`) usa corretamente a forma *sem slot*; copiar esse padrão para dentro de uma `defineSlotRecipe` (qualquer coisa com um array `slots: [...]`) é o erro. Isso já pegou `rating-group.ts`, `carousel.ts` e `clipboard.ts` de forma independente — é uma armadilha fácil de copiar-e-colar entre os dois tipos de receita, e vale a pena olhar de novo sempre que a nova variante de uma receita com slots "não faz nada".

### 3. Estilos condicionais de `base` perdem para estilos de `variant` na mesma propriedade CSS — sempre, independentemente da especificidade

**Sintoma:** um estilo condicional/dirigido por estado colocado no bloco `base` de uma receita com slots (p. ex. `&[data-complete]: { borderColor: ... }`) nunca se aplica, mesmo com o atributo/classe confirmadamente presente no DOM e a regra CSS confirmadamente presente na folha de estilos.

**Causa:** o Panda emite os estilos de `base` e os estilos de `variants` em **camadas de cascata CSS separadas**, com a camada de variantes ordenada depois da de base. A ordem de camada CSS vence a especificidade de seletor incondicionalmente — um seletor de `base` altamente específico ainda perde para uma regra incondicional simples na camada de `variants` se ambas definem a mesma propriedade.

**Correção:** mova a substituição condicional para **todo bloco `variant.<name>.<slot>` relevante** em vez de `base`, espalhando um objeto compartilhado em cada um se os estilos se repetirem. O tratamento de `_invalid` em `app/theme/recipes/input.ts` (duplicado por variante, não centralizado em `base`) é o padrão de referência existente.

### 4. Tokens `colorPalette.*` resolvem para uma cor real (cinza-escuro, quase preta), nunca "sem cor" — um *escopo ativo* é necessário

**Sintoma:** um componente estilizado com `bg: "colorPalette.solid.bg"` etc. renderiza em um cinza/preto escuro e opaco independentemente da prop `colorPalette` passada (ou mesmo se a receita não tem nenhum conceito de `colorPalette`).

**Causa:** `colorPalette.*` são tokens virtuais que resolvem contra quaisquer custom properties `--colors-color-palette-*` que estejam em escopo naquele nó do DOM. O tema define um **escopo padrão global como `gray`** em `:root`/`html`, então em qualquer lugar onde nenhum escopo de colorPalette mais específico esteja ativo, `colorPalette.solid.bg` resolve silenciosamente para `gray.solid.bg` — não transparente, não um erro, uma cor real (escura). Isso é fácil de diagnosticar erroneamente como "quebrado" quando na verdade é apenas "sem escopo".

**Correção:** aplique um escopo de colorPalette de fato, seguindo o padrão centralizado abaixo — não presuma que um componente "simplesmente não tem cor" só porque parece cinza/preto.

### 5. Props de variante responsivas não emitem CSS de breakpoint

`<Heading size={{ base: "2xl", md: "3xl" }}>` renderiza `class="heading--size_2xl md:heading--size_3xl"` corretamente no HTML, mas nenhuma regra `@media` para a classe `md:` chega a ser gerada — `staticCss.recipes: ["*"]` só força a geração de classes de variante literais, não responsivas; ele não as multiplica em conjunto com condições de breakpoint. **Nunca passe um objeto responsivo como prop de variante**; use um valor literal fixo, ou uma substituição via `css()`/classe utilitária de embrulho para a propriedade específica que precisa mudar por breakpoint (classes utilitárias simples não têm essa limitação, só as props de variante de receita).

---

## Temas via `colorPalette`: o padrão centralizado

Os frameworks JSX oficialmente suportados pelo Panda ganham `colorPalette` "de graça": o wrapper `styled()` deles separa automaticamente uma prop `colorPalette` de qualquer componente e a mescla como uma classe utilitária genérica, junto com o que as próprias variantes da receita produzirem. **Este repositório não tem isso**, porque `jsxFramework: undefined`. As receitas do [Park UI](https://park-ui.com) upstream (a fonte original de componentes deste projeto, portada manualmente para `hono/jsx`) dependem exatamente dessa integração ausente — o próprio `switch.ts` deles não tem variante `colorPalette` nenhuma.

Durante anos, para um subconjunto de componentes, isso foi remendado **declarando manualmente uma variante `colorPalette` na própria receita** (`badge.ts`, `anchor.ts`, `button.ts`, …), copiando e colando o mesmo mapa de paleta de ~11 entradas em cada uma. Essa abordagem é o que causou a maioria dos bugs acima: é fácil esquecer em um componente novo (`switch.ts`/`avatar.ts`/`card.ts`/`checkbox.ts` nunca a receberam, então a prop `colorPalette` deles silenciosamente não fazia nada), fácil errar a forma com/sem slot (§2), e espalhou a mesma lista de nomes de paleta — com desvios — por uma dúzia de arquivos (alguns mapas artesanais de algumas receitas referenciavam `teal`/`indigo`/`pink`/`yellow`, nomes de paleta que nem existem nas `app/theme/colors/` deste tema — esses também não fariam nada silenciosamente).

**O padrão atual** (a partir da passagem de centralização de `colorPalette`) substitui tudo isso por um único utilitário compartilhado:

- `staticCss.css` de `panda.config.ts` força a geração da classe utilitária `colorPalette` simples do Panda (`.color-palette_blue`, etc.) para todo nome de paleta real que o tema de fato define (`gray`/`blue`/`green`/`red`/`orange`/`purple`/`cyan`/`amber` — confira `app/theme/colors/*.ts` para a lista atual antes de adicionar um nome novo em qualquer lugar).
- `app/components/ui/color-palette.ts` exporta `colorPaletteClass(colorPalette?: string)`, que resolve aliases (`success`→green, `error`→red, `warning`→orange, `slate`→gray — `slate` em particular é usado por todo o conteúdo do CMS mesmo que a escala de cinza deste tema só esteja registrada como `gray`) e retorna a classe utilitária correta.

**Para adicionar suporte a `colorPalette` a um componente** (um componente cuja receita referencia tokens `colorPalette.*` mas não tem como um consumidor de fato escolher uma):

1. **Não** adicione uma variante `colorPalette` à receita. Deixe as referências de token `colorPalette.*` da receita como estão.
2. Na primitiva do componente (`*-primitive.tsx`), desestruture `colorPalette` das props **antes** de qualquer spread `...rest`/`...restProps` que caia no nó DOM — igual a qualquer outra prop conhecida — para que nunca vaze como um atributo HTML inválido `colorpalette="..."`.
3. Se o componente anteriormente tinha uma cor padrão fixa, preserve-a como um valor padrão simples do JS na desestruturação (`colorPalette = "blue"`), não como uma entrada `defaultVariants` da receita.
4. Mescle `colorPaletteClass(colorPalette)` na lista de classes do **slot raiz/primário** — `cx(styles.root, colorPaletteClass(colorPalette), classProp)` — para que se propague aos slots descendentes via herança normal de custom property CSS. Só precisa ir no elemento mais externo que estabelece o escopo, nunca em todos os slots.
5. Se o componente é composto via um provedor de contexto (p. ex. `ButtonGroup` → `Button` via `ButtonContext`), certifique-se de que `colorPalette` seja passado por esse valor de contexto explicitamente — ele não faz mais parte de `variantProps`, então qualquer coisa que antes encaminhava `variantProps` sozinho para propagar cor precisa de `colorPalette` adicionado de volta manualmente.
6. Regenere (`panda codegen && panda cssgen`) e verifique: renderize o componente, dê `grep` no HTML de SSR (ou em `design-system/styles.css`) pela classe `color-palette_<name>` esperada, e confirme que nenhum atributo `colorpalette=` vazou para o DOM.

Não reintroduza um mapa de variante `colorPalette` por receita em um componente novo — esse é exatamente o padrão que essa centralização substituiu, especificamente porque não escala e regride silenciosamente.

---

## Cores de token vs. tokens semânticos

- **`tokens.colors`** (`app/theme/tokens/colors.ts`) — valores estáticos puros (preto, branco).
- **`semanticTokens.colors`** (`app/theme/index.ts`, `app/theme/colors/*.ts`) — as escalas de paleta adaptativas (gray/slate, blue, red, green, orange, purple, cyan, amber), cada uma compilada em custom properties automáticas para modo claro/escuro.

**Evite tokens genéricos `bg`/`fg`** — eles compilam para CSS transparente/inválido neste tema (o plugin "Remove Panda Preset Colors" em `panda.config.ts` remove o preset de cores padrão do Panda, e os `bg`/`fg` genéricos nunca foram substituídos). Use tokens semânticos explícitos em vez disso: `gray.surface.bg`, `fg.default`, `gray.outline.border`, etc. Popups/dropdowns/painéis de autocompletar em particular devem usar `gray.surface.bg` (não `colorPalette.surface.bg`) para que o fundo do painel permaneça uma superfície neutra e opaca independentemente de qual cor de destaque estiver ativa no gatilho.

### Onde o acento padrão do site de fato reside

Todo arquivo de cor em `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate`) é uma opção `colorPalette` totalmente formada e pronta para uso — mesma forma (uma escala 1–12, uma escala alfa a1–a12, e subgrupos `solid`/`subtle`/`surface`/`outline`/`plain`, cada um com `bg`/`fg`). Uma cor existir naquele diretório só significa que foi gerada (p. ex. pelo CLI do Park UI na inicialização do projeto) — isso não diz nada sobre se ela está *ativa* em algum lugar.

**Nada no próprio Panda, e nada na saída do CLI do Park UI (`components.json`), persiste qual cor você escolhe como "o" acento durante a inicialização** — não há chave de config para isso em nenhum dos dois. A única coisa que de fato decide o acento padrão de todo o site é uma linha escrita à mão:

```ts
// app/theme/global-css.ts
html: {
  colorPalette: "gray",
  // ...
},
```

Isso define o escopo `colorPalette` raiz que todo elemento sem escopo herda. É uma declaração CSS simples, fácil de passar despercebida, e fácil de perder de vista — se você algum dia se perguntar "por que este projeto usa `gray` como acento em vez de `cyan`/o que quer que eu tenha escolhido na inicialização", esta linha é a resposta, e alterá-la é uma edição de uma linha só, de baixo risco (todo arquivo de cor tem a mesma forma de token idêntica, então trocar o valor é um drop-in limpo).

**Este padrão é apenas um fallback.** Qualquer um dos 13 componentes migrados para o padrão centralizado `colorPaletteClass()` acima (switch, badge, button, card, …) carrega seu **próprio** padrão explícito (veja a lista por componente naquela seção) e não vai seguir uma mudança nesta linha — só componentes/utilitários sem um `colorPalette` explícito próprio (as custom properties globais de anel de foco/seleção também declaradas em `global-css.ts`, e qualquer receita ainda não migrada) de fato leem este valor raiz.

### `fg`/`border`/`canvas` são deliberadamente somente cinza, sempre

`fg.default`, `fg.muted`, `fg.subtle`, `border` e `canvas` (declarados em `semanticTokens.colors` de `app/theme/index.ts`) são fixados diretamente em `colors.gray.*` — **não** `colors.colorPalette.*`. Isso é intencional, não uma lacuna: é a convenção padrão "um acento + um cinza" do Radix/Park UI — texto do corpo, bordas e fundo da página devem permanecer neutros independentemente de qual acento esteja ativo, tanto por contraste/legibilidade quanto para que o acento seja lido como um acento em vez de tingir a página inteira. Não "conserte" isso para referenciar `colorPalette.*` esperando que peguem a cor de acento do site; isso seria uma regressão, não uma melhoria. Só superfícies genuinamente interativas/de marca (o estado marcado de um controle, o preenchimento sólido de um botão, o fundo de um badge, …) devem referenciar `colorPalette.*` — confirmado como o padrão real em toda receita de controle (`switch.ts`, `checkbox.ts`, `badge.ts`, `button.ts`: o estado neutro/desmarcado usa um token `gray.*` fixo, o estado marcado/de acento usa `colorPalette.*`).

---

## Checklist de verificação após qualquer mudança em receita ou em `panda.config.ts`

Não confie em uma olhada visual — os bugs acima todos *pareciam* estar tudo certo até serem inspecionados de perto (um elemento preto/cinza é lido como "estilo padrão", não "quebrado").

1. `bunx panda codegen && bunx panda cssgen` (a partir da raiz do repositório — confira o `pwd` primeiro; rodar isso a partir de um subdiretório escreve silenciosamente `design-system/` no local aninhado errado em vez de dar erro).
2. Dê `grep` no CSS gerado pela classe específica que você espera: `grep "switch__root--size_sm" design-system/styles.css`, `grep "color-palette_blue" design-system/styles.css`.
3. Renderize a página real (servidor de dev ou `bun test`) e dê `grep` na saída HTML de SSR pela mesma classe, e pela *ausência* de qualquer nome de prop bruto vazado como atributo DOM (`colorpalette="..."`, `size="..."` etc. em um elemento que não deveria tê-lo).
4. `bun test` — rode a suíte de testes unitários completa; um teste desatualizado que afirma um formato antigo de classname é um falso-positivo comum depois de uma refatoração de estilo, vale a pena uma leitura rápida antes de presumir uma regressão real.
5. `git status`/`git diff` nos arquivos **fonte** (`panda.config.ts`, `app/theme/recipes/*.ts`, `app/components/ui/*.tsx`) — nunca em `design-system/`, que está no gitignore e é descartado. Uma correção que "funciona localmente" mas nunca foi de fato commitada no fonte não é uma correção.

---

## FAQ

### Como posso mudar a cor de acento padrão de todo o site?

Edite uma linha em `app/theme/global-css.ts`:

```ts
html: {
  colorPalette: "cyan", // was "gray"
  colorScheme: { _light: "light", _dark: "dark" },
},
```

O valor precisa ser um dos nomes de paleta que de fato existem em `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate` — registrado como `gray`). Todo um desses arquivos tem a mesma forma de token idêntica (`solid`/`subtle`/`surface`/`outline`/`plain`, cada um com `bg`/`fg`), então essa é uma troca limpa e segura — nenhum outro token precisa mudar junto.

Em seguida:

1. `bunx panda codegen && bunx panda cssgen` para regenerar.
2. Confira o resultado: `fg`/`border`/`canvas` (texto do corpo, divisores, fundo da página) **não** vão mudar — são deliberadamente fixados na escala de cinza neutra independentemente do acento, como visto acima. Só superfícies genuinamente dirigidas por acento (um switch/checkbox marcado, um botão sólido, um badge sem escopo, anéis de foco, seleção de texto) vão adotar a cor nova.
3. Lembre-se de que isso só muda o **fallback**. Qualquer um dos 13 componentes já migrados para `colorPaletteClass()` (switch, badge, button, anchor, card, checkbox, carousel, clipboard, date-picker, radio-card-group, rating-group) carrega seu próprio padrão explícito por componente e precisa ser atualizado manualmente, um a um, em sua primitiva (`app/components/ui/*-primitive.tsx`, o valor padrão `colorPalette = "..."` na desestruturação) se você quiser que também sigam o novo acento do site, em vez de manter seu padrão individualmente escolhido atual.
</content>
