---
title: Hidratação
---

Este projeto utiliza a arquitetura de **Hidratação de Ilhas** do [HonoX](https://github.com/honojs/honox) e o [**@hono/vite-ssg**](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) para a Geração de Sites Estáticos das páginas, emitindo **HTML estático** por padrão, e apenas os componentes que realmente precisam de interatividade no lado do cliente são "promovidos" a ilhas (fragmentos de JS do cliente).

> O comportamento de hidratação de cada componente converge para o predicado `shouldHydrate`
> em `app/components/ui/island-utils.ts`. Qualquer decisão sobre _quando renderizar HTML estático_
> versus _quando montar uma ilha do lado do cliente_ é resolvida aqui — veja
> [Hidratação](/docs/Hydration) para o modelo completo de níveis, as regras de decisão e a
> classificação por componente.

1. **Zero JS redundante** — componentes sem interação nunca precisam enviar um script de hidratação.
2. **Zero quebras silenciosas** — componentes que _precisam_ de interação devem se hidratar automaticamente, mesmo que quem os chame esqueça de passar `interactive`.
3. **Fonte única de verdade** — cada decisão de "isto deve hidratar?" passa por uma única função compartilhada `shouldHydrate`, eliminando ramificações ad hoc `if (interactive)` por componente.

## O predicado central

`app/components/ui/island-utils.ts`:

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

### Tabela verdade

| `interactive` | `hasSignal` | Resultado | Significado |
| --- | --- | --- | --- |
| `false` | qualquer | `false` | Proibido explicitamente hidratar (puramente estático) |
| `true` | qualquer | `true` | Forçado explicitamente a hidratar |
| `undefined` | `true` | `true` | Detecção inteligente: sinal presente → hidratar |
| `undefined` | `false` | `false` | Detecção inteligente: sem sinal → estático |

***

## O modelo de 3 níveis

### Nível 1 — Auto-interativo

> **Regra central: `shouldHydrate(interactive, true)`**

Estes componentes _são_ a interação — todo o seu valor depende do JS do cliente
(sobreposições, modais, alças de arraste, expandir/recolher). Eles se hidratam
a menos que quem os chame passe explicitamente `interactive={false}`.

Aplica-se a:

- Famílias de sobreposição / popover (tooltip, hover-card, popover, menu)
- Modais / gavetas / arraste (dialog, drawer, splitter)
- Expandir / recolher (collapsible)
- Singletons puramente do cliente (toast)

### Nível 2 — Auto-detecção inteligente

> **Regra central: `shouldHydrate(interactive, hasSignal)`**

Estes componentes são _estáticos por padrão, interativos apenas quando há um sinal presente_.
São **controles de formulário controlados/não controlados ou grupos selecionáveis**: a hidratação
só importa quando um estado (`value` / `checked` / `defaultValue`) ou um manipulador
(`onChange` / `onClick` …) é fornecido; caso contrário, a marcação estática já é suficiente.

Aplica-se a:

- Controles de formulário (button, checkbox, switch, textarea, field, slider, combobox, radio-group)
- Grupos selecionáveis (segment-group, toggle-group)
- Tabelas com clique em linha (table)
- Avatar com `src` (o carregamento assíncrono da imagem / o ciclo de vida de erro é um sinal exclusivo do cliente)
- Paginação / tags-input (estado + manipuladores; uma paginação `type="link"` que fornece
  `getPageUrl` é navegação pura e permanece estática)

### Nível 3 — Apresentacional

> **Nunca monta uma ilha**

Componentes puramente tipográficos / decorativos sem comportamento do cliente. **Não devem declarar**
**uma propriedade `interactive`** (historicamente `badge` / `heading` / `text` / `fieldset`
a declararam por engano e vazaram o atributo para o DOM — agora removido).

Aplica-se a:

- Tipografia (text, heading, badge)
- Layout (group, absolute-center, fieldset)
- Indicadores de status (alert, breadcrumb, loader, skeleton, spinner, progress)
- Gráficos (icon)

***

## Classificação completa de componentes

> Legenda de status: `✅` está em conformidade com a convenção; `⚠️` diverge da convenção e
> precisa de migração (ver Seção 7). Após a última rodada de limpeza, **todos os componentes são `✅`**.

### Nível 1 (auto-interativo)

| Componente | Regra | Gatilho | Status |
| --- | --- | --- | --- |
| `dialog` | `shouldHydrate(interactive, true)` | Sempre hidrata, exceto com `interactive={false}` | ✅ `dialog.tsx` |
| `drawer` | `shouldHydrate(interactive, true)` | Sempre hidrata, exceto com `interactive={false}` | ✅ `drawer.tsx` |
| `splitter` | `shouldHydrate(interactive, true)` | Sempre hidrata, exceto com `interactive={false}` | ✅ `splitter.tsx` |
| `tooltip` | `shouldHydrate(interactive, true)` | Sempre hidrata | ✅ `tooltip.tsx` |
| `hover-card` | `shouldHydrate(interactive, true)` | Sempre hidrata | ✅ `hover-card.tsx` |
| `popover` | `shouldHydrate(interactive, true)` | Sempre hidrata | ✅ `popover.tsx` |
| `menu` | `shouldHydrate(interactive, true)` | Sempre hidrata | ✅ `menu.tsx` |
| `select` | `shouldHydrate(interactive, true)` | Sempre hidrata — abrir o dropdown e selecionar um item exigem JS; não há alternativa estática (o `<select>` nativo fica visualmente oculto e existe apenas para o envio do formulário) | ✅ `select.tsx` (Nível 1) |
| `collapsible` | `shouldHydrate(interactive, true)` | Sempre hidrata (expandir/recolher precisa de JS) | ✅ `collapsible.tsx` (Nível 1) |
| `toast` | Sempre ilha (singleton do cliente) | Sem propriedade, sempre é uma ilha | ✅ `toast.tsx` |

### Nível 2 (auto-detecção inteligente)

| Componente | Sinal de comportamento (`hasSignal` é true quando…) | Status |
| --- | --- | --- |
| `button` | `onClick` / `onPointerDown` / `onSubmit` | ✅ `button.tsx` |
| `card` | `onClick` / `onPointerDown` | ✅ `card.tsx` |
| `table` | qualquer `row.onClick` | ✅ `table.tsx` |
| `segment-group` | `value` / `defaultValue` / `onValueChange` | ✅ `segment-group.tsx` |
| `toggle-group` | `value` / `defaultValue` / `onValueChange` | ✅ `toggle-group.tsx` |
| `slider` | `value` / `defaultValue` / `onChange` / `onDraggingChange` | ✅ `slider.tsx` |
| `checkbox` | `checked` / `defaultChecked` / `onCheckedChange` | ✅ `checkbox.tsx` |
| `switch` | `checked` / `defaultChecked` / `onCheckedChange` | ✅ `switch.tsx` |
| `textarea` | `value` / `defaultValue` / `onValueChange` / `validator` / `minLength` | ✅ `textarea.tsx` |
| `field` | `value` / `defaultValue` / `onValueChange` / `validator` / `minLength` | ✅ `field.tsx` |
| `combobox` | `open` / `inputValue` / `onToggle` / `onInputChange` / `onItemSelect` | ✅ `combobox.tsx` |
| `radio-group` | `value` / `defaultValue` / `onValueChange` | ✅ `radio-group.tsx` |
| `avatar` | `src` (carregamento assíncrono de imagem / ciclo de vida de erro) | ✅ `avatar.tsx` (Nível 2) |
| `pagination` | `onPageChange`, ou `page` / `defaultPage` / `pageSize` / `defaultPageSize` fora do modo link | ✅ `pagination.tsx` |
| `tags-input` | `onValueChange` / `onInputValueChange` / `value` / `inputValue` / `defaultValue` / `defaultInputValue` | ✅ `tags-input.tsx` |
| `paginated-table` | Sempre ilha (gerencia o estado interno de paginação) | ✅ `paginated-table.tsx` (lógica de Nível 2) |
| `date-picker` | `value` / `defaultValue` / `focusedValue` / `open` / `defaultOpen` / `onValueChange` / `onOpenChange` / (eventos de teclado/clique/digitação) | ✅ `date-picker.tsx` |
| `color-picker` | `value` / `defaultValue` / `format` / `defaultFormat` / `open` / `defaultOpen` / `onValueChange` / `onFormatChange` / `onOpenChange` / (eventos de ponteiro/teclado/entrada) | ✅ `color-picker.tsx` |

### Nível 3 (apresentacional)

| Componente | Notas | Status |
| --- | --- | --- |
| `text` | Texto tipográfico | ✅ |
| `heading` | Cabeçalho | ✅ |
| `badge` | Selo/badge | ✅ (propriedade `interactive` morta removida) |
| `fieldset` | Conjunto de campos de formulário | ✅ (propriedade `interactive` morta removida) |
| `alert` | Caixa de alerta | ✅ |
| `breadcrumb` | Trilha de navegação | ✅ |
| `group` | Agrupamento de layout | ✅ |
| `absolute-center` | Layout de centralização | ✅ |
| `loader` | Indicador de carregamento | ✅ |
| `skeleton` | Tela esqueleto | ✅ |
| `spinner` | Indicador giratório | ✅ |
| `progress` | Barra de progresso (orientada por valor, estática por padrão) | ✅ |
| `icon` | Envoltório de ícone SVG (apenas tamanho/cor, sem estado do cliente) | ✅ `icon.tsx` |

***

## Condições de gatilho por nível

### Condições do Nível 1

- A interação central do componente (abrir uma sobreposição, arrastar um splitter, expandir/recolher,
  aprisionamento de foco em um modal) **não pode ser expressa em HTML puro**, então `hasSignal`
  assume `true` por padrão.
- A única forma legal de exclusão é `interactive={false}` (por exemplo, forçar a desativação de uma
  sobreposição dentro de um documento puramente estático).
- `toast` é especial: é um singleton global do cliente (`toaster.create(...)`), e não
  expõe uma propriedade `interactive`.

### Condições do Nível 2

O `hasSignal` de cada componente é um OR booleano sobre "esta propriedade está definida?":

```typescript
// Typical pattern (segment-group shown)
const hasSignal =
	rest.value !== undefined ||
	rest.defaultValue !== undefined ||
	rest.onValueChange !== undefined;
if (shouldHydrate(interactive, hasSignal)) return <SegmentGroupIsland {...rest} />;
return <Root {...rest}>{/* static structure */}</Root>;
```

Princípios de decisão:

1. **Estado controlado** (`value` / `checked` / `open` / `inputValue`) → precisa de JS para se manter sincronizado.
2. **Valor inicial não controlado** (`defaultValue` / `defaultChecked`) → precisa de JS para manter o estado interno.
3. **Manipuladores de evento** (`onChange` / `onClick` / `onValueChange` / `onItemSelect` …) → precisam de JS para responder.
4. **Validação / restrições** (`validator` / `minLength`) → precisam de JS para serem executadas.
5. **Sinais assíncronos / exclusivos do cliente** — `src` em `avatar` (implica um ciclo de vida de carregamento/erro),
   ou qualquer propriedade cujo único propósito seja um efeito do lado do cliente (mídia, interseção, carregamento
   preguiçoso). Estes não podem ser resolvidos sem JS, então contam como sinal.
6. Qualquer um dos itens acima presente torna `hasSignal` verdadeiro, o que dispara a hidratação;
   se todos estiverem ausentes, o componente é renderizado como marcação puramente estática.

> **`avatar` é especial entre os componentes de Nível 2:** seu sinal é a pista de carregamento assíncrono `src`.
> Quando `src` está presente, a imagem precisa de tratamento de carregamento/erro do lado do cliente, então
> `shouldHydrate(interactive, Boolean(src))` a hidrata; um `avatar` sem `src` (por exemplo, um
> fallback de iniciais) permanece estático. Um `interactive={false}` explícito suprime a hidratação mesmo
> quando `src` existe (consistente com a semântica de "`false` sempre vence" em toda a biblioteca).

> **Exceção do modo link de `pagination`:** uma paginação `type="link"` que fornece `getPageUrl`
> é navegação pura (cada página é uma âncora), então permanece estática a menos que um
> manipulador `onPageChange` explícito seja fornecido. Somente no modo botão (ou com `onPageChange`) as
> propriedades `page` / `defaultPage` / `pageSize` / `defaultPageSize` contam como sinais.

### Condições do Nível 3

- O componente não mantém estado do cliente nem responde a eventos.
- Não declara uma propriedade `interactive`. (Historicamente `badge` / `heading` / `text` /
  `fieldset` a declaravam erroneamente, vazando `interactive="true"` para o DOM; isso foi
  removido na limpeza.)

***

## Lista de verificação de decisão para novos componentes

Percorra a lista em ordem; pare na primeira correspondência:

1. **A existência do componente depende inteiramente do JS do cliente?**
   Sobreposição / modal / arraste / expandir-recolher → **Nível 1**, use
   `shouldHydrate(interactive, true)`.
2. **É um controle de formulário ou um componente visualmente selecionável que pode ser controlado ou**
\*\*   não controlado?\*\*
   button / checkbox / switch / slider / combobox / tabela com clique em linha … → **Nível 2**,
   defina `hasSignal` (estado + manipuladores) e então chame `shouldHydrate(interactive, hasSignal)`.
3. **É puramente tipográfico / de layout / decorativo?**
   text / heading / alert / group / progress … → **Nível 3**, sem propriedade `interactive`, sem ilha.

**Requisitos rígidos de implementação:**

- Nenhum componente pode escrever uma ramificação `if (interactive) { … }` nua; deve sempre passar por `shouldHydrate`.
- `interactive` é apenas um "botão": `true` força, `false` proíbe, `undefined` delega para `hasSignal`.
- Todo componente de Nível 1 / Nível 2 deve adicionar uma seção `# Hydration` ao seu
  `content/components/<Component>.mdx` e referenciar cruzadamente este arquivo, além de definir
  seu campo de frontmatter `hydration` (`1` / `2` / `3`) para corresponder.

***

## Registro histórico de limpeza (já corrigido)

As divergências a seguir foram resolvidas durante o lançamento da convenção; mantidas aqui para rastreabilidade:

| # | Componente | Divergência original | Correção |
| --- | --- | --- | --- |
| 1 | `splitter` / `dialog` / `drawer` | `interactive = true` fixado no código + `if (interactive)`, sem passar por `shouldHydrate` | Alterado para `shouldHydrate(interactive, true)`, restaurando a exclusão `interactive={false}` |
| 2 | `radio-group` | `interactive ? Island : Root`, forçando quem chama a passar `interactive` | Alterado para `shouldHydrate(interactive, hasSignal)`, com sinais `value` / `defaultValue` / `onValueChange` |

| 3 | `avatar` | \`if (rest.src |  | interactive)\` ad hoc | Alterado para `shouldHydrate(interactive, Boolean(rest.src))`, ponto de entrada unificado |

| 4 | `badge` / `heading` / `text` / `fieldset` | Propriedade `interactive` morta declarada, vazada para o DOM via `restProps` (`interactive="true"`) | Removida a declaração da propriedade `interactive` |
| 5 | `collapsible` | Nível não documentado explicitamente | Adicionada uma seção `# Hydration` a `docs/Collapsible.md`, marcando-o como Nível 1 |
| 6 | `tags-input` | Ramificação nua `if (isInteractive)`, sem propriedade `interactive`, sem `shouldHydrate`, e `defaultValue` / `defaultInputValue` omitidos do conjunto de sinais (um tags-input não controlado era renderizado como estático) | Alterado para `shouldHydrate(interactive, hasSignal)`, adicionado o botão `interactive`, estendido o conjunto de sinais para incluir `defaultValue` / `defaultInputValue` |
| 7 | `pagination` / `avatar` | Ausentes das tabelas de nível (`pagination` completamente ausente; `avatar` mal classificado como Nível 1) e `pagination` hiper-hidratado no modo link | Adicionados `pagination` + `tags-input` ao Nível 2; movido `avatar` para o Nível 2 (sinal de pista de carregamento); restringido o modo link de `pagination` para que a navegação pura permaneça estática |

> Nota: o item 4 foi um bug real — `badge` / `heading` / `text` / `fieldset` renderizavam
> `interactive` como um atributo HTML inválido no DOM; foi priorizado para reparo.

***

## Documentação relacionada

- [Arquitetura de Componentes de UI](/docs/Architecture) — a visão geral em nível de projeto
- `app/components/ui/island-utils.ts` — o único ponto de entrada de decisão
- `content/components/<Component>.mdx` (cada componente de Nível 1 / Nível 2) — sua própria seção `# Hydration`, além do frontmatter `hydration`/`category`
