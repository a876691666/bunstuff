# 路由体系

Bunstuff 采用基于文件系统的路由组织方式，通过 `createApi()` / `createAdminApi()` 工厂函数聚合所有路由。

## 🏗️ 路由架构

```
/api/_/         ← 客户端 API（7 条路由）    createApi()
/api/admin/     ← 管理端 API（18 条路由）   createAdminApi()
/uploads/       ← 静态文件服务
/               ← 客户端前端 SPA
/_admin/        ← 管理端前端 SPA
/openapi        ← OpenAPI 文档
```

## 📁 路由文件结构

```
api/
├── _/                          # 客户端路由（前缀 /api/_/）
│   ├── auth/index.ts           # 认证（登录/注册/登出）
│   ├── config/index.ts         # 配置查询
│   ├── crud/index.ts           # 动态 CRUD
│   ├── dict/index.ts           # 字典查询
│   ├── file/index.ts           # 文件上传下载
│   ├── notice/index.ts         # 通知 + SSE
│   └── rbac/index.ts           # 权限查询
│
└── admin/                      # 管理端路由（前缀 /api/admin/）
    ├── auth/index.ts           # 会话管理
    ├── users/                  # 用户 CRUD
    │   ├── index.ts            # 路由定义
    │   └── policy.ts           # 权限策略
    ├── role/                   # 角色 CRUD
    │   ├── index.ts
    │   └── policy.ts
    ├── menu/                   # 菜单 CRUD
    │   ├── index.ts
    │   └── policy.ts
    └── ...                     # 其他管理模块
```

## 🔧 路由工厂函数

### `createApi()` — 客户端路由

组装所有客户端路由，挂载到 `/api/_/` 前缀：

```typescript
import { Elysia } from 'elysia'
import { authPlugin } from '@/plugins/auth'

export function createApi() {
  return new Elysia({ prefix: '/api/_' })
    .use(authPlugin) // 认证插件（注入 session/userId/roleId）
    .use(authRoute) // /api/_/auth
    .use(rbacRoute) // /api/_/rbac
    .use(dictRoute) // /api/_/dict
    .use(configRoute) // /api/_/config
    .use(noticeRoute) // /api/_/notice
    .use(fileRoute) // /api/_/file
    .use(crudRoute) // /api/_/crud
}
```

### `createAdminApi()` — 管理端路由

组装所有管理端路由，挂载到 `/api/admin/` 前缀，额外加载 RBAC 和操作日志插件：

```typescript
export function createAdminApi() {
  return new Elysia({ prefix: '/api/admin' })
    .use(authPlugin) // 认证插件
    .use(rbacPlugin) // 权限插件（校验权限 + 注入数据权限）
    .use(operLogPlugin) // 操作日志插件
    .use(usersRoute) // /api/admin/users
    .use(roleRoute) // /api/admin/role
    .use(menuRoute) // /api/admin/menu
    .use(rbacRoute) // /api/admin/rbac
    .use(dictRoute) // /api/admin/dict
    .use(configRoute) // /api/admin/config
  // ... 其他管理端路由
}
```

## 📋 路由配置详解

每条路由通过第三个参数配置 Schema、安全、权限、日志等：

```typescript
.get('/list', async ({ query, dataScope }) => {
  const result = await service.findAll(query, dataScope)
  return R.page(result)
}, {
  // 1. 请求 Schema
  query: service.getSchema('query'),     // 查询参数 Schema

  // 2. 响应 Schema
  response: {
    200: PagedResponse(service.getSchema()),
  },

  // 3. OpenAPI 文档
  detail: {
    tags: ['管理 - 用户'],               // API 分组
    summary: '用户列表',                  // 接口摘要
    description: '查询用户分页列表',       // 接口描述

    // 4. 安全配置
    security: [{ bearerAuth: [] }],      // 需要 JWT Token

    // 5. 认证配置
    auth: {
      skipAuth: false,                   // 是否跳过认证（默认 false）
    },

    // 6. 权限配置
    rbac: {
      permissions: ['user:admin:list'],  // 需要的权限
      roles: ['admin'],                  // 需要的角色（可选）
      scope: 'user:admin:list',          // 数据权限标识
    },

    // 7. 操作日志配置
    operLog: {
      title: '用户管理',                  // 模块名
      type: 'list',                      // 操作类型
    },
  },
})
```

### `detail` 配置项

| 配置项             | 类型       | 说明                                       |
| ------------------ | ---------- | ------------------------------------------ |
| `tags`             | `string[]` | OpenAPI 分组标签                           |
| `summary`          | `string`   | 接口摘要                                   |
| `security`         | `object[]` | 安全策略（bearerAuth）                     |
| `auth.skipAuth`    | `boolean`  | 跳过认证检查                               |
| `rbac.permissions` | `string[]` | 需要的权限列表                             |
| `rbac.roles`       | `string[]` | 需要的角色列表                             |
| `rbac.scope`       | `string`   | 数据权限标识                               |
| `operLog.title`    | `string`   | 操作日志模块名                             |
| `operLog.type`     | `string`   | 操作类型：list/create/update/delete/export |

## 🔄 Schema 自动生成

路由 Schema 通过 `service.getSchema()` 从 ORM 模型自动生成，无需手动定义：

```typescript
// ✅ 推荐：内联使用 getSchema()
.get('/list', handler, {
  query: service.getSchema('query'),           // 分页 + filter 参数
  response: { 200: PagedResponse(service.getSchema()) },
})

.post('/', handler, {
  body: service.getSchema('body'),             // 创建表单
  response: { 200: SuccessResponse() },
})

.put('/:id', handler, {
  params: service.getSchema('idParams'),       // { id: number }
  body: service.getSchema('updateBody'),       // 更新表单（所有字段可选）
  response: { 200: SuccessResponse() },
})

.delete('/:id', handler, {
  params: service.getSchema('idParams'),
  response: { 200: SuccessResponse() },
})
```

> 📖 详细 Schema 生成规则请查看 [Route Model](/packages/route-model)。

## 📡 OpenAPI 文档

后端自动生成 OpenAPI 3.0 文档，访问地址：`http://localhost:3000/openapi`

文档按标签分组，覆盖所有客户端和管理端接口：

| 分组              | 说明               |
| ----------------- | ------------------ |
| 客户端 - 认证     | 登录、注册、登出等 |
| 客户端 - RBAC权限 | 当前用户权限查询   |
| 客户端 - 字典     | 字典数据查询       |
| 客户端 - 通知公告 | 通知查询、SSE      |
| 客户端 - 文件     | 文件上传下载       |
| 管理 - 用户       | 用户 CRUD          |
| 管理 - 角色       | 角色 CRUD          |
| 管理 - 菜单       | 菜单 CRUD          |
| 管理 - 权限       | 权限管理           |
| ...               | 共 25+ 分组        |
