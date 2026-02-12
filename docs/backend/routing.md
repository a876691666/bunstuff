# 路由体系

## 路由组织

路由在 `modules/index.ts` 中通过两个工厂函数聚合：

```typescript
// 客户端路由 — /api
export function createApi() {
  return new Elysia({ prefix: '/api' })
    .use(authClientApi)      // /api/login, /api/register, /api/logout, /api/me
    .use(rbacClientApi)      // /api/rbac/permissions, /api/rbac/menus
    .use(dictClientApi)      // /api/dict/*
    .use(configClientApi)    // /api/config/*
    .use(noticeClientApi)    // /api/notice/*
    .use(fileClientApi)      // /api/file/*
    .use(crudClientApi)      // /api/crud/:tableName
}

// 管理端路由 — /api/admin
export function createAdminApi() {
  return new Elysia({ prefix: '/api/admin' })
    .use(authAdminApi)       // /api/admin/stats, sessions, kick
    .use(userAdminApi)       // /api/admin/users
    .use(roleAdminApi)       // /api/admin/role
    .use(menuAdminApi)       // /api/admin/menu
    .use(permissionAdminApi) // /api/admin/permission
    .use(permScopeAdminApi)  // /api/admin/permission-scope
    .use(rolePermAdminApi)   // /api/admin/role-permission
    .use(roleMenuAdminApi)   // /api/admin/role-menu
    .use(dictAdminApi)       // /api/admin/dict-type, dict-data
    .use(configAdminApi)     // /api/admin/config
    .use(fileAdminApi)       // /api/admin/file
    .use(noticeAdminApi)     // /api/admin/notice
    .use(jobAdminApi)        // /api/admin/job
    .use(loginLogAdminApi)   // /api/admin/login-log
    .use(operLogAdminApi)    // /api/admin/oper-log
    .use(rateLimitAdminApi)  // /api/admin/rate-limit
    .use(crudAdminApi)       // /api/admin/crud-table
    .use(seedAdminApi)       // /api/admin/seed
    .use(vipAdminApi)        // /api/admin/vip
}
```

## 路由配置

每个路由通过 Elysia 的选项对象声明 Schema、响应类型和元数据：

```typescript
.get('/users', handler, {
  // 查询参数 Schema（TypeBox）
  query: t.Object({
    page: t.Number({ default: 1 }),
    pageSize: t.Number({ default: 10 }),
    filter: t.Optional(t.String()),
  }),

  // 响应 Schema（用于校验和文档生成）
  response: {
    200: PagedResponse(User.getSchema()),
    401: ErrorResponse,
    403: ErrorResponse,
  },

  // 路由元数据
  detail: {
    tags: ['用户管理'],           // OpenAPI 标签
    summary: '获取用户列表',      // OpenAPI 摘要

    // 认证配置
    auth: {
      skipAuth: false,           // 是否跳过认证
    },

    // 权限配置
    rbac: {
      scope: {
        permissions: ['user:admin:list'],  // 需要的权限
        roles: ['admin'],                  // 需要的角色（可选）
      },
    },

    // 操作日志
    operLog: {
      title: '用户管理',          // 操作标题
      type: 'list',              // 操作类型
    },
  },
})
```

## 静态路由

除 API 路由外，后端还提供静态文件服务：

| 路径 | 文件源 | 说明 |
|------|--------|------|
| `/` | `client/` 或 `frontend/client/` | 客户端 SPA |
| `/_admin` | `frontend/` 或 `frontend/frontend/` | 管理端 SPA |
| `/uploads/*` | `uploads/` | 上传文件 |

::: tip SPA 路由回退
所有未匹配的路径（除 `/api` 外）都会回退到对应 SPA 的 `index.html`，交由前端路由处理。
:::

## OpenAPI 文档

通过 `@elysiajs/openapi` 插件自动生成：

- 访问地址：`http://localhost:3000/api/swagger`
- 自动从路由配置提取：
  - 请求参数（query / params / body）
  - 响应类型
  - 标签分组
  - 摘要描述
- Schema 由 `Model.getSchema()` 生成，确保与数据库模型同步
