# 客户端应用

## 🎯 概述

Client 是一个独立的面向用户的前台应用，位于 `client/` 目录。当前为脚手架状态，可按需扩展业务功能。

## 📦 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5 | UI 框架 |
| Vue Router | 4.6 | 路由管理 |
| Vite | latest | 构建工具 |
| TypeScript | 5.x | 类型系统 |

:::tip
Client 应用有意保持轻量，**不使用 UI 组件库**（如 Naive UI）和 **Pinia**。根据实际需求选择引入。
:::

## 🏗️ 目录结构

```
client/
├── env.d.ts              # 环境变量类型声明
├── index.html            # HTML 入口
├── package.json          # 依赖配置
├── tsconfig.app.json     # 应用 TypeScript 配置
├── tsconfig.json         # 根 TypeScript 配置
├── tsconfig.node.json    # Node 环境 TypeScript 配置
├── vite.config.ts        # Vite 构建配置
└── src/
    ├── App.vue           # 根组件
    ├── main.ts           # 入口文件
    ├── router/
    │   └── index.ts      # 路由配置
    └── views/
        └── Home.vue      # 首页（占位）
```

## ⚙️ Vite 配置

```ts
// client/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

| 配置项 | 值 | 说明 |
|--------|------|------|
| `base` | `/` | 根路径部署 |
| `server.port` | `5174` | 开发服务器端口 |
| `/api` 代理 | `localhost:3000` | API 请求转发到后端 |
| `/uploads` 代理 | `localhost:3000` | 上传文件访问转发 |

## 🛣️ 路由配置

当前仅包含一个路由：

```ts
// client/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    { path: '/', name: 'Home', component: Home },
  ],
})

export default router
```

## 📄 当前页面

```vue
<!-- client/src/views/Home.vue -->
<template>
  <div>
    <h1>Home</h1>
    <!-- 占位页面，待开发 -->
  </div>
</template>
```

## 🚀 开发与构建

```bash
# 进入 client 目录
cd client

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev    # → http://localhost:5174/

# 生产构建
pnpm build  # → client/dist/
```

## 📡 部署方式

构建产物由后端通过 `@elysiajs/static` 插件托管为静态文件：

```
构建: pnpm build → client/dist/
部署: Elysia static 插件 → 根路径 / 提供服务
```

```
浏览器请求
  ├─ /          → Client 静态页面 (client/dist/)
  ├─ /_admin/   → Admin 静态页面 (frontend/dist/)
  ├─ /api/      → Elysia REST API
  └─ /uploads/  → 上传文件静态服务
```

## 🔮 扩展方向

Client 应用可根据业务需求扩展以下能力：

| 能力 | 建议方案 |
|------|----------|
| UI 组件库 | Naive UI / Element Plus / 自定义组件 |
| 状态管理 | Pinia（与 Admin 对齐） |
| HTTP 客户端 | 复用 Admin 的 HttpClient 封装 |
| 用户认证 | 对接后端 Auth API |
| 国际化 | vue-i18n |

:::warning
Client 和 Admin 是完全独立的两个 Vite 项目，各自有独立的 `package.json`、`vite.config.ts` 和构建流程。不要混淆两者的依赖和配置。
:::
