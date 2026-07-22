---
title: 水合
---

本项目采用 [HonoX](https://github.com/honojs/honox) 的 **岛屿水合（IslandsHydration）** 架构以及 [**@hono/vite-ssg**](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) 进行页面的静态站点生成（SSG）。默认输出 **静态 HTML**，只有真正需要客户端交互的组件才会被“提升”为岛屿（即客户端 JS 片段）。

> 每个组件的水合行为都经由 `app/components/ui/island-utils.ts` 中的 `shouldHydrate` 谓词统一收敛。任何关于 _何时渲染静态 HTML_ 与 _何时挂载客户端岛屿_ 的决策都在这里完成 —— 完整的分层模型、决策规则以及逐组件分类详见 [Hydration](/docs/Hydration)。

1. **零冗余 JS** —— 无需交互的组件绝不发送水合脚本。
2. **零静默失效** —— 确实需要交互的组件应当自动水合，即使调用方忘记传入 `interactive`。
3. **单一事实来源** —— 每一个“该组件是否应该水合？”的决策都经由同一个共享的 `shouldHydrate` 函数，从而消除各组件中临时的 `if (interactive)` 分支。

## 核心谓词

`app/components/ui/island-utils.ts`：

```ts
/**
 * 决定某个组件是否应当作为客户端岛屿进行水合。
 *
 * @param interactive - 组件的 `interactive` 属性（boolean | undefined）
 * @param hasSignal   - 组件是否携带“行为信号”：事件处理器
 *                      （onClick / onValueChange …）或受控/默认值状态
 *                      （value / checked / open …），这些只有在 JS 下才有意义。
 *
 * 语义：
 *  - interactive === false → 永不水合（显式退出）
 *  - interactive === true  → 总是水合（显式启用）
 *  - 省略 interactive        → 当且仅当 hasSignal 为 true 时水合
 */
export function shouldHydrate(interactive: unknown, hasSignal: boolean): boolean {
	return interactive !== false && Boolean(interactive || hasSignal);
}
```

### 真值表

| `interactive` | `hasSignal` | 结果 | 含义 |
| --- | --- | --- | --- |
| `false` | 任意 | `false` | 显式禁止水合（纯静态） |
| `true` | 任意 | `true` | 显式强制水合 |
| `undefined` | `true` | `true` | 智能检测：存在信号 → 水合 |
| `undefined` | `false` | `false` | 智能检测：无信号 → 静态 |

***

## 三层模型

### 第一层 —— 自动交互

> **核心规则：`shouldHydrate(interactive, true)`**

这些组件本身就是交互 —— 其全部价值都依赖客户端 JS（浮层、模态框、拖拽手柄、展开/折叠）。除非调用方显式传入 `interactive={false}`，否则它们都会水合。

适用于：

- 浮层 / 弹出层系列（tooltip、hover-card、popover、menu）
- 模态框 / 抽屉 / 拖拽（dialog、drawer、splitter）
- 展开 / 折叠（collapsible）
- 纯客户端单例（toast）

### 第二层 —— 智能自动检测

> **核心规则：`shouldHydrate(interactive, hasSignal)`**

这些组件默认是静态的，只有在存在信号时才变为交互。它们是**受控/非受控表单控件或可选组**：只有在提供了状态（`value` / `checked` / `open` …）或处理器（`onChange` / `onClick` …）时，水合才有意义；否则静态标记已足够。

适用于：

- 表单控件（button、checkbox、switch、textarea、field、slider、combobox、radio-group）
- 可选组（segment-group、toggle-group）
- 带行点击的表格（table）
- 带 `src` 的 avatar（异步图片加载 / 错误生命周期属于仅客户端的线索）
- 分页 / tags-input（状态 + 处理器；提供 `getPageUrl` 的 `type="link"` 分页属于纯导航，保持静态）

### 第三层 —— 展示型

> **永不挂载岛屿**

纯排版 / 装饰性组件，没有任何客户端行为。它们**不得声明** `interactive` **属性**（历史上 `badge` / `heading` / `text` / `fieldset` 曾错误地声明了该属性并将其泄漏到 DOM 上 —— 现已移除）。

适用于：

- 排版（text、heading、badge）
- 布局（group、absolute-center、fieldset）
- 状态指示（alert、breadcrumb、loader、skeleton、spinner、progress）
- 图形（icon）

***

## 完整组件分类

> 状态图例：`✅` 符合约定；`⚠️` 偏离约定，需要迁移（见第 7 节）。经过最近一次清理，目前\*\*所有组件均为 `✅`\*\*。

### 第一层（自动交互）

| 组件 | 规则 | 触发条件 | 状态 |
| --- | --- | --- | --- |
| `dialog` | `shouldHydrate(interactive, true)` | 除非 `interactive={false}`，否则始终水合 | ✅ `dialog.tsx` |
| `drawer` | `shouldHydrate(interactive, true)` | 除非 `interactive={false}`，否则始终水合 | ✅ `drawer.tsx` |
| `splitter` | `shouldHydrate(interactive, true)` | 除非 `interactive={false}`，否则始终水合 | ✅ `splitter.tsx` |
| `tooltip` | `shouldHydrate(interactive, true)` | 始终水合 | ✅ `tooltip.tsx` |
| `hover-card` | `shouldHydrate(interactive, true)` | 始终水合 | ✅ `hover-card.tsx` |
| `popover` | `shouldHydrate(interactive, true)` | 始终水合 | ✅ `popover.tsx` |
| `menu` | `shouldHydrate(interactive, true)` | 始终水合 | ✅ `menu.tsx` |
| `select` | `shouldHydrate(interactive, true)` | 始终水合 —— 展开下拉并选择项都需要 JS；没有静态回退（原生 `<select>` 被隐藏，仅用于表单提交） | ✅ `select.tsx`（第一层） |
| `collapsible` | `shouldHydrate(interactive, true)` | 始终水合（展开/折叠需要 JS） | ✅ `collapsible.tsx`（第一层） |
| `toast` | 始终为岛屿（客户端单例） | 无属性，始终为岛屿 | ✅ `toast.tsx` |

### 第二层（智能自动检测）

| 组件 | 行为信号（以下情况 `hasSignal` 为 true） | 状态 |
| --- | --- | --- |
| `button` | `onClick` / `onPointerDown` / `onSubmit` | ✅ `button.tsx` |
| `card` | `onClick` / `onPointerDown` | ✅ `card.tsx` |
| `table` | 任意 `row.onClick` | ✅ `table.tsx` |
| `segment-group` | `value` / `defaultValue` / `onValueChange` | ✅ `segment-group.tsx` |
| `toggle-group` | `value` / `defaultValue` / `onValueChange` | ✅ `toggle-group.tsx` |
| `slider` | `value` / `defaultValue` / `onChange` / `onDraggingChange` | ✅ `slider.tsx` |
| `checkbox` | `checked` / `defaultChecked` / `onCheckedChange` | ✅ `checkbox.tsx` |
| `switch` | `checked` / `defaultChecked` / `onCheckedChange` | ✅ `switch.tsx` |
| `textarea` | `value` / `defaultValue` / `onValueChange` / `validator` / `minLength` | ✅ `textarea.tsx` |
| `field` | `value` / `defaultValue` / `onValueChange` / `validator` / `minLength` | ✅ `field.tsx` |
| `combobox` | `open` / `inputValue` / `onToggle` / `onInputChange` / `onItemSelect` | ✅ `combobox.tsx` |
| `radio-group` | `value` / `defaultValue` / `onValueChange` | ✅ `radio-group.tsx` |
| `avatar` | `src`（异步图片加载 / 错误生命周期） | ✅ `avatar.tsx`（第二层） |
| `pagination` | `onPageChange`，或非 link 模式的 `page` / `defaultPage` / `pageSize` / `defaultPageSize` | ✅ `pagination.tsx` |
| `tags-input` | `onValueChange` / `onInputValueChange` / `value` / `inputValue` / `defaultValue` / `defaultInputValue` | ✅ `tags-input.tsx` |
| `paginated-table` | 始终为岛屿（管理内部分页状态） | ✅ `paginated-table.tsx`（第二层逻辑） |
| `date-picker` | `value` / `defaultValue` / `focusedValue` / `open` / `defaultOpen` / `onValueChange` / `onOpenChange` /（键盘/点击/输入事件） | ✅ `date-picker.tsx` |
| `color-picker` | `value` / `defaultValue` / `format` / `defaultFormat` / `open` / `defaultOpen` / `onValueChange` / `onFormatChange` / `onOpenChange` /（指针/键盘/输入事件） | ✅ `color-picker.tsx` |

### 第三层（展示型）

| 组件 | 说明 | 状态 |
| --- | --- | --- |
| `text` | 排版文本 | ✅ |
| `heading` | 标题 | ✅ |
| `badge` | 徽章 | ✅（已移除无效的 `interactive` 属性） |
| `fieldset` | 表单字段集 | ✅（已移除无效的 `interactive` 属性） |
| `alert` | 警告框 | ✅ |
| `breadcrumb` | 面包屑 | ✅ |
| `group` | 布局分组 | ✅ |
| `absolute-center` | 居中布局 | ✅ |
| `loader` | 加载指示器 | ✅ |
| `skeleton` | 骨架屏 | ✅ |
| `spinner` | 旋转指示器 | ✅ |
| `progress` | 进度条（由值驱动，默认静态） | ✅ |
| `icon` | SVG 图标包装（仅控制尺寸/颜色，无客户端状态） | ✅ `icon.tsx` |

***

## 各层触发条件

### 第一层条件

- 组件的核心交互（打开浮层、拖拽分隔条、展开/折叠、模态框焦点陷阱）**无法用纯 HTML 表达**，因此 `hasSignal` 默认为 `true`。
- 唯一合法的退出方式是 `interactive={false}`（例如在纯静态文档中强制禁用某个浮层）。
- `toast` 特殊：它是一个全局客户端单例（`toaster.create(...)`），不暴露 `interactive` 属性。

### 第二层条件

每个组件的 `hasSignal` 是“该属性是否已定义？”的布尔 OR：

```typescript
// 典型模式（以 segment-group 为例）
const hasSignal =
	rest.value !== undefined ||
	rest.defaultValue !== undefined ||
	rest.onValueChange !== undefined;
if (shouldHydrate(interactive, hasSignal)) return <SegmentGroupIsland {...rest} />;
return <Root {...rest}>{/* 静态结构 */}</Root>;
```

决策原则：

1. **受控状态**（`value` / `checked` / `open` / `inputValue`）→ 需要 JS 保持同步。
2. **非受控初始值**（`defaultValue` / `defaultChecked`）→ 需要 JS 持有内部状态。
3. **事件处理器**（`onChange` / `onClick` / `onValueChange` / `onItemSelect` …）→ 需要 JS 响应。
4. **校验 / 约束**（`validator` / `minLength`）→ 需要 JS 执行。
5. **异步 / 仅客户端线索** —— `avatar` 上的 `src`（意味着加载/错误生命周期），或任何唯一用途是产生客户端副作用的属性（媒体、交叉观察、懒加载）。这些无法脱离 JS 解决，因此计为信号。
6. 上述任意一项存在都会使 `hasSignal` 为 true，从而触发水合；若全部缺失，则组件渲染为纯静态标记。

> **`avatar` 在第二层组件中较为特殊：** 它的信号是异步加载线索 `src`。当存在 `src` 时，图片需要客户端加载/错误处理，因此 `shouldHydrate(interactive, Boolean(src))` 会对其水合；没有 `src` 的 `avatar`（例如首字母回退）保持静态。即使存在 `src`，显式的 `interactive={false}` 也会抑制水合（与全库“`false` 优先”的语义一致）。

> **`pagination` 的 link 模式例外：** 提供 `getPageUrl` 的 `type="link"` 分页属于纯导航（每个页面都是一个锚点），因此除非显式提供 `onPageChange` 处理器，否则保持静态。只有在按钮模式（或提供了 `onPageChange`）下，`page` / `defaultPage` / `pageSize` / `defaultPageSize` 属性才会被视为信号。

### 第三层条件

- 组件不持有任何客户端状态，也不响应任何事件。
- 它不声明 `interactive` 属性。（历史上 `badge` / `heading` / `text` / `fieldset` 错误地声明了该属性，并将 `interactive="true"` 泄漏到 DOM 上；已在清理中移除。）

***

## 新组件的决策清单

按顺序逐条检查，命中第一条即停止：

1. **它的存在是否完全依赖客户端 JS？**
   浮层 / 模态框 / 拖拽 / 展开折叠 → **第一层**，使用 `shouldHydrate(interactive, true)`。
2. **它是表单控件或视觉上可选择的组件，且可能是受控或非受控？**
   button / checkbox / switch / slider / combobox / 带行点击的 table … → **第二层**，定义 `hasSignal`（状态 + 处理器）后调用 `shouldHydrate(interactive, hasSignal)`。
3. **它是否纯排版 / 布局 / 装饰？**
   text / heading / alert / group / progress … → **第三层**，无 `interactive` 属性，无岛屿。

**硬性实现要求：**

- 任何组件都不得编写裸露的 `if (interactive) { … }` 分支；一律经由 `shouldHydrate`。
- `interactive` 只是一个“旋钮”：`true` 强制水合，`false` 禁止水合，`undefined` 交由 `hasSignal` 决定。
- 每个第一层 / 第二层组件都应在其 `content/components/<Component>.mdx` 中新增 `# Hydration` 小节并交叉引用本文件，同时在 frontmatter 中将其 `hydration` 字段（`1` / `2` / `3`）设为对应值。

***

## 历史清理记录（已修复）

以下偏差在约定推行期间已解决，此处保留以备查：

| # | 组件 | 原始偏差 | 修复 |
| --- | --- | --- | --- |
| 1 | `splitter` / `dialog` / `drawer` | 硬编码 `interactive = true` + `if (interactive)`，绕过了 `shouldHydrate` | 改为 `shouldHydrate(interactive, true)`，恢复 `interactive={false}` 退出选项 |
| 2 | `radio-group` | `interactive ? Island : Root`，强制调用方传入 `interactive` | 改为 `shouldHydrate(interactive, hasSignal)`，信号为 `value` / `defaultValue` / `onValueChange` |

| 3 | `avatar` | 临时 \`if (rest.src \ | \ | interactive)\` | 改为 `shouldHydrate(interactive, Boolean(rest.src))`，统一入口 |

| 4 | `badge` / `heading` / `text` / `fieldset` | 声明了无效的 `interactive` 属性，经由 `restProps` 泄漏到 DOM（`interactive="true"`） | 移除了 `interactive` 属性声明 |
| 5 | `collapsible` | 层级未明确记录 | 在 `docs/Collapsible.md` 中新增 `# Hydration` 小节，标记为第一层 |
| 6 | `tags-input` | 裸露的 `if (isInteractive)` 分支，无 `interactive` 属性，无 `shouldHydrate`，且 `defaultValue` / `defaultInputValue` 被遗漏在信号集外（非受控的 tags-input 渲染为静态） | 改为 `shouldHydrate(interactive, hasSignal)`，新增 `interactive` 旋钮，扩展信号集以包含 `defaultValue` / `defaultInputValue` |
| 7 | `pagination` / `avatar` | 缺失于层级表（`pagination` 完全缺失；`avatar` 被误分类为第一层），且 `pagination` 在 link 模式下过度水合 | 将 `pagination` + `tags-input` 加入第二层；将 `avatar` 移至第二层（加载线索信号）；对 `pagination` 的 link 模式加以限制，使纯导航保持静态 |

> 注：第 4 条是一个真实的 bug —— `badge` / `heading` / `text` / `fieldset` 会将 `interactive` 作为无效的 HTML 属性渲染到 DOM 上；该问题已优先修复。

***

## 相关文档

- [UI 组件架构](/docs/Architecture) —— 项目级概览
- `app/components/ui/island-utils.ts` —— 唯一的决策入口
- `content/components/<Component>.mdx`（每个第一层 / 第二层组件）—— 各自的 `# Hydration` 小节，以及 `hydration`/`category` frontmatter
