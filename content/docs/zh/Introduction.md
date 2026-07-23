---
title: 简介
---

这是一个基于 [**HonoX**](https://github.com/honojs/honox) 构建的全栈脚手架项目，将类型安全的样式系统与一个基于 Git 的 CMS 结合在一起，并将整站打包为静态站点输出。它旨在为内容驱动型站点（文档、博客、营销页面）提供一套开箱即用的基础设施，同时在真正需要的地方保留可交互的组件。

| 组成部分 | 作用 |
| --- | --- |
| [HonoX](https://honox.dev) | 基于 [Hono](https://hono.dev) 的元框架 —— 基于文件的路由、服务端/客户端岛屿 |
| [PandaCSS](https://panda-css.com) | 类型安全、零运行时的 CSS-in-JS，提前编译 |
| [Sveltia CMS](https://sveltiacms.app) | 基于 Git 的内容编辑，位于 `/admin/` —— 无需数据库，无需后端服务 |
| [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) | 在构建时将每条路由预渲染为静态 HTML |

***

## 为什么选择这套技术栈

* **默认静态。** 构建产物就是普通的 HTML/CSS/JS —— 请求时无需任何服务端进程，因此可以部署在任何支持静态文件托管的平台上（Cloudflare Pages 与 Vercel 已开箱配置）。
* **在需要的地方才交互。** 并非每个组件都需要下发 JavaScript。三层[水合](/docs/zh/Hydration)模型让每个组件自行决定是急切水合、按行为条件水合，还是完全不水合 —— 在不牺牲丰富 UI 的前提下保持客户端 bundle 精简。
* **无需接触代码即可编辑内容。** [Sveltia CMS](https://sveltiacms.app) 完全运行在客户端，并直接向 `content/` 下的文件提交变更，因此编辑者可以撰写博客与文档，甚至通过[页面构建器](/docs/zh/PageBuilder)以可视化方式组合整个页面，而开发者仍能将一切纳入版本控制。
* **样式可靠可信。** [PandaCSS](https://panda-css.com) 会基于静态可分析的样式调用提前生成全部 CSS —— 没有运行时样式引擎，没有类名冲突，设计 token 拥有完整的类型安全。

***

## 项目中都有什么

* **约 50 个 UI 组件**，位于 `app/components/ui/`，覆盖布局、表单、浮层与数据展示，每个组件在需要时都有一个对应的交互式岛屿位于 `app/islands/`。
* **一个博客**（`content/posts/`），支持标签、作者页面以及只读的 JSON API。
* **一个可视化页面构建器**（`content/pages/`），完全通过 CMS 由嵌套组件组合页面。
* **文档**（即本区域），以纯 Markdown 或 MDX 撰写 —— 后者用于需要在正文中嵌入实时渲染示例的页面。
* **六种语言的国际化**（`en`、`zh`、`es`、`pt`、`fr`、`de`），覆盖文档、组件与站点界面文案。

***

## 从这里开始

* [快速开始](/docs/zh/Getting-Started) —— 安装依赖并在本地运行项目。
* [架构](/docs/zh/Architecture) —— 深入了解构建过程、路由、组件结构与内容流水线。
* [水合](/docs/zh/Hydration) —— 组件如何选择启用客户端交互性。
* [CMS 页面构建器](/docs/zh/PageBuilder) —— 通过 Sveltia CMS 以可视化方式组合页面。
