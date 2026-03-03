---
layout: home

hero:
  name: Bunstuff
  text: 全栈后台管理系统
  tagline: 基于 Bun + Elysia 构建，高性能、类型安全、开箱即用的企业级全栈开发框架
  actions:
    - theme: brand
      text: 快速开始 →
      link: /guide/getting-started
    - theme: alt
      text: 项目简介
      link: /guide/
    - theme: alt
      text: GitHub
      link: https://github.com/a876691666/bunstuff

features:
  - icon: ⚡
    title: 极致性能
    details: 基于 Bun 运行时，启动速度毫秒级，HTTP 吞吐量大幅领先 Node.js。SQLite 本地数据库零网络延迟，生产环境可无缝切换 MySQL / PostgreSQL。
  - icon: 🔐
    title: 完整权限体系
    details: 内置 RBAC 角色权限 + Casbin 策略引擎，支持树形角色继承、权限向上汇聚、基于 SSQL 的行级数据权限过滤，全量缓存预热查询零 DB 访问。
  - icon: 🧩
    title: 插件化架构
    details: 11 个功能插件开箱即用（认证、权限、VIP、文件、通知、字典、配置、日志、限流、任务），上下文自动注入，声明式配置，开发高效。
  - icon: 📦
    title: 开箱即用
    details: 22 张数据表、25 条 API 路由、18 个权限策略、20 个 Seed 种子，涵盖用户管理、角色菜单、字典配置、文件上传、定时任务等全套功能。
  - icon: 🖥️
    title: 现代化前端
    details: 管理端 Vue 3 + Naive UI + Pinia，客户端 Vue 3 极简架构。动态路由、SSQL 搜索构建器、CRUD 组件化，前后端类型统一。
  - icon: 🐳
    title: Docker 一键部署
    details: 三阶段 Dockerfile 优化构建，docker-compose 编排，卷挂载数据持久化，Nginx 反向代理配置，生产环境开箱即用。
---

<div style="margin-top: 2rem;"></div>

## 🌟 为什么选择 Bunstuff？

### 📊 核心优势

| 特性 | 说明 |
|------|------|
| **极致性能** | Bun 运行时 + SQLite 本地存储，单机 QPS 远超传统 Node.js 方案 |
| **类型安全** | 全链路 TypeScript，ORM → Schema → 路由 → 前端全部类型推导 |
| **零样板代码** | 自研 ORM + CrudService + getSchema()，新增一个模块仅需 4 个文件 |
| **企业级功能** | RBAC 权限、VIP 会员、文件管理、定时任务、操作日志、API 限流一应俱全 |
| **自研工具链** | ORM、SSQL 查询语言、Route Model 三个零依赖自研包，深度适配框架 |

### 💡 适用场景

- ✅ **后台管理系统** — 完整的 RBAC 权限体系和管理端 UI
- ✅ **SaaS 平台** — VIP 等级体系、资源配额管理、数据权限隔离
- ✅ **API 服务** — RESTful API + OpenAPI 文档自动生成
- ✅ **快速原型** — 动态 CRUD 零代码建表，Seed 一键初始化数据
- ✅ **全栈项目** — 管理端 + 客户端 + API 服务一体化开发

## 🚀 立即开始

[🚀 快速开始](/guide/getting-started) — 5 分钟启动项目

[🏗️ 后端开发](/backend/) — Bun + Elysia API 服务

[💻 前端开发](/frontend/) — Vue 3 + Naive UI 管理端

[📦 自研包](/packages/) — ORM + SSQL + Route Model

[🐳 部署运维](/deploy/) — Docker 部署 + 环境配置
