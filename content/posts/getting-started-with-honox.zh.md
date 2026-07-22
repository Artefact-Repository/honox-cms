---
title: HonoX 入门指南
date: 2026-06-28
description: 了解如何使用 HonoX 构建全栈应用程序，HonoX 是构建在 Hono 之上的元框架。本指南涵盖路由、中间件和部署策略。
cover: https://picsum.photos/seed/getting-started-with-honox/1200/675
author: ''
readTime: ''
tags:
  - tutorial
  - honox
  - getting-started
draft: false
---

# HonoX 入门指南

HonoX 是一个构建在 Hono 之上的强大元框架，使您能够轻松构建全栈 Web 应用程序。

## 什么是 HonoX？

HonoX 将 Hono 的简单性与以下高级功能相结合：

- 基于文件的路由
- 服务端渲染 (SSR)
- 静态网站生成 (SSG)
- 交互式组件的孤岛架构 (Islands)

## 安装

```bash
npm create honox@latest
```

## 项目结构

一个典型的 HonoX 项目结构如下：

```plain
my-app/
  ├── app/
  │   ├── routes/       # 基于文件的路由
  │   ├── components/   # 可复用组件
  │   └── islands/      # 客户端交互组件
  ├── public/           # 静态资源
  └── package.json
```

## 创建你的第一个路由

创建一个新文件 `app/routes/about.tsx`：

```tsx
import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <div>
      <h1>关于页面</h1>
      <p>欢迎来到我的 HonoX 应用！</p>
    </div>
  );
});
```

## 结论

HonoX 提供了一种现代、快速且灵活的方法来构建 Web 应用程序。快来试试吧！
