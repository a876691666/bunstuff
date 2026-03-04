# 🛡️ 权限模块 (RBAC)

基于 Casbin 的权限控制模块，提供角色管理、权限检查、菜单可见性和数据级权限过滤能力。

## 📖 模块概览

| 组件           | 路径                     | 说明                                 |
| -------------- | ------------------------ | ------------------------------------ |
| `rbacPlugin`   | `plugins/rbac.ts`        | 全局权限检查中间件，注入 `dataScope` |
| `RbacService`  | `services/rbac.ts`       | 权限查询、菜单树、用户权限聚合       |
| `RbacCache`    | `services/rbac-cache.ts` | 角色与菜单本地缓存                   |
| `Casbin`       | `services/casbin.ts`     | Casbin 引擎，存储策略与数据域规则    |
| `definePolicy` | `core/policy.ts`         | 策略定义 DSL                         |

## 🔌 rbacPlugin 权限插件

`rbacPlugin` 在 `authPlugin` 之后执行，依赖已注入的 `roleId`。通过路由 `detail.rbac.scope` 配置来声明接口所需权限。

### 注入上下文

```typescript
interface DataScope {
  /** 所有 scope 条目（原始数据） */
  allScopes: Array<{ table: string; permission: string; rule: string }>
  /** 获取指定表的 SSQL 规则（仅返回匹配当前路由权限的规则） */
  getSsqlRules(tableName: string): string[]
}
```

### 权限检查流程

```
请求进入（已通过 authPlugin，roleId 已注入）
  │
  ├─ derive 阶段
  │   ├─ 读取 detail.rbac.scope 配置
  │   ├─ 若无 scope 或无 roleId → dataScope = null
  │   ├─ 从 rbacCache 查找角色
  │   ├─ 从 Casbin 获取角色的所有数据域规则
  │   └─ 构建 DataScope 对象（携带 getSsqlRules 方法）
  │
  └─ onBeforeHandle 阶段
      ├─ 若无 scope 配置 → 放行（纯认证接口）
      ├─ 若无 roleId → 401 未登录
      ├─ 角色不存在 → 403 无权访问
      ├─ scope.roles 检查 → 角色编码不在列表中 → 403
      └─ scope.permissions 检查 → Casbin enforce → 403
```

### 路由配置

```typescript
app.get('/admin/users', handler, {
  detail: {
    rbac: {
      scope: {
        permissions: ['user:admin:list'], // 所需权限（全部满足）
        roles: ['admin'], // 所需角色（可选，精确匹配）
      },
    },
  },
})
```

:::tip 权限与角色的关系

- `permissions`：通过 Casbin 检查，角色必须拥有**所有**列出的权限
- `roles`：直接匹配角色编码，适用于需要限定特定角色的场景
- 两者同时配置时，都需要通过才可访问
  :::

## 📋 策略定义 (Policy)

每个 API 模块通过 `definePolicy()` 声明自己的权限、角色分配和数据域规则：

```typescript
import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'user',
  permissions: [
    { code: 'user:admin:list', name: '用户列表' },
    { code: 'user:admin:create', name: '创建用户' },
    { code: 'user:admin:update', name: '更新用户' },
    { code: 'user:admin:delete', name: '删除用户' },
  ],
  roles: {
    admin: '*', // admin 拥有本模块全部权限
    editor: ['user:admin:list'], // editor 仅查看
  },
  scopes: [
    {
      role: 'editor',
      table: 'users',
      permission: 'user:admin:list',
      rule: 'status = 1', // 仅可看到正常状态的用户
      description: '编辑者仅查看正常用户',
    },
    {
      role: 'user',
      table: 'users',
      permission: 'user:admin:list',
      rule: 'id = $auth.userId', // 仅可看到自己
      description: '普通用户仅查看自己',
    },
  ],
})
```

### PolicyDefinition 结构

```typescript
interface PolicyDefinition {
  module: string // 模块名称（日志用）
  permissions: PermissionDef[] // 权限列表
  roles: Record<string, '*' | string[]> // 角色权限分配
  scopes?: ScopeDef[] // 数据域规则（可选）
}

interface PermissionDef {
  code: string // 权限编码，如 'config:admin:list'
  name: string // 权限名称
  description?: string // 权限描述
}

interface ScopeDef {
  role: string // 适用角色编码
  table: string // 关联表名
  permission: string // 关联权限编码
  rule: string // SSQL 过滤规则
  description?: string // 规则描述
}
```

### 策略解析为 Casbin 规则

`resolvePolicies()` 将声明式策略转换为 Casbin 五元组：

| 类型     | sub        | dom     | obj         | act        | eft        |
| -------- | ---------- | ------- | ----------- | ---------- | ---------- |
| 权限授予 | `roleCode` | `perm`  | `permCode`  | `allow`    | `allow`    |
| 数据域   | `roleCode` | `scope` | `tableName` | `permCode` | `ssqlRule` |

## 🔧 Casbin 引擎

### 模型定义

```ini
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act, eft

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.dom == p.dom && r.obj == p.obj && r.act == p.act
```

### 策略加载

系统启动时从 `_generated/policies.generated.ts` 加载所有策略文件：

```
启动
  │
  ├─ casbin.init()
  │   ├─ 创建 Casbin Enforcer
  │   ├─ 从 allPolicies 解析策略
  │   ├─ 收集权限定义 (PermissionDef[])
  │   └─ addPolicies() 批量加载
  │
  └─ rbacCache.init()
      ├─ 调用 casbin.init()
      ├─ 加载角色表 → Map<roleId, CachedRole>
      ├─ 加载菜单表 → Map<menuId, MenuRow>
      └─ 为每个角色获取权限编码列表
```

:::warning 策略只读
所有策略来自代码中的 `definePolicy()` 声明，运行时不可修改。修改策略需更新代码后重新部署。
:::

### 核心方法

| 方法                                       | 说明                           |
| ------------------------------------------ | ------------------------------ |
| `enforce(roleCode, permCode)`              | 检查角色是否拥有指定权限       |
| `hasAllPermissions(roleCode, permCodes)`   | 检查角色是否拥有所有权限       |
| `hasAnyPermission(roleCode, permCodes)`    | 检查角色是否拥有任一权限       |
| `getRolePermissionCodes(roleCode)`         | 获取角色的全部权限编码         |
| `getRoleSsqlRules(roleCode, table, perm?)` | 获取角色在指定表上的 SSQL 规则 |
| `getRoleScopes(roleCode)`                  | 获取角色的全部数据域规则       |

## 📦 RbacCache 缓存层

缓存层在 Casbin 之上提供角色和菜单的快速查询，避免频繁数据库访问。

### 缓存数据结构

```typescript
interface CacheState {
  roles: Map<string, CachedRole> // roleId → 角色对象（含权限编码列表）
  menus: Map<number, MenuRow> // menuId → 菜单对象
}

interface CachedRole extends Row<typeof Role> {
  permissionCodes: string[] // 该角色拥有的权限编码列表
}
```

### 菜单可见性派生

菜单可见性不依赖 `role_menu` 关联表，而是从角色权限自动派生：

```
Step 1: 标记可见叶子菜单
  ├─ 菜单有 permCode → 检查角色是否拥有该权限
  └─ 菜单无 permCode 且 type=2(页面) → 登录即可见

Step 2: 向上传播
  └─ 子菜单可见 → 父目录自动可见
```

### 缓存管理

| 方法                     | 说明                           |
| ------------------------ | ------------------------------ |
| `init()`                 | 初始化缓存（含 Casbin 初始化） |
| `reload()`               | 重新加载缓存                   |
| `getRole(roleId)`        | 查询角色                       |
| `getAllRoles()`          | 获取全部角色                   |
| `getRoleMenus(roleCode)` | 获取角色可见菜单               |
| `getStatus()`            | 获取缓存统计                   |

## 🗂️ 菜单类型

| 值  | 类型 | 说明                               |
| --- | ---- | ---------------------------------- |
| `1` | 目录 | 菜单分组容器，不可访问             |
| `2` | 页面 | 具体页面，可渲染路由               |
| `3` | 按钮 | 页面内操作按钮，用于细粒度权限控制 |

### 菜单树结构

```typescript
interface MenuTreeNode extends Row<typeof Menu> {
  children: MenuTreeNode[]
}
```

菜单按 `parentId` 构建树形结构，按 `sort` 字段排序。

## 🔒 数据权限（DataScope）

数据权限通过 **Velocity 模板 + SSQL** 实现行级数据过滤。

### 数据权限流程

```
路由请求
  │
  ├─ rbacPlugin.derive()
  │   ├─ 获取路由 scope.permissions
  │   └─ 从 Casbin 获取角色的 scope 策略
  │
  ├─ handler 中调用 buildWhere()
  │   ├─ dataScope.getSsqlRules(tableName) → 获取原始规则
  │   ├─ buildVelocityContext(ctx) → 构建模板上下文
  │   ├─ renderSsql(rule, ctx) → Velocity 渲染
  │   └─ 合并 filter 与 scope 为 WHERE 条件
  │
  └─ ORM 执行带 WHERE 的查询
```

### Velocity 模板变量

| 变量               | 说明         | 示例                       |
| ------------------ | ------------ | -------------------------- |
| `$auth.userId`     | 当前用户 ID  | `1`                        |
| `$auth.roleId`     | 当前角色编码 | `'admin'`                  |
| `$auth.roleCode`   | 同 roleId    | `'admin'`                  |
| `$auth.username`   | 当前用户名   | `'zhangsan'`               |
| `$req.params.xxx`  | 路由参数     | `$req.params.id`           |
| `$req.query.xxx`   | 查询参数     | `$req.query.deptId`        |
| `$req.body.xxx`    | 请求体字段   | `$req.body.status`         |
| `$req.headers.xxx` | 请求头       | `$req.headers.x-tenant-id` |

### 规则示例

```typescript
// 仅查看自己的数据
{
  rule: 'createBy = $auth.userId'
}

// 仅查看本角色的数据
{
  rule: 'roleId = "$auth.roleId"'
}

// 仅查看启用状态
{
  rule: 'status = 1'
}

// 组合条件
{
  rule: 'deptId = $req.params.deptId && status = 1'
}
```

### 规则合并逻辑

```typescript
// 多条 scope 规则用 OR 合并（满足任一规则即可）
const scopeExpr = rendered.length === 1 ? rendered[0] : `(${rendered.join(' || ')})`

// scope 与用户 filter 用 AND 合并
if (filter) return `(${filter}) && (${scopeExpr})`
return scopeExpr
```

:::tip 数据域 OR 语义
同一角色在同一表上的多条 scope 规则之间是 **OR** 关系。这意味着满足任意一条规则即可通过数据权限检查。
:::

## 🔍 RbacService 服务方法

### 权限查询

```typescript
// 检查角色是否拥有指定权限
await rbacService.hasPermission('admin', 'user:list')

// 检查任一权限
await rbacService.hasAnyPermission('admin', ['user:list', 'user:create'])

// 检查全部权限
await rbacService.hasAllPermissions('admin', ['user:list', 'user:create'])

// 获取角色全部权限编码
const codes = await rbacService.getRolePermissionCodes('admin')
```

### 菜单查询

```typescript
// 获取角色菜单列表
const menus = await rbacService.getRoleMenus('admin')

// 获取角色菜单树
const tree = await rbacService.getRoleMenuTree('admin')
```

### 用户权限聚合

```typescript
const info = await rbacService.getUserPermissionInfo(userId)
// {
//   userId: 1,
//   role: { id: 'admin', name: '管理员', ... },
//   permissionCodes: ['user:list', 'user:create', ...],
//   menus: [...],
//   menuTree: [...],
//   scopes: [{ table: 'users', permission: 'user:list', rule: '...' }]
// }
```

### 数据域查询

```typescript
// 获取角色的全部数据域规则
const scopes = await rbacService.getRoleScopes('editor')

// 获取角色在指定表上的 SSQL 规则
const rules = await rbacService.getRoleSsqlRules('editor', 'users', 'user:list')
```

## 🌐 Admin API 接口

### 角色管理

| 方法  | 路径     | 说明         | 权限                    |
| ----- | -------- | ------------ | ----------------------- |
| `GET` | `/roles` | 获取角色列表 | `rbac:admin:roles-tree` |

### 角色权限

| 方法   | 路径                                   | 说明             | 权限                              |
| ------ | -------------------------------------- | ---------------- | --------------------------------- |
| `GET`  | `/roles/:roleId/permissions`           | 获取角色权限列表 | `rbac:admin:role-permissions`     |
| `POST` | `/roles/:roleId/permissions/check`     | 检查单个权限     | `rbac:admin:permission-check`     |
| `POST` | `/roles/:roleId/permissions/check-any` | 检查任一权限     | `rbac:admin:permission-check-any` |
| `POST` | `/roles/:roleId/permissions/check-all` | 检查全部权限     | `rbac:admin:permission-check-all` |

### 角色菜单

| 方法  | 路径                        | 说明                 | 权限                         |
| ----- | --------------------------- | -------------------- | ---------------------------- |
| `GET` | `/roles/:roleId/menus`      | 获取角色菜单（平铺） | `rbac:admin:role-menus`      |
| `GET` | `/roles/:roleId/menus/tree` | 获取角色菜单树       | `rbac:admin:role-menus-tree` |

### 数据域

| 方法  | 路径                           | 说明                   | 权限                     |
| ----- | ------------------------------ | ---------------------- | ------------------------ |
| `GET` | `/roles/:roleId/scopes`        | 获取角色数据域规则     | `rbac:admin:role-scopes` |
| `GET` | `/roles/:roleId/scopes/:table` | 获取角色在指定表的规则 | `rbac:admin:role-scopes` |

### 用户权限

| 方法  | 路径                        | 说明                 | 权限                          |
| ----- | --------------------------- | -------------------- | ----------------------------- |
| `GET` | `/user-permissions/:userId` | 获取用户完整权限信息 | `rbac:admin:user-permissions` |

### 缓存管理

| 方法   | 路径            | 说明         | 权限                      |
| ------ | --------------- | ------------ | ------------------------- |
| `GET`  | `/cache/status` | 获取缓存状态 | `rbac:admin:cache`        |
| `POST` | `/cache/reload` | 刷新缓存     | `rbac:admin:cache-reload` |

## 🔄 权限检查完整流程

```
客户端请求 GET /api/admin/users
  │
  ├─ authPlugin → 注入 userId='1', roleId='editor'
  │
  ├─ rbacPlugin.derive()
  │   ├─ 读取 scope: { permissions: ['user:admin:list'] }
  │   ├─ 查询 Casbin: getRoleScopes('editor')
  │   └─ 注入 dataScope: {
  │        allScopes: [{ table:'users', permission:'user:admin:list', rule:'status=1' }],
  │        getSsqlRules('users') → ['status=1']
  │      }
  │
  ├─ rbacPlugin.onBeforeHandle()
  │   ├─ casbin.hasAllPermissions('editor', ['user:admin:list'])
  │   └─ 通过 ✅
  │
  └─ handler
      ├─ buildWhere('users', query.filter, ctx)
      │   ├─ 获取 SSQL 规则: ['status=1']
      │   ├─ Velocity 渲染（此例无模板变量）
      │   └─ 返回: '(filter) && (status=1)'
      └─ User.page({ where: '(filter) && (status=1)' })
```
