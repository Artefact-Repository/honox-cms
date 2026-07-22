---
title: Construtor de Páginas CMS
---

## Introdução

O Construtor de Páginas dinâmico baseado no [Sveltia CMS](https://sveltiacms.app/en/docs/intro) permite que editores não técnicos criem páginas complexas, aninhadas de forma recursiva, inteiramente através da interface do usuário do CMS (`/admin/`).

Os layouts de página são salvos como arquivos JSON em `content/pages/*.json` e são compilados sob demanda ou pré-gerados estaticamente (via Hono SSG) em `/pages/[slug]`.

***

## Componentes suportados

O Construtor de Páginas suporta uma rica paleta de mais de 40 componentes de layout, tipografia, decorativos e interativos.

### 1. Estrutura e layout

* **Stack**: Agrupa os filhos vertical ou horizontalmente com alinhamento, justificação e espaçamento (gap) controláveis.
* **Grid**: Layout de CSS Grid responsivo — número fixo de colunas/linhas, ou ajuste automático (auto-fit) pela largura mínima do filho.
* **Group**: Alinha elementos como botões de forma compacta (suporta as propriedades `attached` e `grow`).
* **Fieldset**: Organiza componentes de formulário relacionados dentro de um contêiner estilizado, com `legend`, `helperText` e `errorText`.
* **AbsoluteCenter**: Centraliza um único bloco aninhado dentro do seu pai ao longo de um ou ambos os eixos.
* **Splitter**: Painéis redimensionáveis separados por alças de arraste. Sempre renderiza de forma estática no Construtor de Páginas (o conteúdo do painel não pode atravessar o limite de hidratação da ilha).
* **Breadcrumb**: Trilha de navegação de itens vinculados com um separador personalizável.

### 2. Tipografia e conteúdo

* **Heading**: Cabeçalhos estilizados de níveis `h1` a `h6` e vários tamanhos de texto responsivos.
* **Text**: Texto em nível de parágrafo com tamanhos ajustáveis.

### 3. Exibição e apresentação

* **Alert**: Renderiza alertas de aviso/sucesso/erro/informação com estados e ícones padrão.
* **Badge**: Etiquetas de metadados coloridas com paletas de cores e estilos personalizados.
* **Card**: Um contêiner rico que suporta blocos aninhados, cabeçalhos, rodapés e posições de imagem superior/inferior/esquerda/direita.
* **Progress**: Renderiza indicadores de progresso lineares ou circulares.
* **Skeleton**: Esqueletos de espaço reservado altamente personalizáveis (suporta formas de círculo e texto multilinha).
* **Loader** / **Spinner**: Indicadores de carregamento, com texto opcional que os acompanha.
* **Table**: Dados tabulares estáticos com colunas configuráveis e um array de linhas codificado em JSON.
* **Icon**: Marcação SVG embutida bruta com controles de tamanho/cor.

### 4. Interativos e sobreposições

* **Button**: Alvos clicáveis principais que suportam paletas, tamanhos e variantes de estilo personalizados.
* **Checkbox**: Caixas de marcação para entrada booleana com vínculos aria acessíveis.
* **Combobox**: Dropdowns com ações de limpar e listas de itens.
* **Collapsible**: Contêineres de divulgação que exibem/ocultam árvores de componentes aninhados.
* **Popover**: Conteúdo descritivo flutuante ancorado a gatilhos de texto padrão.
* **Tooltip**: Texto de dica contextual ancorado a um botão gatilho ao passar o cursor/focar.
* **HoverCard**: Conteúdo mais rico disparado ao passar o cursor do que um Tooltip, com título/descrição opcionais.
* **Dialog**: Caixas modais com aprisionamento de foco completo, botões de Confirmar/Cancelar personalizados e lista de filhos personalizada.
* **Drawer**: Painéis laterais responsivos que deslizam a partir da borda da página, com lista de filhos personalizada.
* **Dropdown** (tipo de bloco `menu`): Menus de ação com opções personalizadas de marcação, seleção e separador.

### 5. Avançados e de dados

* **Select**: Dropdown personalizado de seleção única/múltipla, enviável em formulário.
* **DatePicker**: Seleção de data única/múltipla/intervalo com um calendário pop-up.
* **TagsField**: Lista livre de tags de texto.
* **RadioGroup** / **RadioCardGroup**: Listas de rádio personalizadas com lógica de seleção única acessível.
* **SegmentGroup**: Controles segmentados deslizantes para seleção em estilo de abas.
* **Slider**: Componentes de controle deslizante de intervalo.
* **Switch**: Interruptores de alternância.
* **Editable**: Texto embutido editável com um clique.
* **ColorPicker**: Seletor de cor de saturação/matiz/alfa com entrada hex/RGBA/HSLA.
* **FileUpload**: Seleção de arquivos por arrastar e soltar ou clique para navegar.
* **Carousel**: Apresentação de imagens automática ou manual.
* **PaginatedTable**: Componentes de tabela dinâmica interativa com suporte a paginação.
* **Pagination**: Controladores de página interativos.

***

## Arquitetura

### 1. Definições de esquema do CMS (`public/admin/config.yml`)

Utilizamos **âncoras e aliases YAML** avançados (`&` e `*`) para resolver o desafio da recursão infinita nas especificações YAML.

* As **âncoras base** (`button_fields`, `checkbox_fields`, etc.) são declaradas uma única vez.
* Os **componentes de Nível 1** definem elementos planos e um contêiner `Stack`/`Collapsible` que suporta **componentes de Nível 2** (`*l2_components`).
* Os **componentes de Nível 2** permitem recursivamente outra camada de contêineres aninhados (`*l3_components`).
* Isso permite que os editores aninhem layouts até **4 níveis de profundidade** sem exceder os limites do analisador YAML/CMS.

### 2. Renderizador de layout (`app/components/page-renderer.tsx`)

O motor de layout importa todos os módulos de componentes públicos de `app/components/ui/` e os mapeia em um compilador JSX de alto desempenho e totalmente seguro em tipos.

* Os tipos de entrada são fortemente convertidos em dicionários de registro `unknown` padrão para evitar a coerção de tipos e manter as verificações de lint do Biome totalmente limpas.
* Os contêineres aninhados são tratados recursivamente usando chamadas aninhadas ao componente `<PageRenderer content={...} />`.

***

## Pipelines de build de conteúdo

Os layouts do Construtor de Páginas são um dos três tipos de conteúdo em `content/`, cada um descoberto com `import.meta.glob` do Vite e renderizado por sua própria rota. Todos os três são gerados estaticamente da mesma forma: o middleware `ssgParams` de uma rota enumera cada arquivo de sua coleção em tempo de build, e `bun run build` (via `@hono/vite-ssg`) percorre esses parâmetros para pré-renderizar um arquivo HTML estático por slug em `dist/`.

### 1. Layouts de página JSON (`content/pages/*.json`)

* Carregados com `import.meta.glob("/content/pages/*.json", { import: "default" })` em `app/routes/pages/[slug].tsx`.
* Cada arquivo é analisado como JSON puro — sem markdown envolvido — e seu array `content` é entregue diretamente ao `<PageRenderer />` (veja Arquitetura acima), que o compila recursivamente nos componentes de UI correspondentes.
* Este é o único dos três pipelines sem uma etapa separada de análise/compilação: o JSON _é_ a árvore de renderização.

### 2. Markdown simples (`content/posts/*.md`, `content/docs/*.md`)

* Carregado com `import.meta.glob(..., { query: "?raw", import: "default" })`, que devolve o código-fonte markdown bruto como uma string em vez de um módulo compilado.
* Analisado em tempo de solicitação/build por `app/utils/markdown.ts`, um pipeline `remark`/`rehype` (`remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-stringify`): `parseFrontmatter()` separa o bloco de frontmatter YAML do corpo, e `markdownToHtml()` transforma o corpo em uma string HTML.
* A string resultante é injetada via `dangerouslySetInnerHTML` (veja `app/lib/posts.ts` e `app/lib/docs.ts`) — não há JSX envolvido, então este pipeline não pode incorporar componentes ativos.
* As postagens do blog também processam seu corpo através de `stripMarkdown()` para construir um texto de busca simples (haystack) para `/api/*/search.json`.

### 3. Documentos MDX (`content/docs/*.mdx`)

* Compilados antecipadamente pelo plugin Vite `@mdx-js/rollup` (configurado em `vite.config.ts`, restrito a `.mdx` para que nunca intercepte as importações `.md` brutas mencionadas acima), usando `remark-frontmatter` + `remark-mdx-frontmatter` + `remark-gfm`.
* Cada arquivo `.mdx` se torna um componente real e importável (mais uma exportação `frontmatter` separada), carregado em `app/lib/docs.ts` via um `import.meta.glob` simples (sem `?raw`).
* Como a saída é um componente em vez de uma string HTML, os documentos `.mdx` podem incorporar exemplos interativos realmente renderizados (por exemplo, uma demo ativa de `<Button>`) diretamente no texto — a contrapartida é a etapa de compilação em tempo de build que o `.md` simples não precisa.

`app/lib/docs.ts` carrega as coleções `.md` e `.mdx` lado a lado e as mescla em uma única barra de navegação lateral, então qual pipeline um determinado documento usa é um detalhe de implementação invisível para os leitores — escolha `.md` para prosa simples e `.mdx` somente quando uma página precisar de um componente ativo incorporado nela.

***

## Exemplo de estrutura JSON

Aqui está um arquivo de layout de exemplo representando uma página de painel complexa (`content/pages/dashboard.json`):

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
