# 权限模块 (RBAC)

## 概述

RBAC（Role-Based Access Control）模块实现完整的角色权限控制，包括：

- **角色管理**：树形角色结构，权限向上汇聚
- **权限管理**：接口级权限编码
- **菜单管理**：前端动态菜单生成
- **数据权限**：基于 SSQL 规则的行级数据过滤

## 模块结构

```
modules/rbac/
├── main/
│   ├── plugin.ts           # rbacPlugin — 权限校验中间件
│   ├── service.ts          # RbacService — 权限查询服务
│   └── cache.ts            # RbacCache — 全量内存缓存
├── role/
│   ├── service.ts          # 角色 CRUD
│   └── api_admin.ts        # 管理端角色路由
├── menu/
│   ├── service.ts          # 菜单 CRUD
│   └── api_admin.ts        # 管理端菜单路由
├── permission/
│   ├── service.ts          # 权限 CRUD
│   └── api_admin.ts        # 管理端权限路由
├── permission-scope/
│   ├── service.ts          # 权限范围 CRUD
│   └── api_admin.ts        # 管理端权限范围路由
├── role-permission/
│   ├── service.ts          # 角色权限关联
│   └── api_admin.ts
└── role-menu/
    ├── service.ts          # 角色菜单关联
    └── api_admin.ts
```

## rbacPlugin

权限校验插件，依赖 `authPlugin`：

```typescript
import { rbacPlugin } from '@/modules/rbac/main/plugin'

const api = new Elysia()
  .use(authPlugin())
  .use(rbacPlugin())
  .get('/data', handler, {
    detail: {
      rbac: {
        scope: {
          permissions: ['data:admin:list'],  // 需要的权限
          roles: ['admin'],                  // 需要的角色（可选）
        },
      },
    },
  })
```

### 校验流程

```
请求进入（已通过 authPlugin 注入 session）
  → 获取路由 detail.rbac.scope
  → 无 scope？→ 放行
  → 有 permissions？→ 检查用户是否拥有任一权限
  → 有 roles？→ 检查用户角色是否匹配
  → 通过？→ 注入 dataScope → 放行
  → 不通过？→ 返回 403
```

### dataScope 注入

通过 `derive` 注入 `dataScope` 函数到请求上下文：

```typescript
// 在 handler 中使用
ctx.dataScope  // (tableName: string) => string | null
```

`dataScope` 根据当前用户的权限和 `PermissionScope` 表配置，返回针对指定表的 SSQL 过滤条件。

## 数据权限

### PermissionScope 模型

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 主键 |
| permissionId | number | 关联的权限 ID |
| name | string | 规则名称 |
| tableName | string | 作用的表名 |
| ssqlRule | string | SSQL 规则表达式 |
| description | string | 描述 |

### SSQL 规则模板

规则中可使用 **VelocityJS** 模板变量：

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `$auth.userId` | 当前用户 ID | `42` |
| `$auth.roleId` | 当前角色 ID | `1` |
| `$auth.username` | 用户名 | `admin` |
| `$req.method` | 请求方法 | `GET` |
| `$req.path` | 请求路径 | `/api/admin/users` |

### 规则示例

```
# 只能看到自己创建的数据
createBy = $auth.userId

# 只能看到自己部门的数据
deptId ?= [$auth.deptIds]

# 结合条件
status = 1 && createBy = $auth.userId
```

### 数据权限流程

```
1. 路由声明权限码
   rbac: { scope: { permissions: ['order:admin:list'] } }

2. rbacPlugin 匹配用户权限
   → 查找 PermissionScope 中 tableName 匹配的规则

3. Velocity 渲染模板
   "createBy = $auth.userId" → "createBy = 42"

4. CrudService 合并条件
   原始 WHERE 条件 + DataScope 条件 → 最终 SQL

5. 执行查询：用户只能看到自己的数据
```

## RBAC 缓存

`RbacCache` 类实现全量内存缓存：

### 缓存内容

| 缓存 | 数据 |
|------|------|
| 角色列表 | 所有角色（含树形结构） |
| 权限列表 | 所有权限编码 |
| 权限范围 | 所有 PermissionScope |
| 角色-权限 | 每个角色对应的权限集合 |
| 角色-菜单 | 每个角色对应的菜单集合 |
| 菜单列表 | 所有菜单配置 |

### 权限汇聚规则

角色采用树形结构，权限**向上汇聚**：

```
超级管理员（admin）
├── 部门管理员（dept_admin）
│   ├── dept_admin 自身权限
│   └── 所有后代角色的权限
└── 普通用户（user）
    └── user 自身权限

→ admin 权限 = admin 自身 ∪ dept_admin 全部 ∪ user 全部
```

## RbacService

核心 RBAC 查询服务：

| 方法 | 说明 |
|------|------|
| `getUserPermissions(roleId)` | 获取角色的所有权限编码 |
| `getUserMenus(roleId)` | 获取角色的菜单树 |
| `hasPermission(roleId, permission)` | 检查是否拥有指定权限 |
| `hasRole(roleId, roleCode)` | 检查角色匹配 |
| `getUserPermissionInfo(roleId)` | 获取完整权限信息（权限+菜单+角色） |
| `getDataScope(roleId, permissions)` | 获取数据权限过滤条件 |

## 声明扩展

RBAC 模块通过 TypeScript 声明扩展在 Elysia 路由元数据中添加权限配置：

```typescript
declare module 'elysia' {
  interface DocumentDecoration {
    rbac?: {
      scope?: {
        permissions?: string[]
        roles?: string[]
      }
    }
  }
}
```

## 子模块 API

### 角色管理

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/role` | `role:admin:list` |
| GET | `/api/admin/role/:id` | `role:admin:read` |
| POST | `/api/admin/role` | `role:admin:create` |
| PUT | `/api/admin/role/:id` | `role:admin:update` |
| DELETE | `/api/admin/role/:id` | `role:admin:delete` |

### 菜单管理

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/menu` | `menu:admin:list` |
| POST | `/api/admin/menu` | `menu:admin:create` |
| PUT | `/api/admin/menu/:id` | `menu:admin:update` |
| DELETE | `/api/admin/menu/:id` | `menu:admin:delete` |

### 权限管理

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/permission` | `permission:admin:list` |
| POST | `/api/admin/permission` | `permission:admin:create` |
| PUT | `/api/admin/permission/:id` | `permission:admin:update` |
| DELETE | `/api/admin/permission/:id` | `permission:admin:delete` |
