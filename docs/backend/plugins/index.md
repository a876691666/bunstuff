# 插件系统

Bunstuff 后端采用 Elysia 插件模式组织横切关注点。所有插件均通过 `derive({ as: 'global' })` 向路由上下文注入服务对象，部分插件还通过 `onBeforeHandle` 实现拦截校验。

## 🎯 插件一览

| 插件 | 文件 | 类型 | 注入上下文 | 说明 |
|------|------|------|----------|------|
| `authPlugin` | `plugins/auth.ts` | 拦截 + 注入 | `session`, `userId`, `roleId` | 认证校验 |
| `rbacPlugin` | `plugins/rbac.ts` | 拦截 + 注入 | `dataScope` | 权限校验 |
| `vipPlugin` | `plugins/vip.ts` | 拦截 + 注入 | `vip` | VIP 等级 / 资源检查 |
| `operLogPlugin` | `plugins/oper-log.ts` | 钩子 + 注入 | `operLog` | 操作日志自动记录 |
| `loginLogPlugin` | `plugins/login-log.ts` | 注入 | `loginLog` | 登录日志记录 |
| `rateLimitPlugin` | `plugins/rate-limit.ts` | 拦截 + 注入 | `rateLimit` | 限流与黑名单 |
| `filePlugin` | `plugins/file.ts` | 注入 | `file` | 文件读写访问 |
| `noticePlugin` | `plugins/notice.ts` | 注入 | `notice` | 通知推送 |
| `dictPlugin` | `plugins/dict.ts` | 注入 | `dict` | 字典数据 |
| `configPlugin` | `plugins/config.ts` | 注入 | `config` | 系统配置 |
| `jobPlugin` | `plugins/job.ts` | 注入 | `job` | 任务触发 |

## 📦 插件分类

### 拦截型插件

在 `onBeforeHandle` 生命周期中执行校验，不通过则直接返回错误响应：

```
请求 → rateLimitPlugin（限流拦截 403/429）
     → authPlugin（认证拦截 401）
     → rbacPlugin（权限拦截 403）
     → vipPlugin（VIP 校验 403）
     → 路由处理函数
```

### 注入型插件

纯 `derive` 插件，仅向上下文添加服务对象，不做拦截：

```typescript
// filePlugin 注入 file 上下文
app.use(filePlugin())
app.get('/download/:id', async ({ file, params }) => {
  const stream = await file.getStream(params.id)
  return stream
})
```

### 钩子型插件

在 `onAfterHandle` / `onError` 中执行后置逻辑：

```typescript
// operLogPlugin 在请求结束后自动记录日志
app.use(operLogPlugin())
app.post('/users', handler, {
  detail: { operLog: { title: '用户管理', type: 'create' } }
})
```

## 🔧 路由级配置

auth / rbac / vip / operLog 四个插件支持通过路由 `detail` 声明配置：

```typescript
app.post('/sensitive-action', handler, {
  detail: {
    // 认证配置
    auth: { skipAuth: false },
    // 权限配置
    rbac: {
      scope: {
        permissions: ['action:admin:create'],
        roles: ['super-admin', 'admin'],
      }
    },
    // VIP 配置
    vip: {
      scope: { minTier: 'pro', resource: 'api_calls' }
    },
    // 操作日志配置
    operLog: { title: '敏感操作', type: 'create' },
  }
})
```

这些配置通过扩展 Elysia 的 `DocumentDecoration` 类型实现类型安全，在插件的 `on('start')` 钩子中缓存到 `routerHooksMap`，运行时 O(1) 查表。

## 📋 插件使用顺序

插件的注册顺序决定了执行顺序，推荐如下：

```typescript
const app = new Elysia()
  // 1. 全局中间件
  .use(rateLimitPlugin())        // 限流（最外层）
  // 2. 认证相关
  .use(authPlugin())             // 认证
  .use(loginLogPlugin())         // 登录日志
  // 3. 权限相关
  .use(rbacPlugin())             // RBAC 权限
  .use(vipPlugin())              // VIP 校验
  // 4. 功能插件
  .use(operLogPlugin())          // 操作日志
  .use(filePlugin())             // 文件
  .use(noticePlugin())           // 通知
  .use(dictPlugin())             // 字典
  .use(configPlugin())           // 配置
  .use(jobPlugin())              // 任务
```

::: warning 注意
`authPlugin` 必须在 `rbacPlugin` / `vipPlugin` 之前注册，因为权限检查依赖认证注入的 `session` / `roleId`。
:::
