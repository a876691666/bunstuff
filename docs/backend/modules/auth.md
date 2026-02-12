# 认证模块 (Auth)

## 概述

认证模块提供用户认证、会话管理、用户 CRUD 等功能。位于 `modules/auth/`。

## 模块结构

```
modules/auth/
├── main/
│   ├── plugin.ts       # authPlugin — 全局认证中间件
│   ├── service.ts      # AuthService — 登录/注册/登出逻辑
│   ├── session.ts      # SessionStore — 会话管理
│   ├── api_client.ts   # 客户端路由（登录/注册/个人信息）
│   └── api_admin.ts    # 管理端路由（在线统计/踢出用户）
└── users/
    ├── service.ts      # UserService — 用户 CRUD
    └── api_admin.ts    # 管理端用户管理路由
```

## authPlugin

全局认证插件，通过 `derive` 注入认证上下文：

```typescript
import { authPlugin } from '@/modules/auth/main/plugin'

const api = new Elysia()
  .use(authPlugin())
  // handler 中可直接访问：
  .get('/me', (ctx) => {
    ctx.session     // 当前 Session 对象
    ctx.userId      // 当前用户 ID
    ctx.roleId      // 当前角色 ID
    ctx.rbac        // RBAC 信息（permissions, menus 等）
  })
```

### 认证流程

```
请求进入
  → 提取 Authorization: Bearer <token>
  → sessionStore.getByToken(token)
  → 存在且未过期？
    → 是：注入 session/userId/roleId/rbac → 放行
    → 否：检查 detail.auth.skipAuth
      → 跳过认证：放行（session 为空）
      → 需要认证：返回 401
```

### 跳过认证

在路由 `detail` 中声明 `auth.skipAuth: true`：

```typescript
.get('/public', handler, {
  detail: { auth: { skipAuth: true } },
})
```

## AuthService

核心认证服务：

| 方法 | 说明 |
|------|------|
| `login(username, password)` | 用户名密码登录，返回 token |
| `register(data)` | 用户注册 |
| `logout(token)` | 注销会话 |
| `verifyToken(token)` | 验证 token 有效性 |
| `changePassword(userId, oldPwd, newPwd)` | 修改密码 |
| `getOnlineStats()` | 获取在线统计 |
| `kickUser(userId)` | 踢出指定用户所有会话 |

### 密码处理

使用 Bun 内置的密码哈希：

```typescript
// 注册/创建用户时
const hash = await Bun.password.hash(password)

// 登录验证时
const valid = await Bun.password.verify(password, hash)
```

## SessionStore

内存 + 数据库双存储的会话管理：

### 核心特性

- **Token 生成**：`crypto.randomBytes(32).toString('hex')`，64 字符随机字符串
- **过期时间**：默认 24 小时
- **定时清理**：每 1 分钟清理过期 Session（内存 + 数据库）
- **最后活跃**：每次请求更新 `lastActiveAt`

### 方法

| 方法 | 说明 |
|------|------|
| `init()` | 启动时从数据库加载 Session 到内存 |
| `create(userId, info)` | 创建新 Session |
| `getByToken(token)` | 根据 token 查找 Session |
| `delete(token)` | 删除指定 Session |
| `deleteByUserId(userId)` | 删除用户所有 Session |
| `getAll()` | 获取所有在线 Session |

## 客户端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/login` | 登录 |
| POST | `/api/register` | 注册 |
| POST | `/api/logout` | 登出 |
| GET | `/api/me` | 获取当前用户信息 |
| POST | `/api/change-password` | 修改密码 |

## 管理端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 在线用户统计 |
| GET | `/api/admin/sessions` | 在线会话列表 |
| POST | `/api/admin/kick-user` | 踢出指定用户 |
| POST | `/api/admin/kick-session` | 踢出指定会话 |

## 用户管理

`UserService` 继承 `CrudService`，提供标准 CRUD + 额外方法：

```typescript
class UserService extends CrudService<typeof User.schemaInstance> {
  constructor() { super(User) }
  
  // 额外方法
  async findByUsername(username: string) { ... }
}
```

### 管理端用户 API

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/admin/users` | `user:admin:list` | 用户列表 |
| GET | `/api/admin/users/:id` | `user:admin:read` | 用户详情 |
| POST | `/api/admin/users` | `user:admin:create` | 创建用户 |
| PUT | `/api/admin/users/:id` | `user:admin:update` | 更新用户 |
| DELETE | `/api/admin/users/:id` | `user:admin:delete` | 删除用户 |
