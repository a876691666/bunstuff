---
name: backend-plugins
description: 后端 Elysia 插件系统开发指南。包含认证(auth)、权限(rbac)、VIP、文件(file)、通知(notice)、字典(dict)、配置(config)、登录日志(loginLog)等插件的使用和扩展方法。关键词：plugin、middleware、derive、context、scope、permission、role
---

# 后端插件系统

基于 Elysia 框架，插件位于 `backend/modules/`。

## 插件概览

| 插件 | 位置 | 功能 | 依赖 |
|------|------|------|------|
| authPlugin | auth/main/plugin.ts | JWT认证,注入session/userId/roleId/rbac | - |
| rbacPlugin | rbac/main/plugin.ts | 权限检查,数据权限过滤,注入dataScope | auth |
| vipPlugin | vip/main/plugin.ts | VIP等级检查,资源限制 | auth |
| filePlugin | file/main/plugin.ts | 文件上传下载 | - |
| noticePlugin | notice/main/plugin.ts | 通知发布,SSE推送 | - |
| dictPlugin | system/dict/plugin.ts | 字典缓存访问 | - |
| configPlugin | system/config/plugin.ts | 配置缓存访问 | - |
| loginLogPlugin | system/login-log/plugin.ts | 登录日志记录 | - |

## 插件详情

### authPlugin
```typescript
// 注入: session, userId, roleId, rbac
app.use(authPlugin())
  .get("/public", () => "ok", { detail: { auth: { skipAuth: true } } })  // 跳过认证
  .get("/private", ({ userId }) => `User: ${userId}`)  // 需要认证
```

### rbacPlugin
```typescript
// 注入: dataScope (getSsqlRules/getScopes)
app.use(authPlugin()).use(rbacPlugin())
  .get("/users", ({ dataScope }) => {
    const rules = dataScope?.getSsqlRules("users")
  }, { detail: { rbac: { scope: { permissions: ["user:read"] } } } })
  .delete("/users/:id", () => {}, { detail: { rbac: { scope: { roles: ["admin"] } } } })
```

### vipPlugin
```typescript
// 注入: vipTierId, vipTierCode, isValidVip, canUseResource, incrementResource, decrementResource, getResourceUsage
app.use(authPlugin()).use(vipPlugin())
  .get("/pro", () => {}, { detail: { vip: { scope: { vipTier: "pro" } } } })
  .post("/scene", async ({ vip }) => {
    if (!await vip.canUseResource("scene:create")) return { error: "资源已达上限" }
    await vip.incrementResource("scene:create")
  })
```

### filePlugin
```typescript
// 注入: getFile, getFileContent, getFileStream, getFileUrl, uploadLocal
app.use(filePlugin())
  .get("/avatar/:id", async ({ file, params }) => {
    const result = await file.getFileContent(params.id)
    return result ? new Response(result.buffer, { headers: { "Content-Type": result.file.mimeType } }) : new Response("Not found", { status: 404 })
  })
```

### noticePlugin
```typescript
// 注入: publishNotice, markAsRead, getUnreadCount, sendToUser
app.use(noticePlugin())
  .post("/broadcast", async ({ notice }) => {
    await notice.publishNotice({ title: "通知", content: "内容", type: "1", status: 1 }, 1)
  })
```

### dictPlugin & configPlugin
```typescript
// dict: getDictMap, getDictList, getDictLabel
// config: getConfigValue, getConfigValueOrDefault
app.use(dictPlugin()).use(configPlugin())
  .get("/info", ({ dict, config }) => {
    const sexLabel = dict.getDictLabel("sys_user_sex", "0")
    const siteName = config.getConfigValue("sys.name")
  })
```

### loginLogPlugin
```typescript
// 注入: logLogin({ userId, username, ip, userAgent, status, action, msg })
app.use(loginLogPlugin())
  .post("/login", async ({ loginLog, body }) => {
    await loginLog.logLogin({ username: body.username, status: 1, action: "login" })
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
// backend/modules/xxx/main/plugin.ts
export function xxxPlugin() {
  return new Elysia({ name: 'xxx-plugin' })
    .derive({ as: 'global' }, () => ({
      xxx: { doSomething: async () => {} }
    }))
}
```

## Seed 模块

```typescript
// backend/models/xxx/seed.ts
const xxxSeed: SeedDefinition = {
  name: 'xxx-default',
  run: async () => { /* 填充逻辑 */ }
}
// 在 seed/main/register.ts 注册
```

执行顺序: role → permission → menu → user → role-permission → role-menu → permission-scope → vip-tier → vip-resource-limit → dict-type → dict-data → sys-config → notice

## API 入口

- 客户端 `/api`: auth, rbac, dict, config, notice, file
- 管理端 `/api/admin`: user, menu, role, permission, vip, loginLog, seed 等全部管理接口
