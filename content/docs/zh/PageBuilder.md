---
title: CMS 页面构建器
---

## 简介

基于 [Sveltia CMS](https://sveltiacms.app/en/docs/intro) 的动态页面构建器允许非技术编辑人员完全通过 CMS 用户界面（`/admin/`）创建复杂的、递归嵌套的页面。

页面布局以 JSON 文件形式保存在 `content/pages/*.json` 中，并按需编译，或通过 Hono SSG 在 `/pages/[slug]` 处静态预生成。

***

## 支持的组件

页面构建器支持丰富的调色板，包含 40 多个布局、排版、装饰和交互组件。

### 1. 结构与布局

* **Stack**：将子元素按垂直或水平方向分组，并可控制对齐、主轴分布和间距（gap）。
* **Grid**：响应式 CSS Grid 布局 —— 固定列数/行数，或按子元素最小宽度自动适配（auto-fit）。
* **Group**：将按钮等元素紧密排列在一起（支持 `attached` 和 `grow` 属性）。
* **Fieldset**：在带样式的容器内组织相关表单组件，包含 `legend`、`helperText` 和 `errorText`。
* **AbsoluteCenter**：在父元素内沿单轴或双轴居中单个嵌套块。
* **Splitter**：由拖拽手柄分隔的可调整大小面板。在页面构建器中始终渲染为静态（面板内容无法跨越岛屿水合边界）。
* **Breadcrumb**：带可自定义分隔符的链接项导航路径。

### 2. 排版与内容

* **Heading**：级别为 `h1` 至 `h6` 的样式化标题，以及多种响应式文本尺寸。
* **Text**：可调整尺寸的段落级文本。

### 3. 显示与展示

* **Alert**：渲染警告/成功/错误/信息类告警框，带有标准状态和图标。
* **Badge**：带自定义调色板和样式的彩色元数据标签。
* **Card**：富容器，支持嵌套块、页眉、页脚以及上/下/左/右图片位置。
* **Progress**：渲染线性或环形进度指示器。
* **Skeleton**：高度可定制的占位骨架（支持圆形和多行文本形状）。
* **Loader** / **Spinner**：加载指示器，可选附带文字。
* **Table**：带可配置列和 JSON 编码行数组的静态表格数据。
* **Icon**：带有尺寸/颜色控制的原始内联 SVG 标记。

### 4. 交互与浮层

* **Button**：主点击目标，支持自定义调色板、尺寸和样式变体。
* **Checkbox**：带无障碍 aria 绑定的布尔输入勾选框。
* **Combobox**：带清除操作和条目列表的下拉框。
* **Collapsible**：显示/隐藏嵌套组件树的折叠容器。
* **Popover**：锚定到标准文本触发器的浮动描述内容。
* **Tooltip**：悬停/聚焦时锚定到触发器按钮的上下文提示文本。
* **HoverCard**：比 Tooltip 更丰富的悬停触发内容，带可选标题/描述。
* **Dialog**：完全焦点陷阱的模态框，带自定义确认/取消按钮和自定义子元素列表。
* **Drawer**：从页面边缘滑入的响应式侧边面板，带自定义子元素列表。
* **Dropdown**（块类型 `menu`）：带自定义可勾选、可选项和分隔符选项的操作菜单。

### 5. 高级与数据

* **Select**：可提交的自定义单选/多选下拉框。
* **DatePicker**：带弹出日历的单选/多选/区间日期选择。
* **TagsField**：自由格式的字符串标签列表。
* **RadioGroup** / **RadioCardGroup**：带无障碍单选逻辑的自定单选列表。
* **SegmentGroup**：用于选项卡选择的滑动分段控件。
* **Slider**：范围滑块组件。
* **Switch**：开关切换。
* **Editable**：行内点击编辑文本。
* **ColorPicker**：带 hex/RGBA/HSLA 输入的饱和度/色相/透明度颜色选择器。
* **FileUpload**：拖拽或点击浏览的文件选择。
* **Carousel**：自动播放或手动控制的图片轮播。
* **PaginatedTable**：支持分页的交互式动态表格组件。
* **Pagination**：交互式页码控制器。

***

## 架构

### 1. CMS Schema 定义（`public/admin/config.yml`）

我们利用高级 **YAML 锚点与别名**（`&` 和 `*`）来解决 YAML 规范中无限递归的挑战。

* **基础锚点**（`button_fields`、`checkbox_fields` 等）只声明一次。
* **一级组件**定义扁平元素，以及一个支持 **二级组件**（`*l2_components`）的 `Stack`/`Collapsible` 容器。
* **二级组件**递归地允许再嵌套一层容器（`*l3_components`）。
* 这使得编辑人员最多可嵌套 **4 层**布局，而不会超出 YAML 解析器 / CMS 的限制。

### 2. 布局渲染器（`app/components/page-renderer.tsx`）

布局引擎从 `app/components/ui/` 导入所有公共组件模块，并映射到一个高性能、完全类型安全的 JSX 编译器中。

* 输入类型被强转为标准的 `unknown` 记录字典，以防止类型强制转换并保持 Biome lint 检查完全干净。
* 嵌套容器通过嵌套调用 `<PageRenderer content={...} />` 组件来递归处理。

***

## 内容构建流水线

页面构建器布局是 `content/` 下三种内容类型之一，每种都通过 Vite 的 `import.meta.glob` 被发现并由各自的路由渲染。三种类型都以相同的方式静态生成：路由的 `ssgParams` 中间件在构建时枚举其集合中的每个文件，而 `bun run build`（经由 `@hono/vite-ssg`）爬取这些参数，为每个 slug 预渲染一份静态 HTML 文件到 `dist/`。

### 1. JSON 页面布局（`content/pages/*.json`）

* 在 `app/routes/pages/[slug].tsx` 中通过 `import.meta.glob("/content/pages/*.json", { import: "default" })` 加载。
* 每个文件作为纯 JSON 解析 —— 不涉及 markdown —— 其 `content` 数组直接交给 `<PageRenderer />`（见上文架构），由其递归编译为对应的 UI 组件。
* 这是三种流水线中唯一没有单独解析/编译步骤的：JSON 本身就是渲染树。

### 2. 纯 markdown（`content/posts/*.md`、`content/docs/*.md`）

* 通过 `import.meta.glob(..., { query: "?raw", import: "default" })` 加载，该方式将原始 markdown 源码作为字符串返回，而非编译后的模块。
* 在请求/构建时由 `app/utils/markdown.ts` 解析，这是一个 `remark`/`rehype` 流水线（`remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-stringify`）：`parseFrontmatter()` 将 YAML frontmatter 块与正文分离，`markdownToHtml()` 将正文转换为 HTML 字符串。
* 生成的字符串经由 `dangerouslySetInnerHTML` 注入（见 `app/lib/posts.ts` 和 `app/lib/docs.ts`）—— 不涉及 JSX，因此该流水线无法嵌入活动组件。
* 博客文章还会将其正文通过 `stripMarkdown()` 处理，以构建 `/api/*/search.json` 的纯文本搜索素材（haystack）。

### 3. MDX 文档（`content/docs/*.mdx`）

* 由 `@mdx-js/rollup` Vite 插件在构建前编译（配置于 `vite.config.ts`，限定为 `.mdx`，因此不会拦截上述原始 `.md` 导入），使用 `remark-frontmatter` + `remark-mdx-frontmatter` + `remark-gfm`。
* 每个 `.mdx` 文件成为一个真正可导入的组件（外加独立的 `frontmatter` 导出），在 `app/lib/docs.ts` 中通过普通的（非 `?raw`）`import.meta.glob` 加载。
* 由于输出是组件而非 HTML 字符串，`.mdx` 文档可直接在正文中嵌入实际渲染的交互式示例（例如活动的 `<Button>` 演示）—— 其代价是需要普通 `.md` 所不需要的构建时编译步骤。

`app/lib/docs.ts` 将 `.md` 和 `.mdx` 两个集合并排加载并合并为一个侧边导航，因此某篇文档使用哪种流水线对读者而言是实现细节 —— 纯散文选 `.md`，只有当页面需要嵌入活动组件时才用 `.mdx`。

***

## 示例 JSON 结构

以下是一个代表复杂仪表盘页面的示例布局文件（`content/pages/dashboard.json`）：

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
