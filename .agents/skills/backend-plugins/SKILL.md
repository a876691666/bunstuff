---
name: backend-plugins
description: 后端 Elysia 插件系统开发指南。包含认证(auth)、权限(rbac)、VIP、文件(file)、通知(notice)、字典(dict)、配置(config)、登录日志(loginLog)等插件的使用和扩展方法。关键词：plugin、middleware、derive、context、scope、permission、role
---

# 后端插件系统

基于 Elysia 框架，插件位于 `backend/plugins/`。

## 插件概览

| 插件           | 位置              | 功能                                | 依赖 |
| -------------- | ----------------- | ----------------------------------- | ---- |
| authPlugin     | plugins/auth.ts   | JWT认证,注入session/userId/roleId   | -    |
| rbacPlugin     | plugins/rbac.ts   | 权限检查,数据权限过滤,注入dataScope | auth |
| vipPlugin      | plugins/vip.ts    | VIP等级检查,资源限制,注入vip        | auth |
| filePlugin     | plugins/file.ts   | 文件上传下载,注入file               | -    |
| noticePlugin   | plugins/notice.ts | 通知发布,SSE推送,注入notice         | -    |
| dictPlugin     | plugins/dict.ts   | 字典缓存访问,注入dict               | -    |
| configPlugin   | plugins/config.ts | 配置缓存访问,注入config             | -    |
| loginLogPlugin | plugins/login-log.ts | 登录日志记录,注入loginLog        | -    |

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
    { detail: { rbac: { scope: { permissions: ['user:read'] } } } },
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

## 统一响应 R

```typescript
R.ok(data, msg?)      // { code: 0, data }
R.success(msg?)       // { code: 0 }
R.page({ data, total, page, pageSize })
R.fail(msg, code?)    // { code: 400 }
R.notFound(name)      // { code: 404 }
R.unauthorized(msg?)  // { code: 401 }
R.forbidden(msg?)     // { code: 403 }
```

## 路由配置

```typescript
.post("/resource", handler, {
  detail: {
    auth: { skipAuth: false },
    rbac: { scope: { permissions: ['resource:create'] } },
    vip: { scope: { required: true } },
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

## API 入口

- 客户端 `api/`: auth, rbac, dict, config, notice, file（路由位于 `backend/api/_/`）
- 管理端 `api/admin/`: user, menu, role, permission, vip, loginLog, seed 等（路由位于 `backend/api/admin/`）
