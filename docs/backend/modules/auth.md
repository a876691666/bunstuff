# 🔐 认证模块 (Auth)

认证模块提供完整的用户身份验证能力，包含登录注册、会话管理、密码处理和在线用户管理功能。

## 📖 模块概览

| 组件 | 路径 | 说明 |
|------|------|------|
| `authPlugin` | `plugins/auth.ts` | 全局认证中间件，注入 `session`、`userId`、`roleId` |
| `AuthService` | `services/auth.ts` | 登录、注册、修改密码等业务逻辑 |
| `SessionStore` | `services/session.ts` | 内存 + 数据库双层会话存储 |
| `UserService` | `services/user.ts` | 用户 CRUD 服务（基于 `buildWhere` 数据权限） |

## 🔌 authPlugin 认证插件

`authPlugin` 是全局认证中间件，默认对所有路由启用。通过 `derive` 注入认证上下文，在 `onBeforeHandle` 中执行令牌校验。

### 注入上下文

```typescript
interface AuthContext {
  session: Session | null    // 完整会话对象
  userId: number | null      // 当前用户 ID
  roleId: string | null      // 当前角色编码
}
```

### 认证流程

```
请求进入
  │
  ├─ derive 阶段（全局）
  │   ├─ 从 Authorization header 提取 Bearer Token
  │   ├─ 调用 session.verify(token) 验证令牌
  │   └─ 注入 session / userId / roleId（无效则为 null）
  │
  └─ onBeforeHandle 阶段（全局）
      ├─ 检查路由配置 detail.auth.skipAuth
      ├─ 若 skipAuth === true → 放行
      ├─ 若路径匹配 excludePaths → 放行
      └─ 若 session 为 null → 返回 401
```

### 配置选项

```typescript
interface AuthPluginOptions {
  /** 自定义 Token 提取方式，默认从 Authorization header 提取 */
  extractToken?: (request: Request) => string | null
  /** 无需认证的路径（支持通配符 *） */
  excludePaths?: string[]
}
```

默认排除路径：

```typescript
const DEFAULT_EXCLUDE_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
  '/'
]
```

### 跳过认证

在路由的 `detail` 配置中设置 `auth.skipAuth: true`：

```typescript
app.get('/public', () => 'public data', {
  detail: {
    auth: { skipAuth: true },
    summary: '公开接口'
  }
})
```

:::tip 最佳实践
仅在登录、注册、健康检查等公开接口上使用 `skipAuth`。所有业务接口都应要求认证。
:::

## 🛡️ AuthService 认证服务

### login - 用户登录

```typescript
async function login(
  username: string,
  password: string,
  options?: { ip?: string; userAgent?: string }
): Promise<LoginResult>
```

**登录流程：**

1. 根据用户名查找用户
2. 检查用户状态（`status !== 1` 则拒绝）
3. 使用 `Bun.password.verify()` 验证密码
4. 调用 `session.create()` 创建会话
5. 返回 Token 和用户基本信息

**返回结构：**

```typescript
interface LoginResult {
  success: boolean
  message: string
  token?: string          // 64 位随机令牌
  user?: {
    id: number
    username: string
    nickname: string | null
    email: string | null
    avatar: string | null
    roleId: string        // 角色编码
  }
}
```

### register - 用户注册

```typescript
async function register(data: {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  roleId?: string         // 默认 'user'
}): Promise<RegisterResult>
```

注册流程会检查用户名和邮箱的唯一性，使用 `Bun.password.hash()` (Argon2) 对密码进行哈希。

### changePassword - 修改密码

```typescript
async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }>
```

验证旧密码后，使用 Argon2 哈希新密码并更新。

### getCurrentUser - 获取当前用户

```typescript
async function getCurrentUser(token: string): Promise<UserInfo | null>
```

返回用户信息（不含密码），附带会话元数据（创建/过期/最后活跃时间）。

## 💾 SessionStore 会话存储

会话采用 **内存 + 数据库双层存储** 架构，内存保证读取性能，数据库保证持久化。

### 存储架构

| 层级 | 数据结构 | 说明 |
|------|----------|------|
| 内存层 | `Map<token, Session>` | 主要读写层，O(1) 查找 |
| 内存索引 | `Map<userId, Set<token>>` | 用户维度索引，支持踢下线 |
| 持久层 | `session` 数据表 | 重启后可恢复 |

### 会话结构

```typescript
interface Session {
  id: number              // 数据库 ID
  token: string           // 64 字符随机令牌
  userId: number          // 用户 ID
  username: string        // 用户名
  roleId: string          // 角色编码
  createdAt: Date         // 创建时间
  expiresAt: Date         // 过期时间（默认 24 小时）
  lastActiveAt: Date      // 最后活跃时间
  ip?: string             // 客户端 IP
  userAgent?: string      // 客户端 UA
}
```

### Token 生成

```typescript
import { randomBytes } from 'crypto'

function generateToken(): string {
  return randomBytes(32).toString('hex')  // 64 个十六进制字符
}
```

### 关键参数

| 参数 | 值 | 说明 |
|------|-----|------|
| Token 长度 | 64 字符 | `randomBytes(32).toString('hex')` |
| 默认 TTL | 24 小时 | `24 * 60 * 60 * 1000` 毫秒 |
| 清理间隔 | 1 分钟 | `setInterval(() => cleanup(), 60_000)` |

### 核心方法

| 方法 | 说明 |
|------|------|
| `init()` | 启动时从数据库加载有效会话到内存 |
| `create(data)` | 创建会话：写数据库 → 存内存 → 关联用户索引 |
| `verify(token)` | 验证令牌：从内存查找 → 检查过期时间 → 更新活跃时间 |
| `remove(token)` | 删除会话：清内存 → 清索引 → 删数据库 |
| `refresh(token)` | 续期会话：重置过期时间（默认续 24h） |
| `kickUser(userId)` | 踢用户下线：删除该用户所有会话 |
| `kickSession(token)` | 踢指定会话下线 |
| `cleanup()` | 清理过期会话（定时器自动执行） |

:::warning 注意
`verify()` 每次调用均会异步更新 `lastActiveAt` 到数据库。这是非阻塞操作，不影响响应速度。
:::

## 🔑 密码处理

系统使用 Bun 内置的密码哈希功能，默认算法为 **Argon2id**：

```typescript
// 哈希密码
const hash = await Bun.password.hash(password)

// 验证密码
const valid = await Bun.password.verify(password, hash)
```

:::tip 为什么选择 Argon2
Argon2id 是 2015 年密码哈希竞赛的冠军算法，兼具抗 GPU 暴力破解和抗侧信道攻击能力。Bun 原生支持，无需额外依赖。
:::

## 🌐 API 接口

### 客户端接口 (`/api/_/auth`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| `POST` | `/login` | 用户登录 | ❌ 跳过 |
| `POST` | `/register` | 用户注册 | ❌ 跳过 |
| `POST` | `/logout` | 用户登出 | ❌ 跳过 |
| `GET` | `/me` | 获取当前用户信息 | ✅ |
| `POST` | `/refresh` | 刷新令牌有效期 | ✅ |
| `POST` | `/change-password` | 修改密码 | ✅ |

### 管理端接口 (`/api/admin/auth`)

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/admin/stats` | 获取在线统计 | `auth:admin:stats` |
| `GET` | `/admin/sessions` | 获取所有会话 | `auth:admin:sessions` |
| `POST` | `/admin/kick-user` | 踢用户下线 | `auth:admin:kick-user` |
| `POST` | `/admin/kick-session` | 踢指定会话下线 | `auth:admin:kick-session` |

### 登录请求示例

```bash
curl -X POST http://localhost:3000/api/_/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'
```

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "a1b2c3d4...共64字符",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "roleId": "admin"
    }
  }
}
```

### 携带令牌访问

```bash
curl http://localhost:3000/api/_/auth/me \
  -H "Authorization: Bearer a1b2c3d4...共64字符"
```

### 在线统计数据

管理端 `GET /admin/stats` 返回结构：

```typescript
interface OnlineStats {
  onlineUsers: number       // 有会话的独立用户数
  totalSessions: number     // 总有效会话数
  activeSessions: number    // 活跃会话数（30分钟内有活动）
  activeUsers: number       // 活跃用户数（30分钟内有活动）
  todayNewSessions: number  // 今日新登录会话数
  expiringSessions: number  // 即将过期会话数（1小时内）
}
```

## 👤 UserService 用户服务

`UserService` 使用 `buildWhere()` 集成数据权限，所有查询和写入都受数据域 (DataScope) 限制：

```typescript
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const User = model.users

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return User.page({
    where: buildWhere(User.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return User.findOne({
    where: buildWhere(User.tableName, `id = ${id}`, ctx)
  })
}

export async function create(data: Insert<typeof User>, ctx?: CrudContext) {
  if (!checkCreateScope(User.tableName, data as Record<string, any>, ctx))
    return null
  return User.create(data)
}

export async function update(id: number, data: Update<typeof User>, ctx?: CrudContext) {
  const where = buildWhere(User.tableName, `id = ${id}`, ctx)
  if (!where) return null
  const n = await User.updateMany(where, data)
  if (n === 0) return null
  return User.getOne(id as any)
}

export async function remove(id: number, ctx?: CrudContext) {
  const where = buildWhere(User.tableName, `id = ${id}`, ctx)
  if (!where) return false
  return (await User.deleteMany(where)) > 0
}

/** Schema 代理，用于路由 Body/Response 类型生成 */
export const getSchema: (typeof User)['getSchema'] = User.getSchema.bind(User)
```

## 🔄 完整认证流程

```
┌─────────────────────────────────────────────┐
│                 客户端                        │
└────────┬───────────────────┬────────────────┘
         │ POST /login       │ GET /api/xxx
         ▼                   ▼
   ┌───────────┐      ┌───────────┐
   │ AuthService│      │ authPlugin │
   │  .login()  │      │  .derive() │
   └─────┬─────┘      └─────┬─────┘
         │                   │
    ┌────▼────┐         ┌────▼────┐
    │ 验证密码  │         │ 提取Token│
    │ Argon2   │         │ 验证Session│
    └────┬────┘         └────┬────┘
         │                   │
    ┌────▼────┐         ┌────▼──────┐
    │ 创建Session│       │ 注入上下文  │
    │ 64char Token│      │ session    │
    │ 24h 过期   │       │ userId     │
    └────┬────┘         │ roleId     │
         │              └────────────┘
    ┌────▼────┐
    │ 返回Token │
    │ + 用户信息│
    └─────────┘
```

## ⚙️ 扩展指南

### 自定义 Token 提取

```typescript
app.use(authPlugin({
  extractToken: (request) => {
    // 从 Cookie 中提取
    const cookie = request.headers.get('cookie')
    const match = cookie?.match(/token=([^;]+)/)
    return match?.[1] ?? null
  }
}))
```

### 添加排除路径

```typescript
app.use(authPlugin({
  excludePaths: [
    '/api/public/*',
    '/api/webhook/stripe'
  ]
}))
```
