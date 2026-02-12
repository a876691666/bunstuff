# 插件开发

## 创建插件

Elysia 插件本质是一个返回 Elysia 实例的函数。通过 `derive` 注入上下文，通过 `onBeforeHandle` 拦截请求。

### 基本模板

```typescript
import Elysia from 'elysia'

export const myPlugin = () => {
  return new Elysia({ name: 'my-plugin' })
    // 注入上下文（每个请求都会执行）
    .derive(async ({ request, store }) => {
      return {
        // 注入到 ctx 中的属性/方法
        myTool: {
          doSomething: () => { /* ... */ },
          getData: () => { /* ... */ },
        },
      }
    })
    // 请求拦截（可选）
    .onBeforeHandle(({ request, set, route }) => {
      // 返回非 undefined 值将中断请求
      // return { code: 403, message: '拒绝访问' }
    })
}
```

### 带配置的插件

```typescript
interface MyPluginOptions {
  prefix?: string
  enabled?: boolean
}

export const myPlugin = (options: MyPluginOptions = {}) => {
  const { prefix = '', enabled = true } = options
  
  return new Elysia({ name: 'my-plugin' })
    .derive(async (ctx) => {
      if (!enabled) return {}
      return {
        myFeature: {
          // ...
        },
      }
    })
}
```

### 带缓存的插件

```typescript
// 缓存管理
class MyCache {
  private cache = new Map<string, any>()
  
  async init() {
    // 启动时全量加载
    const data = await myModel.findMany()
    for (const item of data) {
      this.cache.set(item.key, item.value)
    }
  }
  
  get(key: string) {
    return this.cache.get(key)
  }
  
  async refresh() {
    this.cache.clear()
    await this.init()
  }
}

export const myCache = new MyCache()

// 插件
export const myPlugin = () => {
  return new Elysia({ name: 'my-plugin' })
    .derive(() => ({
      getMyValue: (key: string) => myCache.get(key),
    }))
}
```

## 声明扩展

如果插件需要在路由 `detail` 中添加配置，使用 TypeScript 声明扩展：

```typescript
// 扩展 Elysia 的 DocumentDecoration 接口
declare module 'elysia' {
  interface DocumentDecoration {
    myPlugin?: {
      enabled?: boolean
      level?: number
    }
  }
}
```

使用时：

```typescript
.get('/data', handler, {
  detail: {
    myPlugin: { enabled: true, level: 2 },
  },
})
```

在插件的 `onBeforeHandle` 中读取：

```typescript
.onBeforeHandle(({ route }) => {
  const config = route.detail?.myPlugin
  if (config?.enabled) {
    // 执行逻辑
  }
})
```

## 生命周期钩子

Elysia 提供多个生命周期钩子：

| 钩子 | 执行时机 | 用途 |
|------|----------|------|
| `derive` | 每个请求，handler 之前 | 注入上下文 |
| `onBeforeHandle` | derive 之后，handler 之前 | 请求拦截/权限校验 |
| `onAfterHandle` | handler 之后 | 响应后处理 |
| `onError` | 发生错误时 | 错误处理 |
| `onRequest` | 最早期 | 请求预处理 |

## 注意事项

1. **插件命名**：使用 `name` 属性避免重复注册
2. **作用域**：默认插件作用域为当前实例，使用 `scoped` 控制传播
3. **性能**：`derive` 每次请求都执行，避免重计算，善用缓存
4. **依赖**：确保插件使用顺序正确（如 `rbacPlugin` 必须在 `authPlugin` 之后）
