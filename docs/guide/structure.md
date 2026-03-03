# 项目结构

Bunstuff 采用 **Monorepo** 架构，在一个仓库中管理后端、前端、客户端、文档四大模块。本章节详细说明每个目录的用途和组织方式。

## 📁 完整目录结构

```
📁 bunstuff (项目根目录)
│
├── 📁 backend/                          // 🚀 后端 API 服务
│   ├── 📄 index.ts                      // 入口文件，启动 Elysia 应用
│   ├── 📄 package.json                  // 后端依赖配置
│   ├── 📄 tsconfig.json                 // TypeScript 配置
│   ├── 📄 env.d.ts                      // 环境变量类型声明
│   │
│   ├── 📁 _generated/                   // 自动生成的注册文件（勿手动修改）
│   │   ├── 📄 schemas.generated.ts      // 22 个数据库 Schema
│   │   ├── 📄 routes.generated.ts       // 25 条 API 路由
│   │   ├── 📄 policies.generated.ts     // 18 个权限策略
│   │   └── 📄 seeds.generated.ts        // 20 个 Seed 模块
│   │
│   ├── 📁 api/                          // API 路由层
│   │   ├── 📁 _/                        // 客户端 API（7 条路由）
│   │   │   ├── 📄 auth/                 // 认证（登录/注册/登出）
│   │   │   ├── 📄 config/               // 配置查询
│   │   │   ├── 📄 crud/                 // 动态 CRUD
│   │   │   ├── 📄 dict/                 // 字典查询
│   │   │   ├── 📄 file/                 // 文件上传下载
│   │   │   ├── 📄 notice/               // 通知 + SSE
│   │   │   └── 📄 rbac/                 // 权限查询
│   │   └── 📁 admin/                    // 管理端 API（18 条路由）
│   │       ├── 📄 auth/                 // 会话管理
│   │       ├── 📄 config/               // 参数配置 CRUD
│   │       ├── 📄 crud-table/           // 动态表管理
│   │       ├── 📄 dict/                 // 字典 CRUD
│   │       ├── 📄 file/                 // 文件管理
│   │       ├── 📄 ip-blacklist/         // IP 黑名单
│   │       ├── 📄 job/                  // 定时任务管理
│   │       ├── 📄 job-log/              // 任务日志
│   │       ├── 📄 login-log/            // 登录日志
│   │       ├── 📄 menu/                 // 菜单 CRUD
│   │       ├── 📄 notice/               // 通知管理
│   │       ├── 📄 oper-log/             // 操作日志
│   │       ├── 📄 rate-limit-rule/      // 限流规则
│   │       ├── 📄 rbac/                 // RBAC 管理
│   │       ├── 📄 role/                 // 角色 CRUD
│   │       ├── 📄 seed/                 // 种子管理
│   │       ├── 📄 users/                // 用户 CRUD
│   │       └── 📄 vip/                  // VIP 管理
│   │
│   ├── 📁 core/                         // 核心框架
│   │   ├── 📄 index.ts                  // createApi / createAdminApi 工厂
│   │   ├── 📄 model.ts                  // Model 基类（ORM 操作）
│   │   ├── 📄 crud.ts                   // CrudService 基类
│   │   ├── 📄 policy.ts                 // definePolicy 权限定义
│   │   └── 📄 seed.ts                   // Seed 执行引擎
│   │
│   ├── 📁 models/                       // 数据模型（22 张表）
│   │   ├── 📄 main.ts                   // 主数据库连接
│   │   ├── 📁 users/                    // 用户表
│   │   ├── 📁 role/                     // 角色表
│   │   ├── 📁 menu/                     // 菜单表
│   │   ├── 📁 session/                  // 会话表
│   │   ├── 📁 dict-type/               // 字典类型
│   │   ├── 📁 dict-data/               // 字典数据
│   │   ├── 📁 sys-config/              // 系统配置
│   │   ├── 📁 sys-file/                // 文件记录
│   │   ├── 📁 notice/                  // 通知公告
│   │   ├── 📁 notice-read/             // 通知已读
│   │   ├── 📁 login-log/               // 登录日志
│   │   ├── 📁 oper-log/                // 操作日志
│   │   ├── 📁 job/                     // 定时任务
│   │   ├── 📁 job-log/                 // 任务日志
│   │   ├── 📁 rate-limit-rule/         // 限流规则
│   │   ├── 📁 ip-blacklist/            // IP 黑名单
│   │   ├── 📁 seed-log/                // Seed 日志
│   │   ├── 📁 crud-table/              // CRUD 注册表
│   │   ├── 📁 vip-tier/                // VIP 等级
│   │   ├── 📁 vip-resource-limit/      // VIP 资源限制
│   │   ├── 📁 user-vip/                // 用户 VIP
│   │   └── 📁 user-resource-usage/     // 资源用量
│   │
│   ├── 📁 services/                     // 业务服务层
│   │   ├── 📄 auth.ts                  // 认证服务
│   │   ├── 📄 user.ts                  // 用户服务
│   │   ├── 📄 rbac.ts                  // RBAC 服务
│   │   ├── 📄 rbac-cache.ts            // RBAC 缓存
│   │   ├── 📄 casbin.ts                // Casbin 引擎
│   │   ├── 📄 role.ts                  // 角色服务
│   │   ├── 📄 menu.ts                  // 菜单服务
│   │   ├── 📄 session.ts               // 会话管理
│   │   ├── 📄 dict.ts                  // 字典缓存
│   │   ├── 📄 sys-config.ts            // 配置缓存
│   │   ├── 📄 file.ts                  // 文件服务
│   │   ├── 📄 notice.ts                // 通知服务
│   │   ├── 📄 job.ts                   // 任务调度
│   │   ├── 📄 job-log.ts               // 任务日志
│   │   ├── 📄 login-log.ts             // 登录日志
│   │   ├── 📄 oper-log.ts              // 操作日志
│   │   ├── 📄 rate-limit.ts            // 限流服务
│   │   ├── 📄 crud-table.ts            // CRUD 注册
│   │   ├── 📄 seed.ts                  // Seed 服务
│   │   ├── 📄 vip.ts                   // VIP 服务
│   │   └── 📄 response.ts              // 统一响应工具
│   │
│   ├── 📁 plugins/                      // 功能插件（11 个）
│   │   ├── 📄 auth.ts                  // 认证插件
│   │   ├── 📄 rbac.ts                  // 权限插件
│   │   ├── 📄 vip.ts                   // VIP 插件
│   │   ├── 📄 file.ts                  // 文件插件
│   │   ├── 📄 notice.ts                // 通知插件
│   │   ├── 📄 dict.ts                  // 字典插件
│   │   ├── 📄 config.ts                // 配置插件
│   │   ├── 📄 login-log.ts             // 登录日志插件
│   │   ├── 📄 oper-log.ts              // 操作日志插件
│   │   ├── 📄 rate-limit.ts            // 限流插件
│   │   └── 📄 job.ts                   // 任务插件
│   │
│   ├── 📁 packages/                     // 自研工具包
│   │   ├── 📁 orm/                     // 自研 ORM
│   │   ├── 📁 ssql/                    // SSQL 查询语言
│   │   └── 📁 route-model/             // 路由 Schema 工具
│   │
│   └── 📁 scripts/                      // 脚本工具
│       ├── 📄 gen-registry.ts           // 代码生成器
│       └── 📄 collect-scopes.ts         // 作用域收集
│
├── 📁 frontend/                         // 💻 管理端前端 (Vue 3 + Naive UI)
│   ├── 📄 vite.config.ts               // Vite 配置 (base: /_admin/)
│   ├── 📁 src/
│   │   ├── 📄 main.ts                  // 入口
│   │   ├── 📄 App.vue                  // 根组件
│   │   ├── 📁 api/                     // API 请求层
│   │   ├── 📁 components/              // 通用组件
│   │   ├── 📁 composables/             // 组合式函数
│   │   ├── 📁 layouts/                 // 布局组件
│   │   ├── 📁 router/                  // 路由配置
│   │   ├── 📁 stores/                  // Pinia 状态管理
│   │   └── 📁 views/                   // 页面视图
│   └── 📄 package.json
│
├── 📁 client/                           // 📱 客户端前端 (Vue 3)
│   ├── 📁 src/
│   │   ├── 📄 main.ts
│   │   ├── 📄 App.vue
│   │   ├── 📁 router/
│   │   └── 📁 views/
│   └── 📄 package.json
│
├── 📁 docs/                             // 📖 项目文档 (VitePress)
├── 📁 data/                             // 🗄️ SQLite 数据文件
├── 📁 uploads/                          // 📂 文件上传目录
├── 📁 build/                            // 📦 构建产物
├── 📁 release/                          // 📦 发布包
├── 📁 release-docker/                   // 🐳 Docker 发布包
│
├── 📄 Dockerfile                        // Docker 构建文件
├── 📄 docker-compose.yml                // Docker 编排
├── 📄 build.ts                          // 构建脚本
├── 📄 build-docker.ts                   // Docker 构建脚本
├── 📄 package.json                      // Monorepo 根配置
└── 📄 tsconfig.json                     // TypeScript 根配置
```

## 🏗️ 架构分层

```
┌─────────────────────────────────────────────────────────┐
│              frontend / client (前端层)                   │
│   ┌──────────────┐  ┌──────────────┐                    │
│   │  管理端 Vue3  │  │  客户端 Vue3  │                    │
│   └──────────────┘  └──────────────┘                    │
├─────────────────────────────────────────────────────────┤
│                   api/ (路由层)                           │
│   ┌───────────┐  ┌────────────────────────┐             │
│   │  客户端 _/ │  │   管理端 admin/         │             │
│   └───────────┘  └────────────────────────┘             │
├─────────────────────────────────────────────────────────┤
│                 plugins/ (插件层)                         │
│   auth → rbac → vip → file → notice → dict → ...       │
├─────────────────────────────────────────────────────────┤
│                services/ (服务层)                         │
│   CrudService → 业务逻辑 → 数据权限                      │
├─────────────────────────────────────────────────────────┤
│                 models/ (模型层)                          │
│   Schema → Model → DB 操作                              │
├─────────────────────────────────────────────────────────┤
│                packages/ (工具层)                         │
│   ┌───────┐  ┌───────┐  ┌──────────────┐              │
│   │  ORM  │  │ SSQL  │  │ Route Model  │              │
│   └───────┘  └───────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## 📂 模块说明

### 后端模块 (`backend/`)

| 目录 | 说明 | 关键文件 |
|------|------|---------|
| `api/` | API 路由定义 | 每个子目录为一条路由 |
| `core/` | 核心框架 | `createApi()`, `CrudService`, `definePolicy` |
| `models/` | 数据模型 | 每个子目录包含 `schema.ts` + `seed.ts` |
| `services/` | 业务服务 | 继承 `CrudService`，封装业务逻辑 |
| `plugins/` | 功能插件 | Elysia 插件，通过 `derive` 注入上下文 |
| `packages/` | 自研工具包 | ORM、SSQL、Route Model |
| `scripts/` | 脚本工具 | 代码生成器 |
| `_generated/` | 生成文件 | 由脚本自动生成，勿手动修改 |

### 前端模块 (`frontend/`)

| 目录 | 说明 |
|------|------|
| `api/` | HTTP 请求封装，按模块组织 |
| `components/` | 通用组件（PageTable、FormModal 等） |
| `composables/` | 组合式函数（useTable、useModal、useDict） |
| `layouts/` | 布局组件（AdminLayout） |
| `router/` | 路由配置，支持动态路由生成 |
| `stores/` | Pinia 状态管理（authStore） |
| `views/` | 页面视图，按功能模块组织 |

## 🔍 快速定位指南

### 按功能定位

| 功能需求 | 文件位置 |
|---------|---------|
| 用户登录/认证 | `backend/services/auth.ts` + `backend/plugins/auth.ts` |
| 角色/菜单管理 | `backend/services/rbac.ts` + `backend/services/menu.ts` |
| 数据权限 | `backend/services/rbac.ts` → `buildWhere()` |
| 文件上传下载 | `backend/services/file.ts` + `backend/plugins/file.ts` |
| 定时任务 | `backend/services/job.ts` + `backend/plugins/job.ts` |
| 字典缓存 | `backend/services/dict.ts` + `backend/plugins/dict.ts` |
| 前端路由 | `frontend/src/router/` |
| 前端状态 | `frontend/src/stores/` |

### 按技术定位

| 技术需求 | 文件位置 |
|---------|---------|
| ORM 操作 | `backend/packages/orm/` |
| SQL 条件构建 | `backend/packages/ssql/` |
| 路由 Schema | `backend/packages/route-model/` |
| 代码生成 | `backend/scripts/gen-registry.ts` |
| Docker 配置 | `Dockerfile` + `docker-compose.yml` |
| 构建脚本 | `build.ts` + `build-docker.ts` |
