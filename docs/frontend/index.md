# 前端概述

## 🎯 架构总览

本项目包含两个独立的前端应用：

| 应用           | 目录        | 用途               | 端口 | Base       |
| -------------- | ----------- | ------------------ | ---- | ---------- |
| Admin 管理后台 | `frontend/` | 系统管理、运维操作 | 5173 | `/_admin/` |
| Client 客户端  | `client/`   | 面向用户的前台应用 | 5174 | `/`        |

## 🚀 技术栈

| 技术       | 版本   | 用途           |
| ---------- | ------ | -------------- |
| Vue        | 3.5    | 响应式 UI 框架 |
| Naive UI   | 2.43   | 企业级组件库   |
| Pinia      | 3.0    | 状态管理       |
| Vue Router | 4.6    | 路由管理       |
| Vite       | latest | 构建工具       |
| TypeScript | 5.x    | 类型系统       |

## 📦 目录结构

```
frontend/src/
├── api/                # API 模块（17 个）
│   ├── auth.ts
│   ├── user.ts
│   ├── role.ts
│   ├── ...
├── assets/             # 静态资源
├── components/         # 公共组件（5 个通用 + 4 个 CRUD）
│   ├── PageTable.vue
│   ├── FormModal.vue
│   ├── FormField.vue
│   ├── SearchForm.vue
│   ├── ConfirmButton.vue
│   ├── CrudTable.vue
│   ├── CrudSearch.vue
│   ├── CrudModal.vue
│   └── CrudConfirm.vue
├── composables/        # 组合式函数（3 个）
│   ├── useTable.ts
│   ├── useModal.ts
│   └── useDict.ts
├── layouts/            # 布局组件
│   └── AdminLayout.vue
├── router/             # 路由配置
│   └── index.ts
├── stores/             # Pinia 状态仓库
│   └── auth.ts
├── types/              # TypeScript 类型定义
│   └── api.ts
├── views/              # 页面视图（25+ 页面）
│   ├── dashboard/
│   ├── auth/
│   ├── system/
│   ├── rbac/
│   ├── vip/
│   ├── notice/
│   ├── file/
│   ├── job/
│   ├── rate-limit/
│   └── crud/
├── App.vue             # 根组件
└── main.ts             # 入口文件
```

## 🏗️ 架构图

```
┌─────────────────────────────────────────────────┐
│                   浏览器                          │
├──────────────────────┬──────────────────────────┤
│  Admin (/_admin/)    │  Client (/)              │
│  Vue 3 + Naive UI    │  Vue 3 (轻量)            │
│  Pinia + Router      │  Router only             │
│  Port 5173           │  Port 5174               │
├──────────────────────┴──────────────────────────┤
│              Vite Dev Server (Proxy)             │
│              /api → localhost:3000               │
├─────────────────────────────────────────────────┤
│              Elysia Backend (:3000)              │
│              REST API + Static Files             │
└─────────────────────────────────────────────────┘
```

## 📊 项目规模

| 维度       | 数量             |
| ---------- | ---------------- |
| 页面视图   | 25+              |
| API 模块   | 17               |
| 通用组件   | 5                |
| CRUD 组件  | 4                |
| 组合式函数 | 3                |
| 类型定义   | 20+ 实体，814 行 |

:::tip
Admin 后台是功能完整的管理系统，Client 客户端目前为脚手架状态，可按需扩展。
:::

## 📖 文档导航

- [路由系统](./router.md) - 静态路由、动态路由、导航守卫
- [状态管理](./stores.md) - Pinia Store 设计
- [HTTP 客户端](./http.md) - 请求封装与错误处理
- [API 模块](./api.md) - 接口模块总览
- [组件体系](./components.md) - 通用组件与 CRUD 组件
- [组合式函数](./composables.md) - useTable、useModal、useDict
- [CRUD 开发指南](./crud-components.md) - 完整增删改查开发流程
- [页面视图](./views.md) - 各业务页面说明
- [布局系统](./layout.md) - AdminLayout 布局结构
- [客户端应用](./client.md) - Client 前台应用
