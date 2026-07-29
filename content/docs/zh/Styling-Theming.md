---
title: 样式与主题
---

本项目使用 [PandaCSS](https://panda-css.com)（类型安全、零运行时 CSS-in-JS）为每个组件设置样式，构建在原生 `hono/jsx` 之上 —— **而不是** Panda 官方支持的某个 JSX 框架（React/Vue/Solid/Qwik）之一。这一个事实 —— `panda.config.ts` 中的 `jsxFramework: undefined` —— 是本项目遇到的几乎所有样式回归问题的根本原因，因为它悄悄地让代码库放弃了 Panda 通常为你提供的若干能力。本页记录了由此产生的架构、它已经导致的具体 bug，以及应遵循的检查清单，以防这些问题再次发生。

---

## 样式如何从 recipe 到达页面

1. **Recipe** 编写于 `app/theme/recipes/*.ts` 下，使用 Panda 的 `defineRecipe`（单一 class，例如 `badge.ts`）或 `defineSlotRecipe`（带有具名 slot 的多部件组件，例如 `switch.ts` —— `root`/`control`/`thumb`/……）。
2. 每个 recipe 都以对象 key 的形式注册在 `app/theme/recipes/index.ts` 中，位于 `recipes`（扁平）或 `slotRecipes`（带 slot）之下。**其他所有地方引用它时用的都是这个注册 key** —— 而不是 recipe 的 `className`，也不是它的文件名。`switch.ts` 导出 `switchRecipe`（`switch` 是保留字），并以 `switchRecipe: switchRecipe` 的形式注册；`panda.config.ts` 以及任何引用该 recipe 的代码都必须使用 `switchRecipe`，而不能用 `switch`。
3. `panda.config.ts` 扩展了 `app/theme/` 的组合配置（`theme: { extend: { ...theme.config } }`），并扫描 `include: ["./app/**/*.{js,jsx,ts,tsx}"]` 来发现样式用法。
4. Panda 会将生成的系统 —— recipe 辅助函数、token、pattern、`css`/`cx` 运行时 —— 写入 `design-system/`，通过 `design-system` 这个 Vite 别名（`vite.config.ts`）导入。**`design-system/` 已被 gitignore** —— 它是一个构建产物，每次 install/build 时都会通过 PostCSS（`postcss.config.cjs` 接入了 `@pandacss/dev/postcss`）和 `prepare` 脚本（`panda codegen`，在 `bun install` 时运行一次）重新生成。真正随代码一起发布的只有*源*文件 —— `app/theme/recipes/*.ts`、`panda.config.ts`；对 `design-system/` 所做的任何直接修改都不会被提交。

### `codegen` 与 `cssgen` —— 你常常需要手动运行两者

| 命令 | 重新生成的内容 | 需要在以下情况后运行 |
| --- | --- | --- |
| `bunx panda codegen` | `design-system/recipes/*.mjs` + `.d.ts` —— 应用代码在运行时调用的 recipe 辅助函数（`switchRecipe()`、`.splitVariantProps()`、`.variantKeys`、`.variantMap`） | 在任意 recipe 上新增/删除/重命名一个 **variant** 之后 |
| `bunx panda cssgen` | `design-system/styles.css` —— 实际生成的 CSS 规则 | 新增/删除一个 **variant 值**，或修改 `staticCss` 之后 |

`vite dev` 的 PostCSS 集成会在你编辑时动态重新提取 CSS，但它**不会**重新生成 recipe 辅助函数的 `.mjs`/`.d.ts` 文件 —— 这些是你的代码直接导入的普通生成文件（`import { switchRecipe } from "design-system/recipes"`），而不是经过 Vite 转换的虚拟模块。如果你给某个 recipe 的 `variants` 新增了一个 `colorPalette` prop，却只是保存了文件，`switchRecipe.splitVariantProps()` 会一直使用**过时**的 `variantKeys` 列表，直到你运行 `panda codegen` 为止 —— 于是新 prop 会被悄悄归入「local props」而不是「variant props」，结果要么作为无效属性泄漏到 DOM 上，要么根本到不了样式函数。**每次编辑完任何 recipe 文件后都要手动运行这两个命令**，不要假设开发服务器已经感知到了变更。

---

## `staticCss`：为什么几乎每个 recipe 都被强制设为 `["*"]`

Panda 的静态分析只能为它能在源码中直接看到字面值的场景预先生成 CSS（`<Badge size="sm">`）—— 或者对于 JSX 框架集成，通过每个 recipe 的 `jsx: [...]` 映射（`button.ts` 和少数其他几个用了这种方式）。而这个代码库中的组件是在 primitive 文件内以 `recipeName(variantProps)` 的形式被调用的，传入的始终是一个**运行时计算出的对象**（`switchRecipe.splitVariantProps(props)`），而且大多数内容是 CMS 编写的 JSON（`content/pages/*.json`），其中的颜色/尺寸/变体值根本不会以字符串字面量的形式出现在任何 `.tsx` 源码里。Panda 的提取器无法看到这些内容，因此**每一个没有 `jsx` 映射的 recipe 都必须被强制生成其全部变体组合**，通过 `panda.config.ts` 的 `staticCss.recipes: { <recipeKey>: ["*"] }` —— 使用的是 `app/theme/recipes/index.ts` 中的*注册 key*，而不是 recipe 的 `className`。

下文的 switch 尺寸 bug 正是这样产生的，而且这是一个系统性的隐患：**只要 `staticCss.recipes` 的 key 与 recipe 实际的导出/注册名之间有任何一处拼写不一致，就会悄无声息地让该 recipe 的生成结果归零 —— 除默认变体外一个非默认变体都不生成**，而且不会有任何错误、警告或类型报错 —— Panda 只会默默地输出 base 加默认变体的 CSS，仅此而已。如果你新增了一个 recipe，务必立即把它的注册 key 条目加入 `staticCss.recipes`，并仔细核对该 key 与 `app/theme/recipes/index.ts` 中的完全一致（如果不确定，就在两个文件里都 `grep` 一下这个 key）。

---

## 已知的回归问题及防止它们的规则

### 1. `staticCss.recipes` 的 key 必须与 recipe 的注册名一致，而不是它的 `className`

**症状：** 每一个非默认的 variant 值（例如 `<Switch>` 上的 `size="sm"`/`"lg"`）渲染出来时，对应的 CSS 自定义属性完全没有被设置 —— 表现为一个坍缩、不可见的 0×0 元素，或者完全没有样式 —— 而默认 variant 看起来一切正常。

**原因：** `switch.ts` 导出 `switchRecipe`（在 `slotRecipes` 中以该 key 注册），但 `panda.config.ts` 的 `staticCss.recipes` 中写的却是 `switch: ["*"]` —— 这个 key 匹配不到任何东西。最终只有 base 加 `defaultVariants` 的 CSS 被发布出来（Panda 无论 `staticCss` 如何设置都会始终生成这部分）；其他每一个 variant 值都悄悄地得到了零生成 CSS。

**修复：** `staticCss.recipes` 中的 key 必须与 `app/theme/recipes/index.ts` 中的注册 key 完全一致（是 `switchRecipe`，而不是 `switch`）。对于任何文件名/`className` 与导出名不一致的 recipe，这一点都很容易出错，而且出错时**不会**有任何编译期或运行时信号 —— 每次修改 `staticCss` 后，都应该通过 grep 生成的 CSS 中你期望出现的 variant class 来验证（例如 `grep "switch__root--size_sm" design-system/styles.css`），而不要只是用眼睛看一遍配置。

**这个问题在同一个 recipe 上反复出现了三次**才真正被修复，原因是 `design-system/` 被 gitignore 了 —— 修复配置后运行 `cssgen` 会产出正确的*本地*结果，但如果 `panda.config.ts` 的修改本身从未被提交，那么只要有其他人重新生成，这个 bug 就会卷土重来。**任何 `staticCss`/recipe 修复中唯一持久的部分是源文件的修改**（`panda.config.ts`、`app/theme/recipes/*.ts`）—— 务必用 `git status`/`git diff` 确认这些文件确实已被暂存，而不能只看本地 CSS 是否正确。

### 2. Slot recipe 的 variant 必须以 slot 为 key，否则 Panda 会悄悄丢弃它们

**症状：** 渲染出的 HTML 中存在这个 variant class（`carousel__root--colorPalette_green`），但预期的样式完全缺失，而且生成的 CSS 中**完全没有**该 class 的任何规则 —— 连一条空规则都没有。

**原因：** 在 `defineSlotRecipe` 中，每一个 variant 值都必须把自己的样式嵌套在它所针对的 slot 名下：

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

扁平的 `defineRecipe`（没有 slot —— `badge.ts`、`anchor.ts`、`button.ts`）正确地使用了*非 slot* 形式；把这种写法复制进 `defineSlotRecipe`（任何带有 `slots: [...]` 数组的 recipe）就是错误所在。`rating-group.ts`、`carousel.ts` 和 `clipboard.ts` 都各自独立踩过这个坑 —— 这是两种 recipe 类型之间一个很容易发生的复制粘贴陷阱，只要遇到某个 slot recipe 的新 variant「什么都不做」，就值得回头再检查一遍。

### 3. 对于同一个 CSS 属性，`base` 中的条件样式永远会输给 `variant` 样式 —— 无论选择器优先级如何

**症状：** 放在 slot recipe 的 `base` 块中的条件/状态驱动样式（例如 `&[data-complete]: { borderColor: ... }`）从未生效，即便已经确认该属性/class 确实存在于 DOM 中，且该 CSS 规则本身也确实存在于样式表里。

**原因：** Panda 会把 `base` 样式和 `variants` 样式输出到**两个独立的 CSS 层叠层（cascade layer）**中，且 variants 层排在 base 层之后。CSS 层叠顺序无条件地胜过选择器优先级 —— 只要设置的是同一个属性，一个高度具体的 `base` 选择器仍然会输给 `variants` 层中一条毫无条件的普通规则。

**修复：** 把条件覆盖样式移动到**每一个相关的 `variant.<name>.<slot>` 块**中，而不是放在 `base` 里；如果样式在多处重复，就把一个共享对象展开（spread）进每个块中。`app/theme/recipes/input.ts` 中对 `_invalid` 的处理方式（在每个 variant 中重复声明，而不是集中在 `base` 里）就是现成的参考模式。

### 4. `colorPalette.*` token 总会解析为一个真实的颜色（偏灰、近乎黑色），而不是「没有颜色」—— 需要一个*生效中的 scope*

**症状：** 使用 `bg: "colorPalette.solid.bg"` 等方式设置样式的组件，无论传入了什么 `colorPalette` prop（甚至该 recipe 根本没有 `colorPalette` 这个概念），渲染出来都是暗淡的灰色/黑色。

**原因：** `colorPalette.*` 是虚拟 token，它会根据该 DOM 节点上生效的 `--colors-color-palette-*` 自定义属性来解析。主题在 `:root`/`html` 上设置了**全局默认 scope 为 `gray`**，因此只要没有更具体的 colorPalette scope 生效，`colorPalette.solid.bg` 就会悄悄解析为 `gray.solid.bg` —— 不是透明，也不是报错，而是一个真实的（深色的）颜色。这很容易被误诊为「坏了」，而实际上只是「没有 scope」。

**修复：** 按照下文的集中式模式应用一个真正的 colorPalette scope —— 不要因为一个组件看起来是灰色/黑色，就想当然地认为它「本来就没有颜色」。

### 5. 响应式 variant prop 不会生成断点 CSS

`<Heading size={{ base: "2xl", md: "3xl" }}>` 在 HTML 中会正确渲染出 `class="heading--size_2xl md:heading--size_3xl"`，但对应 `md:` class 的 `@media` 规则却永远不会被生成 —— `staticCss.recipes: ["*"]` 只会强制生成字面量、非响应式的 variant class，不会把它们与断点条件做叉乘。**永远不要把响应式对象作为 variant prop 传入**；应该使用扁平的字面量值，或者针对需要按断点变化的特定属性，用一个外层的 `css()`/utility class 来覆盖（普通的 utility class 没有这个限制，只有 recipe 的 variant prop 才有）。

---

## `colorPalette` 主题化：集中式模式

Panda 官方支持的 JSX 框架可以「免费」获得 `colorPalette`：它们的 `styled()` 包装器会自动从任意组件上拆分出 `colorPalette` prop，并把它作为一个通用的 utility class 合并进去，与 recipe 自身 variant 产生的 class 并存。**这个仓库没有这个能力**，因为 `jsxFramework: undefined`。上游 [Park UI](https://park-ui.com) 的 recipe（本项目最初的组件来源，被手工移植到了 `hono/jsx`）恰恰依赖于这个缺失的集成 —— 它们自己的 `switch.ts` 同样也没有 `colorPalette` variant。

多年来，对于一部分组件，这个问题一直是通过**在 recipe 本身上手动声明一个 `colorPalette` variant** 来绕过的（`badge.ts`、`anchor.ts`、`button.ts` 等），把同一份约 11 条的调色板映射复制粘贴进每一个文件。正是这种做法导致了上面的大多数 bug：它很容易在新组件上被遗漏（`switch.ts`/`avatar.ts`/`card.ts`/`checkbox.ts` 就从未加上过，所以它们的 `colorPalette` prop 一直悄悄地什么都不做），也很容易把 slot 与非 slot 两种形式搞错（见第 2 条），并且把同一份调色板名称列表 —— 还带着偏差 —— 分散在了十几个文件里（有些 recipe 手写的映射引用了 `teal`/`indigo`/`pink`/`yellow`，这些调色板名称在本主题的 `app/theme/colors/` 中根本不存在 —— 那些同样会悄悄地什么都不做）。

**目前的模式**（自 `colorPalette` 集中化改造以来）用一个共享的工具函数取代了以上所有做法：

- `panda.config.ts` 的 `staticCss.css` 会为主题中实际定义的每一个真实调色板名称（`gray`/`blue`/`green`/`red`/`orange`/`purple`/`cyan`/`amber` —— 在任何地方新增名称之前，先查看 `app/theme/colors/*.ts` 中当前的列表）强制生成普通的 Panda `colorPalette` utility class（`.color-palette_blue` 等）。
- `app/components/ui/color-palette.ts` 导出 `colorPaletteClass(colorPalette?: string)`，它会解析别名（`success`→green、`error`→red、`warning`→orange、`slate`→gray —— 其中 `slate` 在 CMS 内容中被大量使用，尽管本主题的灰色阶只以 `gray` 注册），并返回正确的 utility class。

**要为一个组件添加 `colorPalette` 支持**（即某个 recipe 引用了 `colorPalette.*` token，但使用方却没有办法真正选择颜色的组件）：

1. **不要**给 recipe 添加 `colorPalette` variant。保持 recipe 中 `colorPalette.*` token 引用原样不变。
2. 在组件的 primitive（`*-primitive.tsx`）中，在任何落到 DOM 节点上的 `...rest`/`...restProps` 展开**之前**，把 `colorPalette` 从 props 中解构出来 —— 和其他任何已知 prop 一样处理 —— 这样它就永远不会作为无效的 `colorpalette="..."` HTML 属性泄漏出去。
3. 如果该组件之前有硬编码的默认颜色，把它保留为解构上的普通 JS 默认值（`colorPalette = "blue"`），而不是 recipe 的 `defaultVariants` 条目。
4. 把 `colorPaletteClass(colorPalette)` 合并进**根/主 slot** 的 class 列表 —— `cx(styles.root, colorPaletteClass(colorPalette), classProp)` —— 使其通过普通的 CSS 自定义属性继承机制向下级联到后代 slot。它只需要加在建立该 scope 的最外层元素上，绝不需要加到每一个 slot 上。
5. 如果该组件是通过 context provider 组合而成的（例如 `ButtonGroup` → 通过 `ButtonContext` → `Button`），要确保 `colorPalette` 被显式地贯穿传递进该 context 值中 —— 它已经不再是 `variantProps` 的一部分，所以任何原本只靠转发 `variantProps` 来传播颜色的地方，都需要手动把 `colorPalette` 加回去。
6. 重新生成（`panda codegen && panda cssgen`）并验证：渲染该组件，在 SSR HTML（或 `design-system/styles.css`）中 grep 期望出现的 `color-palette_<name>` class，并确认没有裸露的 `colorpalette=` 属性泄漏到 DOM 上。

不要为新组件重新引入按 recipe 单独维护的 `colorPalette` variant 映射表 —— 这正是本次集中化改造所取代的模式，原因就是它无法扩展且会悄悄地发生回归。

---

## Token 颜色 vs. 语义 token

- **`tokens.colors`**（`app/theme/tokens/colors.ts`）—— 纯静态值（黑、白）。
- **`semanticTokens.colors`**（`app/theme/index.ts`、`app/theme/colors/*.ts`）—— 自适应调色板色阶（gray/slate、blue、red、green、orange、purple、cyan、amber），每一个都被编译为自动切换的浅色/深色自定义属性。

**避免使用通用的 `bg`/`fg` token** —— 它们在本主题中会编译为透明/无效的 CSS（`panda.config.ts` 中的「Remove Panda Preset Colors」插件剥离了 Panda 的默认颜色预设，而通用的 `bg`/`fg` 从未被替换过）。请改用显式的语义 token：`gray.surface.bg`、`fg.default`、`gray.outline.border` 等。弹窗/下拉菜单/自动补全面板尤其应该使用 `gray.surface.bg`（而不是 `colorPalette.surface.bg`），这样无论触发器上生效的是什么强调色，面板背景都能保持中性的不透明表面。

### 站点全局默认强调色到底在哪里

`app/theme/colors/*.ts` 下的每一个颜色文件（`amber`、`blue`、`cyan`、`green`、`orange`、`purple`、`red`、`slate`）都是一个成型的、开箱即用的 `colorPalette` 选项 —— 形状完全一致（一个 1–12 的色阶、一个 a1–a12 的透明度色阶，以及 `solid`/`subtle`/`surface`/`outline`/`plain` 几个子分组，每个都带有 `bg`/`fg`）。某个颜色存在于该目录中只说明它被生成过（例如项目初始化时由 Park UI CLI 生成），并不说明它在任何地方是*生效*的。

**无论是 Panda 本身，还是 Park UI CLI 的输出（`components.json`），都不会持久保存你在初始化时选择的「那个」强调色** —— 两者都没有对应的配置 key。真正决定站点全局默认值的，只有一行手写的代码：

```ts
// app/theme/global-css.ts
html: {
  colorPalette: "gray",
  // ...
},
```

这一行设置了根 `colorPalette` scope，每一个未设置自己 scope 的元素都会继承它。这只是一条普通的 CSS 声明，很容易被忽略，也很容易被遗忘 —— 如果你曾经疑惑「为什么这个项目用 `gray` 作为强调色，而不是我在初始化时选的 `cyan` 或别的什么」，答案就在这一行；修改它是一处单行、低风险的编辑（每个颜色文件的 token 形状都完全一致，所以替换这个值是一次干净的直接替换）。

**这个默认值只是一个兜底。** 上文已经迁移到集中式 `colorPaletteClass()` 模式的 13 个组件（switch、badge、button、card 等）中的任何一个，都带有**自己**显式的默认值（见该节中按组件列出的清单），不会跟随这一行的修改而变化 —— 只有那些没有自己显式 `colorPalette` 的组件/工具（同样声明在 `global-css.ts` 中的全局 focus-ring/选中态自定义属性，以及任何尚未迁移的 recipe）才真正读取这个根值。

### `fg`/`border`/`canvas` 始终是刻意保持纯灰色的

`fg.default`、`fg.muted`、`fg.subtle`、`border` 与 `canvas`（声明在 `app/theme/index.ts` 的 `semanticTokens.colors` 中）被直接硬编码为 `colors.gray.*` —— **而不是** `colors.colorPalette.*`。这是有意为之，而不是遗漏：这是标准的 Radix/Park UI「一个强调色 + 一个灰色」惯例 —— 正文文字、边框和页面背景必须始终保持中性，无论当前生效的是哪个强调色，这既是为了对比度/可读性，也是为了让强调色读起来像是「点缀」而不是把整个页面都染上颜色。不要「修复」这些 token 让它们引用 `colorPalette.*`，指望它们跟随站点强调色变化；那会是一次回归，而不是改进。只有真正具有交互性/带品牌色的表面（控件的选中态、按钮的实心填充、徽章的背景色……）才应该引用 `colorPalette.*` —— 这一点在每个控件 recipe 中都得到了印证（`switch.ts`、`checkbox.ts`、`badge.ts`、`button.ts`：中性/未选中状态使用硬编码的 `gray.*` token，选中/强调状态使用 `colorPalette.*`）。

---

## 修改任意 recipe 或 `panda.config.ts` 后的验证清单

不要只凭肉眼一瞥就信以为真 —— 上面这些 bug 在仔细检查之前，*看起来*都毫无问题（一个黑色/灰色的元素读起来像是「默认样式」，而不是「坏了」）。

1. `bunx panda codegen && bunx panda cssgen`（在仓库根目录执行 —— 先检查一下 `pwd`；如果在子目录中运行，这些命令不会报错，而是会悄悄把 `design-system/` 写到错误的嵌套位置）。
2. 在生成的 CSS 中 grep 你期望出现的具体 class：`grep "switch__root--size_sm" design-system/styles.css`、`grep "color-palette_blue" design-system/styles.css`。
3. 渲染实际页面（开发服务器或 `bun test`），在 SSR HTML 输出中 grep 同样的 class，并确认*没有*任何原始 prop 名以 DOM 属性的形式泄漏出去（例如 `colorpalette="..."`、`size="..."` 等出现在不该出现的元素上）。
4. `bun test` —— 运行完整的单元测试套件；样式重构之后，一个断言旧 classname 格式的过时测试是常见的误报，在认定是真的回归之前值得先快速读一下测试代码。
5. 对**源**文件（`panda.config.ts`、`app/theme/recipes/*.ts`、`app/components/ui/*.tsx`）执行 `git status`/`git diff` —— 绝不要检查 `design-system/`，它已被 gitignore，会被丢弃。一个「本地能用」但源码从未真正提交的修复，根本不算修复。

---

## FAQ

### 如何修改站点全局默认强调色？

编辑 `app/theme/global-css.ts` 中的一行：

```ts
html: {
  colorPalette: "cyan", // was "gray"
  colorScheme: { _light: "light", _dark: "dark" },
},
```

这个值必须是 `app/theme/colors/*.ts` 下实际存在的调色板名称之一（`amber`、`blue`、`cyan`、`green`、`orange`、`purple`、`red`、`slate` —— 以 `gray` 注册）。这些文件中的每一个都拥有完全相同的 token 形状（`solid`/`subtle`/`surface`/`outline`/`plain`，每个都带有 `bg`/`fg`），所以这是一次干净、安全的替换 —— 不需要同步修改任何其他 token。

然后：

1. 运行 `bunx panda codegen && bunx panda cssgen` 重新生成。
2. 检查结果：`fg`/`border`/`canvas`（正文文字、分隔线、页面背景）**不会**发生变化 —— 它们被刻意硬编码为中性灰色阶，与强调色无关，见上文。只有那些真正由强调色驱动的表面（选中的 switch/checkbox、实心按钮、无 scope 的徽章、focus ring、文本选中态）会应用新的颜色。
3. 请记住，这只改变了**兜底值**。已经迁移到 `colorPaletteClass()` 的 13 个组件中的任何一个（switch、badge、button、anchor、card、checkbox、carousel、clipboard、date-picker、radio-card-group、rating-group）都带有自己显式的、按组件设定的默认值；如果你希望它们也跟随新的站点强调色，而不是继续保留各自当前单独选定的默认值，就需要在各自的 primitive 中手动更新（`app/components/ui/*-primitive.tsx` 里 `colorPalette = "..."` 的解构默认值）。
