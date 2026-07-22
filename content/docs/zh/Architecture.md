---
title: 架构
---

本项目基于 [**HonoX**](https://github.com/honojs/honox) 构建 —— 它是 [Hono](https://hono.dev) 之上的一套元框架，提供了基于文件的路由、服务端/客户端岛屿（islands）以及静态站点生成能力。样式方案采用 [PandaCSS](https://panda-css.com)（类型安全、零运行时 CSS-in-JS）；内容通过 [Sveltia CMS](https://sveltiacms.app)（`/admin/`）进行编辑；整个站点会预渲染为静态 HTML。

| 层级 | 工具 |
| --- | --- |
| 框架 | [HonoX](https://honox.dev) |
| 路由 | 基于文件，位于 `app/routes/` 下 |
| 样式 | [PandaCSS](https://panda-css.com) → `design-system/` |
| 内容 | 位于 `content/` 下的 Markdown / MDX / JSON |
| CMS | [Sveltia CMS](https://sveltiacms.app)，基于 Git，位于 `/admin/` |
| SSG | [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) |
| 部署 | Cloudflare Pages（`wrangler.jsonc`）或 Vercel（`vercel.json`） |

***

## 构建过程：两次 Vite 编译，一个静态站点

`bun run build` 执行的是 `vite build --mode client && vite build` —— 对同一份 `vite.config.ts` 执行两次独立的编译，通过 `mode` 切换：

- **`--mode client`** 负责编译 `app/client.ts`（`honox/client` 中的 `createClient()`），使用的 `jsxImportSource` 为 `"hono/jsx/dom"`。这是浏览器端 bundle：它只负责水合岛屿，不做其他事情。
- **默认（服务端）编译** 负责编译 `app/server.ts`（`honox/server` 中的 `createApp()`），使用的 `jsxImportSource` 为 `"hono/jsx"`（即 SSR 的 JSX 运行时），随后将整个应用交给 [`ssg()`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) 插件，由它爬取每一条路由并将预渲染的 HTML 写入 `dist/`。

### SSG 路由与本地化 URL 修正

为了避免路由编译后静态文件托管出现 404 路由错误，`vite.config.ts` 中的自定义 `fixSsgRoutingPlugin` 会递归处理构建产物（`dist/`）中的全部 `.html` 文件。它会将本地化的索引/首页文件（例如 `zh.html`、`docs/fr.html`）重命名并移动到嵌套的干净路径（`zh/index.html`、`docs/fr/index.html`）下 —— 只要存在匹配的目录，或文件名对应某个受支持的 locale。这样可确保 `/zh` 及其他本地化端点在任意静态托管上都作为目录索引被正确解析。

### 测试环境解析

为了在 Bun 中为 Hono JSX 组件运行单元测试，`bunfig.toml` 中专门配置了如下内容：

```toml
[jsx]
runtime = "classic"
pragma = "h"
fragment = "Fragment"
importSource = "hono/jsx"
```

这保证了标准的 Hono 运行时解析，并避免测试执行期间出现 JSX 开发运行时缺失的错误。

`mdx()` 插件的作用范围被限定为仅 `include: /\.mdx$/`（即只对 `.mdx` 生效）—— 普通的 `.md`（博客文章、绝大多数文档）被刻意排除在外，以免 `app/utils/markdown.ts` 中通过 `?raw` 导入的内容被 MDX 转换破坏。

***

## 基于文件的路由

路由位于 `app/routes/` 下，在 `app/server.ts` 中通过 `import.meta.glob` 扫描 `**/*.{ts,tsx,md,mdx}` 进行注册，同时排除 HonoX 的私有文件约定（`_*`, `-*`, `$*`）以及测试文件。一个路由文件可以导出处理器（`GET`、`POST` …）或默认导出一个组件；`[slug].tsx` / `[[slug]].tsx` 提供动态/可选路径段，遵循 HonoX 自身的路由约定。

### 自定义静态 API 路由

在 HonoX 中，导出标准路由并返回 `c.json(...)` 的自定义静态 API 路由（例如 `app/routes/api/posts.json.ts`），会在 SSG 构建期间由 `@hono/vite-ssg` 插件自动编译为静态 JSON 文件（例如 `dist/api/posts.json`）。这类静态端点无需配置动态参数。

### 通过 ssgParams 预渲染动态路由

任何动态路由（例如 `/blog/by-author/[author].tsx`）都需要在路由定义中实现并导出 `ssgParams` 中间件，以声明用于构建时预渲染的全部潜在参数值。

### 本地化路由与历史重定向

面向可翻译集合（`docs`、`blog`、`pages`）的路由遵循 `/<collection>/<locale?>/<item>`，默认 locale（`en`）不占用路径段：

```plain
/docs/AbsoluteCenter        (en)
/docs/fr/AbsoluteCenter     (fr)
/blog/my-post               (en)
/blog/zh/my-post            (zh)
```

与 locale 无关的**语言首页**位于裸 locale 路径段（`/fr`、`/zh` …）。以上这一切都集中在 `app/lib/i18n.ts`（`detectLocale`、`localiseHref`、`stripLocale`、`localeToggleUrl`）中统一管理 —— 没有哪个路由文件需要手写 locale 逻辑。一种历史路由形态 `/<locale>/<collection>/<item>` 会被 `app/server.ts` 中的中间件 301 重定向到当前形态，从而旧的收藏夹/链接依然有效。

受支持的 locale 在 `ALL_LOCALES` / `TRANSLATED_LOCALES`（`app/lib/i18n.ts`）中一次性声明 —— 该列表必须与 `public/admin/config.yml` 的 `i18n.locales` 以及镜像的 `app/routes/<locale>/` 路由目录保持同步。

***

## 组件架构

代码库在 `app/` 下维护着两棵平行的树：

- **`app/components/ui/`** —— 公开的组件 API（约 100 个组件）。
- **`app/islands/`** —— 客户端水合的对应实现，每个可交互组件一个，会被打包进客户端 bundle 并由 `honox/client` 挂载。

### 零 Hook 的服务端安全

为了确保静态站点生成万无一失，**所有客户端响应式 hook（`useEffect`、`useRef`、`useState`，来自 `hono/jsx`）都被严格限制在 `/islands/` 目录内**。`/components/ui/` 目录下的文件保持完全无 hook，对服务端静态渲染/SSR 安全。使用引用转发的静态包装组件（如 `components/ui/` 中的 `Dialog` 和 `Drawer`）采用静态的普通对象回退（`{ current: null }`）代替 `useRef`，以避免在服务端执行客户端 hook。

### 安全的跨岛屿样式解析

像 `HoverCard` 这样跨 HonoX 岛屿边界渲染子元素的多部件组件，必须在其原始（primitive）子组件中实现安全的回退样式解析（例如 `context?.styles || recipe()`），以确保类名在预渲染的 SSR/SSG 状态以及水合后的客户端状态下都得到完整填充。

### 浮层定位与交互技巧

- **正确定位：** `Popover` 和 `HoverCard` 的根组件包装器（静态与交互/岛屿两种实现均如此）使用内联样式 `position: 'relative'` 与 `display: 'inline-block'`。这可以防止它们占据块级行内空间，并使其绝对定位的浮层内容相对触发器正确定位。
- **焦点管理：** 在 `app/components/ui/popover-primitive.tsx` 中，`InteractivePopoverRoot` 使用一个 `isFirstRender` ref，以确保当浮层关闭时，`closePopover` 不会在初次渲染/挂载时聚焦触发器元素，从而避免页面加载时出现意外的自动聚焦。
- **指针事件穿透：** 为了防止在大块可点击父元素（如卡片或轮播幻灯片）内部出现锚点标签（`<a>`）的非法 HTML 嵌套，浮层文本容器被构造成 `pointer-events: none`，而目标嵌套的 `<Anchor>` 或 `<a>` 元素则应用 `pointer-events: auto`。

### 高级组件机制

- **交互式菜单组件（`app/islands/menu.tsx`）：** 通过动态重新计算并重新定位下拉容器（经由 `updatePosition()`）来处理窗口滚动与缩放事件，确保其始终锚定在触发器上。它支持受控的打开状态（`open` 与 `onOpenChange`）、由经典与 kebab-case 配置映射而来的放置位置（带边界碰撞检测），以及可自定义的触发器动作（带悬停进入/离开定时器）。
- **简化版菜单 API（`app/components/ui/menu.tsx`）：** 在遇到类型为 `"submenu"` 的菜单项时递归渲染级联子菜单，显示 chevron 图标并利用嵌套的复合 `Menu` 原语。它对外暴露 `Menu.Arrow`、`Menu.ArrowTip` 和 `Menu.TriggerItem` 作为复合子组件。
- **VDOM 节点引用检查：** 为了在 Hono JSX 中正确检查子组件（如 `Trigger` 内部的 `MenuTriggerItem`）的 VDOM 节点引用，代码会同时检查 `child.tag` 与 `child.type`，因为在经典 JSX 编译下，经典 JSX 函数节点会被映射到 `tag` 而非 `type`。
- **DatePicker：** 支持通过 `picker` 属性（`"date" | "month" | "year"`）使用细粒度视图，并顺畅地将尺寸与变体映射到 Panda CSS 的 token 配置。它通过 `classNames` 与 `styles` 属性，对特定内部元素（如 label、control、input、positioner、clearTrigger）支持深层自定义语义样式。
- **Tabs 组件：** 已完整移植到 Hono/JSX。静态 SSR 布局原语定义在 `app/components/ui/tabs-primitive.tsx`，而急切交互的客户端岛屿包装器 `app/islands/tabs.tsx` 负责活动状态、通过 `ResizeObserver` 进行的指示器追踪，以及标准的 ARIA/键盘导航规则。它将 Ant Design 风格属性（`activeKey`、`defaultActiveKey`、`onChange`、`onTabClick`、尺寸与类型）映射到下层原语。
- **Select 组件：** 在计算 slot 类名之前，将传统框架的输入（如 `size="small"`/`"medium"`/`"large"` 与 `variant="outlined"`/`"flushed"`）动态映射到标准的 Panda CSS 刻度（`sm`/`md`/`lg` 与 `outline`/`underlined`），以确保跨框架兼容。它已增强为支持通过 `showSearch` 属性在 dropdown 列表内进行客户端搜索/筛选，以及在多选模式下将已选项渲染为可交互、可关闭的 Tags（可通过 `tagRender` 自定义）。
- **PinField 组件：** 由静态 SSR 原语（`app/components/ui/pin-field-primitive.tsx`）与交互式岛屿（`app/islands/pin-field.tsx`）共同实现。它将 `value` 与 `defaultValue` 归一化以同时支持字符串与数组类型，默认 `selectOnFocus` 为 `true`，支持 `autoSubmit` 表单提交，通过移除空格与连字符来净化粘贴字符，并处理 RTL 键盘导航。
- **网格布局系统：** 通过 `Row` 与 `Col` 组件提供高性能的 24 列 flexbox 容器，将响应式断点设置（如 `xs`、`sm`、`md`、`lg`、`xl`、`xxl`）映射到标准的 Panda CSS 断点。Row 将静态、数组式和响应式间距映射为 Panda CSS 间距简写输出（`cg` 与 `rg`），而 Col 则将响应式属性与断点对象动态转换为匹配的设计系统类。
- **扁平化网格布局：** `app/components/ui/grid.tsx` 中扁平的 `Grid` 与 `GridItem` 布局组件基于 Panda CSS 的原生布局模式，支持通过 `columns` 与 `rows` 进行二维控制。这些模式已在 `panda.config.ts` 的 `staticCss.patterns`（`grid` 与 `gridItem`）中注册，并在 Sveltia CMS 的 `config.yml` 的 `pages` 下递归绑定，从而无需嵌套的 Row/Col 元素即可简化多列布局。响应式断点支持 JSON 字符串化的响应式对象（例如 `"columns": "{\"base\": 1, \"md\": 3}"`）。
- **布局网格配方：** `row` 与 `col` 的布局网格配方被以编程方式编译为静态、离散的变体（跨度、偏移、0 到 24 的排序），并注册到 `panda.config.ts` 的静态 CSS 中，以支持 Sveltia CMS 与 PageRenderer 内的静态页面布局嵌套，无需动态 JavaScript 水合。
- **集中式 SVG 图标目录：** 代码库使用位于 `app/icons/*` 的、可单独复用的 SVG 图标组件（如 `CloseIcon`、`ChevronDownIcon`、`CheckIcon` 等），它们接受 `JSX.IntrinsicElements["svg"]` 以转发 `width`、`height` 以及自定义样式等属性。原本散落在各 UI 组件与路由中的硬编码内联 SVG 已被重构为从此集中图标目录导入，以提升代码复用并避免重复。

***

## 内容流水线与 i18n

`content/` 下的所有内容都会在构建时通过 Vite 的 `import.meta.glob` 被发现，并由 SSG 预渲染。

### CMS 集合分区

仓库将文档内容划分为 `public/admin/config.yml` 中定义的两种不同 CMS 集合：

- `"docs"`：位于 `/content/docs/` 下、以 `.md` 文件形式存在的指南。
- `"components"`：位于 `/content/components/` 下、以 `.mdx` 文件形式存在的组件参考。

Sveltia CMS 的管理编辑页链接格式为 `/admin/#/collections/[docs|components]/entries/[slug]`。

### 水合分类模型

仓库采用三层水合分类模型，经由 Sveltia CMS 的 frontmatter 配置，并在 [Hydration](/docs/Hydration) 中记录：

- **“急切交互”（第一层）：** 默认作为客户端岛屿急切水合。
- **“智能自适应”（第二层）：** 基于行为信号有条件水合。
- **“零 JS 静态”（第三层）：** 纯静态组件，无水合 JS。

### i18n 与新增翻译 locale

Sveltia CMS 在 `public/admin/config.yml` 下配置了国际化（i18n），支持 `en`、`zh`、`es`、`pt`、`fr` 与 `de` 等 locale，默认 locale 为英语（`en`）。它使用 `multiple_folders` 结构并开启 `omit_default_locale_from_file_path: true`：默认 locale 文件保留在原始根路径，翻译文件则放在 locale 子文件夹下（针对 docs/components），或采用 `.<locale>` 后缀（针对 configs 与 posts）。

要向仓库新增一个翻译 locale，请遵循以下分步流程：

1. **CMS 配置：** 将 locale 代码（如 `fr` 或 `de`）添加到 `public/admin/config.yml` 的 `i18n.locales` 部分。
2. **翻译键：** 在 `content/configs.<locale>.json` 下创建一份匹配的配置文件，包含本地化的翻译键。
3. **语言切换器注册：** 在 `app/components/language-switcher.tsx` 的 `ALL_LOCALES` 与 `LOCALE_NAMES` 中注册 locale 代码及其人类可读名称。
4. **文档加载器数组：** 将 locale 代码添加到 `app/lib/docs.ts` 的 `LOCALES` 数组。
5. **路由再导出：** 创建与根路由文件结构一致的目录 `app/routes/<locale>/`，重新导出标准路由。
6. **翻译：** 在 `content/docs/<locale>/*.md` 与 `content/components/<locale>/*.mdx` 下，分别提供 markdown/MDX 文档与组件参考的翻译。

***

## 样式

[PandaCSS](https://panda-css.com) 会提前生成全部 CSS —— 没有运行时样式引擎。`panda.config.ts` 从 `app/theme/` 扩展基础主题，扫描 `app/**/*.{js,jsx,ts,tsx}` 以发现样式用法，并将生成的系统（recipes、tokens、patterns、JSX 辅助函数）写入 `design-system/`，组件通过 `design-system` 这个 Vite 别名从中导入。

### 槽位配方设计与多部件组件

多部件组件（如 `RadioGroup`、`SegmentGroup`、`Tabs`、`ToggleGroup`、`Select`、`Avatar`、`Pagination`、`HoverCard`）的主题配方，必须在 `defineSlotRecipe` 中将 `slots` 显式定义为字符串数组，而不是从 `@ark-ui/react/anatomy` 或 `@ark-ui/anatomy` 导入，以消除样式层对 React 的依赖。

使用 `defineSlotRecipe` 的多部件组件必须在 `app/theme/recipes/index.ts` 的 `slotRecipes` 中注册，并在 `panda.config.ts` 的 `staticCss.recipes` 中显式包含（例如 `radioGroup: ['*']`、`select: ['*']`、`tabs: ['*']`），以确保 `size` 等所有变体都能为 Hono 岛屿正确生成。

### 自定义配方命名冲突

将自定义配方命名为 `stack` 会与 Panda CSS 内置的布局模式冲突，从而在 `codegen` 期间触发警告，但该配方仍可正常工作。

### Token 颜色与语义 Token

在本项目的 PandaCSS 设计系统中：

- **Token（`tokens.colors`）：** 纯静态颜色（如黑色与白色）在 `app/theme/tokens/colors.ts` 中以原始值定义。
- **语义 Token（`semanticTokens.colors`）：** 条件式或自适应的色阶调色板（如 slate/gray、blue、red 等）在此声明，以实现自动的浅色与深色模式变量编译。

### 显式语义 Token 使用准则

在 Panda CSS 配置与自定义样式中，**避免使用通用的颜色 token（如 `bg` 与 `fg`）**（它们会编译为透明/无效的 CSS）。应改用显式的语义 token，例如 `gray.surface.bg`、`fg.default` 与 `gray.outline.border`，以保持正确的主题状态。
此外，在给弹窗浮层、下拉列表或自动补全组件（如 `app/islands/search.tsx`）设置样式时，使用语义背景 token `gray.surface.bg`，以确保浅色/深色模式下都有不透明背景，避免文字重叠。

***

## CMS

[Sveltia CMS](https://sveltiacms.app) 完全在客户端运行，位于 `/admin/`，由 `public/admin/config.yml` 配置。`app/server.ts` 直接将该目录的静态文件（配置、HTML、资源）从 `public/admin/` 提供，而不经过普通路由，因此 CMS UI 在开发与部署后表现完全一致。它基于 Git：在 CMS UI 中所做的编辑会直接提交到 `content/` 下的内容文件，下一次构建会像处理其他变更一样拾取它们。

***

## 开发工具与完整性

### Node 与 Bun 命令

要搭建开发环境、安装依赖并运行 PandaCSS 代码生成：

```bash
bun install
```

要运行本地开发服务器（Vite，默认端口 5173）：

```bash
bun run dev
```

要构建静态站点产物（`dist/`）：

```bash
bun run build
```

### 主动式单元测试

要运行代码库单元测试：

```bash
bun test unit
```

_注意：始终使用 `bun test unit` 运行单元测试，以绕开依赖外部重型包（如 `@playwright/test`）的集成测试可能引发的依赖缺失失败。_

### Biome Linter 与代码质量

仓库使用 **Biome** 进行代码 lint 与格式化。为确保 `bun run check` 与 `bun run fix` 能以退出码 0 成功执行，那些在标准动态组件属性上会产生误报的、限制性强且噪音极高的规则，已在 `biome.json` 中显式关闭。这些规则包括：

- `useExportsLast`
- `useAriaPropsSupportedByRole`
- `noLabelWithoutControl`
- `useSemanticElements`
- `noNoninteractiveElementToInteractiveRole`

### 限制 React 取向的 CLI

在本仓库中直接运行 React 取向的 CLI 命令（如 `@park-ui/cli`）会用 React 特定的模型覆盖自定义的 Hono/JSX 实现与槽位配方，从而破坏 HonoX 的 SSG/岛屿模型。在运行外部组件安装脚本之前，务必先核对现有代码库文件。

***

## 部署

构建产物（`dist/`）是一个完全静态的站点 —— 请求时无需任何服务端进程。开箱即用地配置了两类目标：

- **Cloudflare Pages**（`wrangler.jsonc`）—— `assets.directory` 指向 `dist/`；`bun run deploy` 先构建，再运行 `wrangler pages deploy ./dist`。
- **Vercel**（`vercel.json`）—— 相同的构建命令，`outputDirectory: "dist"`，`cleanUrls: true`（因此 Vercel 自身的 clean-URL 重写与 `fixSsgRoutingPlugin` 的目录索引修正互为补充）。

`bun run preview`（`wrangler dev`）通过 Cloudflare 的本地运行时在本地提供构建好的 `dist/`，这与 `bun run dev`（`vite`）不同 —— 后者运行带有 HMR 的实时 HonoX 开发服务器。
