# 🚀 Bunstuff

基于 **Bun + Elysia** 构建的全栈后台管理系统，开箱即用。

## ✨ 特性

- 🏎️ **极速启动** — Bun 运行时 + Elysia 框架，毫秒级冷启动
- 🔐 **企业级权限** — Casbin RBAC + 数据域行级过滤
- 💎 **VIP 体系** — 多等级会员 + 资源配额管理
- 📊 **动态 CRUD** — 数据库驱动的通用增删改查
- 🔧 **自研工具链** — ORM / SSQL / Route-Model 三件套
- 🌐 **前后端一体** — Vue 3 + Naive UI + Pinia + Vite

## 📦 技术栈

| 层级     | 技术                                    |
| -------- | --------------------------------------- |
| 运行时   | Bun                                     |
| 后端框架 | Elysia 1.4                              |
| 前端框架 | Vue 3.5 + Naive UI                      |
| 状态管理 | Pinia 3.0                               |
| 数据库   | SQLite（默认）/ MySQL / PostgreSQL      |
| 权限引擎 | Casbin 5.x                              |
| 定时任务 | Croner 10.x                             |
| 自研包   | @pkg/orm · @pkg/ssql · @pkg/route-model |

## 🏗️ 项目结构

```
bunstuff/
├── backend/         # 后端（Bun + Elysia）
│   ├── api/         # API 路由（客户端 + 管理端）
│   ├── models/      # 数据模型（22 张表）
│   ├── services/    # 业务服务层
│   ├── plugins/     # 11 个 Elysia 插件
│   └── packages/    # 自研包（ORM / SSQL / Route-Model）
├── frontend/        # 管理后台（Vue 3 + Naive UI）
├── client/          # 客户端应用（Vue 3）
├── docs/            # 文档站（VitePress）
└── release/         # 构建产物
```

## 🚀 快速开始

```bash
# 1. 安装依赖
cd backend && bun install
cd frontend && bun install
cd client && bun install

# 2. 启动所有服务
bun run dev

# 或分别启动
bun run dev:backend    # 后端 :3000
bun run dev:frontend   # 管理端 :5173
bun run dev:client     # 客户端 :5174
bun run dev:docs       # 文档站 :5175
```

## 📋 功能模块

| 模块      | 说明                                        |
| --------- | ------------------------------------------- |
| 认证管理  | 登录注册、Token 会话、路由保护              |
| 权限管理  | Casbin RBAC、角色权限、数据域过滤、动态菜单 |
| VIP 管理  | 等级体系、资源配额、有效期管理              |
| 用户管理  | 用户 CRUD、状态管理、角色分配               |
| 菜单管理  | 树形菜单、目录/页面/按钮三级                |
| 字典管理  | 字典类型 + 字典数据、全量缓存               |
| 参数配置  | 系统参数键值对、缓存刷新                    |
| 文件管理  | 上传下载、元信息管理                        |
| 通知公告  | 发布管理、已读追踪、SSE 推送                |
| 定时任务  | Cron 表达式、模板引擎、执行日志             |
| 操作日志  | 自动记录、错误捕获、耗时统计                |
| 登录日志  | UA 解析、登录/登出/踢出记录                 |
| 限流保护  | 多模式限流、IP 黑名单、自动封禁             |
| 动态 CRUD | 数据库驱动的通用表管理                      |
| Seed 系统 | 拓扑排序、自动执行、执行日志                |

## 🐳 部署

```bash
# 本地构建
bun run build.ts

# Docker 部署
bun run docker:build
cd release-docker
docker load -i bunstuff.tar
docker compose up -d
```

## 📖 文档

```bash
bun run dev:docs
```

访问 http://localhost:5175 查看完整文档。

## 📄 许可证

MIT
