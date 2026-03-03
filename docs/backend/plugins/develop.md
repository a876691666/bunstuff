# 插件开发

本节介绍如何开发自定义 Elysia 插件，融入 Bunstuff 的插件体系。

## 🎯 插件结构

每个插件都是一个返回 `Elysia` 实例的工厂函数：

```typescript
import { Elysia } from 'elysia'

export function myPlugin() {
  return new Elysia({ name: 'my-plugin' })
    .derive({ as: 'global' }, (ctx) => {
      // 注入上下文
      return {
        myService: {
          doSomething: () => { /* ... */ },
        },
      }
    })
}
```

::: tip 命名规范
- 插件文件放在 `backend/plugins/` 目录
- 函数名使用 `xxxPlugin()` 格式
- Elysia name 使用 `xxx-plugin` 格式（kebab-case）
:::

## 📝 注入型插件模板

最简单的插件类型，仅向上下文添加服务对象：

```typescript
import { Elysia } from 'elysia'
import * as myService from '@/services/my-service'

/** 上下文类型 */
export interface MyContext {
  getData: (id: number) => Promise<any>
  create: (data: any) => Promise<any>
}

export function myPlugin() {
  return new Elysia({ name: 'my-plugin' })
    .derive({ as: 'global' }, () => {
      const my: MyContext = {
        getData: myService.findById,
        create: myService.create,
      }
      return { my }
    })
}
```

## 🛡️ 拦截型插件模板

在 `onBeforeHandle` 中执行校验逻辑：

```typescript
import { Elysia } from 'elysia'

// 扩展路由配置类型
declare module 'elysia' {
  interface DocumentDecoration {
    myCheck?: {
      required: boolean
    }
  }
}

export function myCheckPlugin() {
  const routerHooksMap = new Map<string, any>()

  return new Elysia({ name: 'my-check-plugin' })
    // 启动时缓存路由 hooks
    .on('start', (app) => {
      // @ts-ignore
      app.getGlobalRoutes().forEach((route: any) => {
        routerHooksMap.set(
          `${route.method}:::${route.path}`,
          route.hooks || {}
        )
      })
    })
    // 请求拦截
    .onBeforeHandle({ as: 'global' }, ({ request, set }) => {
      const key = `${request.method}:::${new URL(request.url).pathname}`
      const hooks = routerHooksMap.get(key) || {}
      const config = hooks?.detail?.myCheck

      if (config?.required) {
        // 校验逻辑...
        if (!isValid) {
          set.status = 403
          return { code: 403, message: '校验失败' }
        }
      }
    })
}
```

## 🪝 钩子型插件模板

在请求处理后执行后置逻辑（如日志记录）：

```typescript
import { Elysia } from 'elysia'

declare module 'elysia' {
  interface DocumentDecoration {
    myLog?: { title: string }
  }
}

export function myLogPlugin() {
  const routerHooksMap = new Map<string, any>()

  return new Elysia({ name: 'my-log-plugin' })
    .on('start', (app) => {
      // @ts-ignore
      app.getGlobalRoutes().forEach((route: any) => {
        routerHooksMap.set(
          `${route.method}:::${route.path}`,
          route.hooks || {}
        )
      })
    })
    .derive({ as: 'global' }, () => {
      return { __startTime: Date.now() }
    })
    // 成功后记录
    .onAfterHandle({ as: 'global' }, async (ctx) => {
      const hooks = routerHooksMap.get(
        `${ctx.request.method}:::${(ctx as any).route}`
      ) || {}
      const config = hooks?.detail?.myLog
      if (!config) return

      console.log(`[${config.title}] ${Date.now() - (ctx as any).__startTime}ms`)
    })
    // 异常时记录
    .onError({ as: 'global' }, async (ctx) => {
      const hooks = routerHooksMap.get(
        `${ctx.request.method}:::${(ctx as any).route}`
      ) || {}
      const config = hooks?.detail?.myLog
      if (!config) return

      console.error(`[${config.title}] Error: ${(ctx as any).error?.message}`)
    })
}
```

## 🔗 注册插件

将插件添加到对应的路由组中：

```typescript
// backend/api/admin/index.ts
import { myPlugin } from '@/plugins/my-plugin'

export default new Elysia({ prefix: '/api/admin' })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(myPlugin())    // 注册自定义插件
  .use(usersRoute)
```

## ⚠️ 注意事项

| 要点 | 说明 |
|------|------|
| `as: 'global'` | `derive` 和 `onBeforeHandle` 必须设置 `as: 'global'` 才能作用于所有子路由 |
| 插件名称唯一 | `new Elysia({ name })` 的 name 必须全局唯一，重复注册会被跳过 |
| 返回值中断 | `onBeforeHandle` 中 return 值即中断请求，不再执行后续插件和路由处理 |
| 服务层解耦 | 插件仅做薄封装，业务逻辑应委托给 `services/` 下的对应模块 |
| 类型扩展 | 使用 `declare module 'elysia'` 扩展 `DocumentDecoration` 实现路由配置类型安全 |
