# 后端总览

Bunstuff 后端是基于 **Bun + Elysia** 构建的 RESTful API 服务，提供完整的企业级后台管理功能。采用插件化架构、自研 ORM 和 SSQL 查询语言，实现高性能、类型安全、零样板代码的开发体验。

## 🎯 技术架构

| 组件 | 技术 | 说明 |
|------|------|------|
| 运行时 | Bun | 高性能 JS/TS 运行时 |
| HTTP 框架 | Elysia 1.4.x | 类型安全、自动 OpenAPI |
| 数据库 | SQLite / MySQL / PostgreSQL | 自研 ORM 适配 |
| 权限引擎 | Casbin 5.49 | RBAC 策略评估 |
| 定时任务 | Croner 10.0 | Cron 调度 |
| 模板引擎 | VelocityJS 2.1 | 数据权限模板 |

## 📊 核心依赖

```json
{
  "elysia": "^1.4.22",
  "@elysiajs/cors": "^1.4.1",
  "@elysiajs/openapi": "^1.4.14",
  "@elysiajs/static": "^1.4.7",
  "casbin": "^5.49.0",
  "croner": "^10.0.1",
  "velocityjs": "^2.1.5"
}
```

## 🏢 业务功能

### 核心模块

| 模块 | 说明 | 文档 |
|------|------|------|
| 认证模块 (Auth) | JWT Token 认证、会话管理、密码处理 | [查看](/backend/modules/auth) |
| 权限模块 (RBAC) | 角色/权限/菜单管理、数据权限过滤 | [查看](/backend/modules/rbac) |
| CRUD 服务 | 通用增删改查基类、数据权限集成 | [查看](/backend/modules/crud-service) |

### 功能模块

| 模块 | 说明 | 文档 |
|------|------|------|
| VIP 会员 | 多等级体系、资源配额管理 | [查看](/backend/modules/vip) |
| 文件管理 | 本地/S3 存储、上传下载 | [查看](/backend/modules/file) |
| 通知公告 | 发布管理、SSE 实时推送 | [查看](/backend/modules/notice) |
| 定时任务 | Cron 调度、任务暂停/恢复 | [查看](/backend/modules/job) |
| Seed 种子 | 数据初始化、依赖排序执行 | [查看](/backend/modules/seed) |

### 系统模块

| 模块 | 说明 | 文档 |
|------|------|------|
| 字典管理 | 字典类型与数据维护、全量缓存 | [查看](/backend/modules/dict) |
| 参数配置 | 系统参数键值对、全量缓存 | [查看](/backend/modules/config) |
| 操作日志 | 请求/响应/耗时自动记录 | [查看](/backend/modules/oper-log) |
| 登录日志 | 登录事件记录 | [查看](/backend/modules/login-log) |
| API 限流 | 三种限流模式、IP 自动封禁 | [查看](/backend/modules/rate-limit) |

## 🔌 插件系统

11 个功能插件，即插即用：

| 插件 | 注入上下文 | 用途 |
|------|-----------|------|
| `authPlugin` | `session, userId, roleId` | JWT 认证 |
| `rbacPlugin` | `dataScope` | 权限校验 + 数据权限 |
| `vipPlugin` | `vip` | VIP 等级 + 资源限制 |
| `filePlugin` | `file` | 文件操作 |
| `noticePlugin` | `notice` | 通知推送 |
| `dictPlugin` | `dict` | 字典缓存 |
| `configPlugin` | `config` | 配置缓存 |
| `loginLogPlugin` | `loginLog` | 登录记录 |
| `operLogPlugin` | — | 操作日志（声明式） |
| `rateLimitPlugin` | — | 全局限流 |
| `jobPlugin` | — | 任务触发 |

> 📖 详细文档请查看 [插件概览](/backend/plugins/) 和 [插件开发](/backend/plugins/develop)。

## 📁 路由结构

后端 API 分为两组路由：

### 客户端路由 (`/api/_/`)

面向前端客户端，7 条路由：

| 路由 | 说明 |
|------|------|
| `/api/_/auth` | 登录、注册、登出、修改密码 |
| `/api/_/rbac` | 查询当前用户权限、菜单树 |
| `/api/_/dict` | 查询字典数据 |
| `/api/_/config` | 查询系统配置 |
| `/api/_/notice` | 查询通知、SSE 实时推送 |
| `/api/_/file` | 文件上传、下载 |

### 管理端路由 (`/api/admin/`)

面向管理后台，18 条路由，每条配套权限策略：

| 路由 | 说明 |
|------|------|
| `/api/admin/auth` | 会话管理、在线用户管理 |
| `/api/admin/users` | 用户 CRUD |
| `/api/admin/role` | 角色 CRUD |
| `/api/admin/menu` | 菜单 CRUD |
| `/api/admin/rbac` | 权限管理、缓存刷新 |
| `/api/admin/dict` | 字典 CRUD |
| `/api/admin/config` | 参数配置 CRUD |
| `/api/admin/notice` | 通知公告管理 |
| `/api/admin/file` | 文件管理 |
| `/api/admin/job` | 定时任务管理 |
| `/api/admin/job-log` | 任务日志 |
| `/api/admin/login-log` | 登录日志 |
| `/api/admin/oper-log` | 操作日志 |
| `/api/admin/rate-limit-rule` | 限流规则 |
| `/api/admin/ip-blacklist` | IP 黑名单 |
| `/api/admin/seed` | Seed 管理 |
| `/api/admin/vip` | VIP 管理 |

## 🗄️ 数据模型

共 22 张数据表，按功能分组：

| 分组 | 表名 | 说明 |
|------|------|------|
| **用户认证** | `users`, `session` | 用户信息、会话管理 |
| **RBAC** | `role`, `menu` | 角色、菜单、权限（Casbin 内置） |
| **系统管理** | `dict_type`, `dict_data`, `sys_config`, `sys_file`, `notice`, `notice_read` | 字典、配置、文件、通知 |
| **日志审计** | `login_log`, `oper_log` | 登录日志、操作日志 |
| **定时任务** | `job`, `job_log` | 任务定义、执行日志 |
| **VIP 会员** | `vip_tier`, `vip_resource_limit`, `user_vip`, `user_resource_usage` | 等级、限额、用户VIP、用量 |
| **安全限流** | `rate_limit_rule`, `ip_blacklist` | 限流规则、黑名单 |
| **其他** | `seed_log` | Seed 记录 |

> 📖 详细文档请查看 [模型总览](/backend/models/) 和 [模型定义规范](/backend/models/define)。

## ⚡ 代码生成

通过 `bun run generate` 自动扫描文件系统生成 4 个注册文件：

| 文件 | 扫描规则 | 生成内容 |
|------|---------|---------|
| `schemas.generated.ts` | `models/*/schema.ts` | 所有 Schema 注册 |
| `routes.generated.ts` | `api/**/index.ts` | 所有路由注册 |
| `policies.generated.ts` | `api/**/policy.ts` | 所有权限策略 |
| `seeds.generated.ts` | `models/*/seed.ts` | 所有 Seed 数据 |

::: tip 开发提示
新增/删除模块后，务必执行 `bun run generate` 重新生成注册文件。
:::
