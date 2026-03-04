# 启动流程

后端采用严格的 9 步启动流程，确保各组件按依赖顺序初始化。

## 🚀 启动步骤

```
┌─────────────────────────────────────────────────────┐
│          阶段 1: 数据初始化 (Seed)                    │
│  runSeeds() → 执行 20 个 Seed，确保基础数据就绪       │
├─────────────────────────────────────────────────────┤
│          阶段 2: 缓存初始化                           │
│  session.init()       → 恢复未过期会话到内存          │
│  rbacService.init()   → 全量加载角色/权限/菜单        │
│  dictService.init()   → 全量加载字典数据              │
│  configService.init() → 全量加载系统配置              │
│  rateLimitService()   → 加载限流规则和 IP 黑名单      │
├─────────────────────────────────────────────────────┤
│          阶段 3: 服务启动                             │
│  jobService.start()   → 启动定时任务调度              │
│  app.listen(3000)     → 启动 HTTP 服务                │
└─────────────────────────────────────────────────────┘
```

### 详细步骤

| 步骤 | 方法                           | 耗时   | 说明                                         |
| ---- | ------------------------------ | ------ | -------------------------------------------- |
| 1    | `runSeeds()`                   | ~500ms | 执行所有 Seed，跳过已执行的（基于 seed_log） |
| 2    | `session.init()`               | ~10ms  | 从 DB 加载未过期 Session 到 Map 内存缓存     |
| 3    | `rbacService.init()`           | ~50ms  | 加载角色/权限/菜单/权限范围/关联关系到内存   |
| 4    | `dictService.initCache()`      | ~10ms  | 加载所有字典类型和字典数据                   |
| 5    | `configService.initCache()`    | ~10ms  | 加载所有系统配置                             |
| 6    | `rateLimitService.initCache()` | ~10ms  | 加载限流规则 + IP 黑名单                     |
| 7    | `jobService.start()`           | ~10ms  | 根据 job 表注册 Cron 定时任务                |
| 8    | `app.listen(3000)`             | ~5ms   | 构建 Elysia 应用并开始监听                   |

> ⚠️ **注意**: 各步骤有严格的依赖关系。例如 RBAC 缓存依赖 Seed 创建的基础角色数据，字典缓存依赖 Seed 创建的基础字典数据。

## 🌱 Seed 执行顺序

20 个核心 Seed 按依赖关系排序执行：

| 顺序 | Seed                 | 说明                             |
| ---- | -------------------- | -------------------------------- |
| 1    | `role`               | 创建默认角色（admin/user）       |
| 2    | `users`              | 创建管理员账号（admin/admin123） |
| 3    | `menu`               | 创建菜单树（目录/菜单/按钮）     |
| 4    | `dict-type`          | 创建字典类型                     |
| 5    | `dict-data`          | 创建字典数据                     |
| 6    | `sys-config`         | 创建系统配置                     |
| 7    | `session`            | 会话表初始化                     |
| 8    | `login-log`          | 登录日志表初始化                 |
| 9    | `oper-log`           | 操作日志表初始化                 |
| 10   | `notice`             | 通知表初始化                     |
| 11   | `notice-read`        | 通知已读表初始化                 |
| 12   | `sys-file`           | 文件表初始化                     |
| 13   | `job`                | 定时任务初始化                   |
| 14   | `job-log`            | 任务日志初始化                   |
| 15   | `rate-limit-rule`    | 限流规则初始化                   |
| 16   | `ip-blacklist`       | IP 黑名单初始化                  |
| 17   | `seed-log`           | Seed 日志初始化                  |
| 18   | `vip-tier`           | VIP 等级初始化                   |
| 19   | `vip-resource-limit` | VIP 资源限制初始化               |

::: tip Seed 机制
每个 Seed 执行后会写入 `seed_log` 表记录，下次启动时跳过已成功执行的 Seed，避免重复执行。管理端可手动触发重新执行。
:::

## 💾 缓存策略

| 缓存          | 存储方式              | 刷新机制                     | 说明              |
| ------------- | --------------------- | ---------------------------- | ----------------- |
| **Session**   | `Map<token, session>` | CRUD 时自动同步内存 + DB     | 1min 定期清理过期 |
| **RBAC**      | 6 个 Map 缓存         | 角色/权限/菜单变更时全量刷新 | 查询零 DB 访问    |
| **Dict**      | `Map<type, data[]>`   | 字典变更时自动刷新           | 查询零 DB 访问    |
| **Config**    | `Map<key, value>`     | 配置变更时自动刷新           | 查询零 DB 访问    |
| **RateLimit** | 内存计数器            | 规则变更时重新加载           | 滑动窗口算法      |

## 🔧 入口文件说明

入口文件 `backend/index.ts` 的核心逻辑：

```typescript
// 阶段 1: Seed
await runSeeds({ autoRun: true })

// 阶段 2: 缓存
await session.init()
await rbacService.init()
await dictService.initCache()
await configService.initCache()
await rateLimitService.initCache()

// 阶段 3: 启动
await jobService.start()

const app = new Elysia()
  .use(cors())                    // CORS 跨域
  .use(openapi({ ... }))         // OpenAPI 文档
  .use(staticPlugin({ ... }))    // 静态文件（uploads/）
  .use(staticPlugin({ ... }))    // 客户端前端
  .use(staticPlugin({ ... }))    // 管理端前端
  .use(rateLimitPlugin)          // 全局限流
  .use(api)                      // API 路由
  .listen(3000)
```

### Elysia 中间件链

```
请求 → CORS → OpenAPI → 静态文件（uploads） → 静态文件（客户端）
     → 静态文件（管理端） → 限流插件 → API 路由 → 响应
```

静态文件服务配置：

| 路径前缀    | 资源目录    | 说明                   |
| ----------- | ----------- | ---------------------- |
| `/uploads/` | `uploads/`  | 文件上传目录           |
| `/`         | `client/`   | 客户端前端（SPA 回退） |
| `/_admin/`  | `frontend/` | 管理端前端（SPA 回退） |

::: warning SPA 回退
客户端和管理端均配置了 SPA 回退，非 API 路由且非静态文件的请求会返回 `index.html`，支持前端路由。
:::
