# 后端总览

## 概述

后端基于 **Bun + Elysia** 构建，提供完整的 RESTful API 服务。核心特性：

- **Elysia 框架**：端到端类型安全，自动 OpenAPI 文档
- **插件化架构**：功能模块解耦，按需组合
- **自研 ORM**：轻量高效，类型安全
- **CrudService 基类**：统一 CRUD 逻辑，内置数据权限过滤
- **全量缓存策略**：Session / RBAC / 字典 / 配置均预热到内存

## 核心依赖

| 包 | 版本 | 用途 |
|---|---|------|
| `elysia` | latest | Web 框架 |
| `@elysiajs/cors` | - | CORS 跨域 |
| `@elysiajs/openapi` | - | OpenAPI/Swagger 文档 |
| `@elysiajs/static` | - | 静态文件服务 |
| `croner` | - | Cron 调度 |
| `velocityjs` | - | 模板引擎（数据权限） |

## 应用入口

`backend/index.ts` 是整个后端的入口文件，负责：

1. 执行种子数据初始化
2. 预热各模块缓存
3. 启动定时任务
4. 构建 Elysia 应用实例
5. 挂载中间件和路由
6. 监听端口

```typescript
// 简化的启动流程
await runSeeds()
await sessionStore.init()
await rbacService.init()
await dictService.initCache()
await configService.initCache()
await rateLimitRuleService.initCache()
await crudRegistry.initFromDb()
jobService.start()

const app = new Elysia()
  .use(cors())
  .use(openapi())
  .use(staticPlugin())
  .use(rateLimitMiddleware())
  .get('/api/health', () => ({ status: 'ok' }))
  .use(createApi())        // 客户端路由 /api/*
  .use(createAdminApi())   // 管理端路由 /api/admin/*
  .listen(3000)
```

## 路由架构

| 前缀 | 用途 | 认证 |
|------|------|------|
| `/api/*` | 客户端接口 | 按需（部分免认证） |
| `/api/admin/*` | 管理端接口 | 强制认证 + RBAC |
| `/` | 客户端 SPA | 无 |
| `/_admin` | 管理端 SPA | 无（前端路由守卫） |
| `/uploads/*` | 上传文件访问 | 无 |
| `/api/health` | 健康检查 | 无 |
| `/api/swagger` | OpenAPI 文档 | 无 |

## 模块清单

### 核心模块

| 模块 | 路径 | 说明 |
|------|------|------|
| [Auth](./modules/auth) | `modules/auth/` | 认证、会话、用户管理 |
| [RBAC](./modules/rbac) | `modules/rbac/` | 角色、权限、菜单、数据权限 |
| [CrudService](./modules/crud-service) | `modules/crud-service.ts` | CRUD 基类 |
| [动态 CRUD](./modules/crud) | `modules/crud/` | 通配 CRUD 接口 |

### 功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| [VIP](./modules/vip) | `modules/vip/` | 会员等级、资源配额 |
| [文件](./modules/file) | `modules/file/` | 文件上传、存储 |
| [通知](./modules/notice) | `modules/notice/` | 通知公告、SSE 推送 |
| [定时任务](./modules/job) | `modules/job/` | Cron 调度、任务日志 |
| [Seed](./modules/seed) | `modules/seed/` | 种子数据、数据库迁移 |

### 系统模块

| 模块 | 路径 | 说明 |
|------|------|------|
| [字典](./modules/dict) | `modules/system/dict/` | 字典类型与数据 |
| [配置](./modules/config) | `modules/system/config/` | 系统参数配置 |
| [操作日志](./modules/oper-log) | `modules/system/oper-log/` | 操作审计日志 |
| [登录日志](./modules/login-log) | `modules/system/login-log/` | 登录审计日志 |
| [API 限流](./modules/rate-limit) | `modules/system/rate-limit/` | 请求限流与 IP 封禁 |
