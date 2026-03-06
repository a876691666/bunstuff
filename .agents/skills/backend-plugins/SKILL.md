---
name: backend-plugins
description: 后端 Elysia 插件系统开发指南。包含认证(auth)、权限(rbac)、VIP、操作日志(operLog)、文件(file)、通知(notice)、字典(dict)、配置(config)、登录日志(loginLog)、限流(rateLimit)、定时任务(job)等插件的使用和扩展方法。关键词：plugin、middleware、derive、context、scope、permission、role
---

# 后端插件系统

基于 Elysia 框架，插件位于 `backend/plugins/`。

## 插件概览

| 插件             | 位置                    | 功能                                | 依赖 |
| ---------------- | ----------------------- | ----------------------------------- | ---- |
| authPlugin       | plugins/auth.ts         | JWT认证,注入session/userId/roleId   | -    |
| rbacPlugin       | plugins/rbac.ts         | 权限检查,数据权限过滤,注入dataScope | auth |
| vipPlugin        | plugins/vip.ts          | VIP等级检查,资源限制,注入vip        | auth |
| operLogPlugin    | plugins/oper-log.ts     | 操作日志自动/手动记录,注入operLog   | auth |
| filePlugin       | plugins/file.ts         | 文件上传下载,注入file               | -    |
| noticePlugin     | plugins/notice.ts       | 通知发布,SSE推送,注入notice         | -    |
| dictPlugin       | plugins/dict.ts         | 字典缓存访问,注入dict               | -    |
| configPlugin     | plugins/config.ts       | 配置缓存访问,注入config             | -    |
| loginLogPlugin   | plugins/login-log.ts    | 登录日志记录,注入loginLog           | -    |
| rateLimitPlugin  | plugins/rate-limit.ts   | 请求限流,IP黑名单,自动封禁          | -    |
| jobPlugin        | plugins/job.ts          | 定时任务触发/执行,注入job            | -    |

## 插件详情

### authPlugin

```typescript
// 注入: session, userId, roleId
import { authPlugin } from '@/plugins/auth'

app
  .use(authPlugin())
  .get('/public', () => 'ok', { detail: { auth: { skipAuth: true } } }) // 跳过认证
  .get('/private', ({ userId }) => `User: ${userId}`) // 需要认证
```

### rbacPlugin

```typescript
// 注入: dataScope (getSsqlRules/allScopes)
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'

app
  .use(authPlugin())
  .use(rbacPlugin())
  .get(
    '/users',
    ({ dataScope }) => {
      const rules = dataScope?.getSsqlRules('users')
    },
    { detail: { rbac: { scope: { permissions: ['user:admin:list'] } } } },
  )
  .delete('/users/:id', () => {}, { detail: { rbac: { scope: { roles: ['admin'] } } } })
```

### vipPlugin

```typescript
// 注入: vip { vipTierId, vipTierCode, bindingStatus, isValidVip, canUseResource, incrementResource, decrementResource, getResourceUsage }
import { authPlugin } from '@/plugins/auth'
import { vipPlugin } from '@/plugins/vip'

app
  .use(authPlugin())
  .use(vipPlugin())
  .get('/pro', () => {}, { detail: { vip: { scope: { vipTier: 'pro' } } } })
  .post('/scene', async ({ vip }) => {
    if (!(await vip.canUseResource('scene:create'))) return { error: '资源已达上限' }
    await vip.incrementResource('scene:create')
  })
```

### operLogPlugin

```typescript
// 注入: operLog { log }
import { authPlugin } from '@/plugins/auth'
import { operLogPlugin } from '@/plugins/oper-log'

app
  .use(authPlugin())
  .use(operLogPlugin())

  // 方式1: 自动记录（推荐）— 通过 detail.operLog 配置
  .post('/users', async (ctx) => {
    const user = await userService.create(ctx.body, ctx)
    return R.ok(user)
  }, {
    detail: {
      operLog: { title: '用户管理', type: 'create' },
    },
  })

  // 方式2: 手动记录 — 通过注入的 operLog.log()
  .post('/users/:id/reset-password', async ({ operLog }) => {
    await operLog.log({ title: '重置密码', type: 'update' })
    return R.success()
  })
```

### filePlugin

```typescript
// 注入: file { getFile, getFileContent, getFileStream, getFileUrl, uploadLocal }
import { filePlugin } from '@/plugins/file'

app.use(filePlugin()).get('/avatar/:id', async ({ file, params }) => {
  const result = await file.getFileContent(params.id)
  return result
    ? new Response(result.buffer, { headers: { 'Content-Type': result.file.mimeType } })
    : new Response('Not found', { status: 404 })
})
```

### noticePlugin

```typescript
// 注入: notice { publishNotice, markAsRead, getUnreadCount, sendToUser }
import { noticePlugin } from '@/plugins/notice'

app.use(noticePlugin()).post('/broadcast', async ({ notice }) => {
  await notice.publishNotice({ title: '通知', content: '内容', type: '1', status: 1 }, 1)
})
```

### dictPlugin & configPlugin

```typescript
// dict: { getDictMap, getDictList, getDictLabel }
// config: { getConfigValue, getConfigValueOrDefault }
import { dictPlugin } from '@/plugins/dict'
import { configPlugin } from '@/plugins/config'

app
  .use(dictPlugin())
  .use(configPlugin())
  .get('/info', ({ dict, config }) => {
    const sexLabel = dict.getDictLabel('sys_user_sex', '0')
    const siteName = config.getConfigValue('sys.name')
  })
```

### loginLogPlugin

```typescript
// 注入: loginLog { logLogin({ userId, username, ip, userAgent, status, action, msg }) }
import { loginLogPlugin } from '@/plugins/login-log'

app.use(loginLogPlugin()).post('/login', async ({ loginLog, body }) => {
  await loginLog.logLogin({ username: body.username, status: 1, action: 'login' })
})
```

### jobPlugin

```typescript
// 注入: job { trigger, execute, getHandlers }
import { jobPlugin } from '@/plugins/job'

app.use(jobPlugin()).post('/trigger-cleanup', async ({ job }) => {
  const result = await job.trigger('clearExpiredSessions')
  return result
})
```

## 统一响应 R

```typescript
R.ok(data, msg?)              // { code: 0, data, msg }
R.success(msg?)               // { code: 0, msg }
R.page({ data, total, ... })  // { code: 0, data, total, page, pageSize }
R.fail(msg, code?)            // { code, msg }
R.badRequest(msg)             // { code: 400, msg }
R.notFound(name)              // { code: 404, msg: '${name}不存在' }
R.unauthorized(msg?)          // { code: 401, msg }
R.forbidden(msg?)             // { code: 403, msg }
R.serverError(msg?)           // { code: 500, msg }
```

## 路由配置

```typescript
.post("/resource", handler, {
  detail: {
    auth: { skipAuth: false },
    security: [{ bearerAuth: [] }],
    rbac: { scope: { permissions: ['resource:admin:create'] } },
    vip: { scope: { required: true } },
    operLog: { title: '资源管理', type: 'create' },
  }
})
```

## 创建新插件

```typescript
// backend/plugins/xxx.ts
import { Elysia } from 'elysia'

export function xxxPlugin() {
  return new Elysia({ name: 'xxx-plugin' }).derive({ as: 'global' }, () => ({
    xxx: { doSomething: async () => {} },
  }))
}

export default xxxPlugin
```

## Seed 模块

```typescript
// backend/models/xxx/seed.ts
import type { SeedDefinition } from '@/services/seed'

export const xxxSeed: SeedDefinition = {
  name: 'xxx-default',
  dependencies: ['role'], // 可选，声明依赖的 seed 名称
  run: async () => {
    /* 填充逻辑 */
  },
}

export default xxxSeed
```

Seed 文件放在 `backend/models/xxx/seed.ts` 后，运行 `bun run generate` 自动注册（生成 `_generated/seeds.generated.ts`）。

## 模块配置（config.ts）

每个 API 模块通过 `config.ts` 定义权限、角色分配、菜单等：

```typescript
// backend/api/admin/xxx/config.ts
import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'xxx',
  name: '管理 - XX',           // OpenAPI Tag 名称，同时自动分配为路由的 tags
  description: 'XX管理接口',    // OpenAPI Tag 描述
  permissions: [
    { code: 'xxx:admin:list', name: '查看列表' },
    { code: 'xxx:admin:create', name: '创建' },
  ],
  roles: {
    'super-admin': '*',
    admin: '*',
  },
  menus: [/* 可选：菜单定义 */],
})
```

运行 `bun run generate` 自动注册到 `_generated/configs.generated.ts`。

## API 入口

- 客户端 `api/`：auth, rbac, dict, config, notice, file, topology 等（路由位于 `backend/api/_/`）
- 管理端 `api/admin/`：users, role, config, dict, notice, file, job, seed, vip, topology 等（路由位于 `backend/api/admin/`）

## 管理端标准插件链

```typescript
// 管理端路由标准插件组合
export default new Elysia()
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())
```
