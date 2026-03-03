# API 模块

## 🎯 概述

前端共有 **17 个 API 模块**，统一存放在 `frontend/src/api/` 目录下。每个模块导出一个对象，包含该业务域的所有接口方法。类型定义集中在 `types/api.ts`（814 行，20+ 实体类型）。

## 📋 模块总览

| 模块 | 文件 | 说明 | 核心方法 |
|------|------|------|----------|
| 认证 | `auth.ts` | 登录、注册、登出、用户信息 | login, register, logout, me |
| 用户 | `user.ts` | 用户管理 CRUD | list, get, create, update, delete |
| 角色 | `role.ts` | 角色管理 CRUD | list, get, create, update, delete |
| 权限 | `permission.ts` | 权限管理 CRUD | list, get, create, update, delete |
| 权限范围 | `permission-scope.ts` | 权限范围管理 | list, get, create, update, delete |
| 菜单 | `menu.ts` | 菜单管理、树结构 | list, tree, get, create, update, delete |
| 角色菜单 | `role-menu.ts` | 角色与菜单关联 | getByRole, assign |
| 角色权限 | `role-permission.ts` | 角色与权限关联 | getByRole, assign |
| RBAC | `rbac.ts` | 当前用户权限和菜单 | myPermissions, myMenuTree |
| VIP | `vip.ts` | VIP 等级、资源限额、用户 VIP | tiers, limits, users (各自 CRUD) |
| 系统 | `system.ts` | 字典、配置、登录日志、操作日志 | dict*, config*, loginLog*, operLog* |
| 通知 | `notice.ts` | 通知管理 | list, get, create, update, delete, publish |
| 文件 | `file.ts` | 文件上传与管理 | upload, list, get, delete |
| 定时任务 | `job.ts` | 任务管理与日志 | list, get, create, update, delete, run, logs |
| 频率限制 | `rate-limit.ts` | 规则与 IP 黑名单 | rules (CRUD), blacklist (CRUD) |
| CRUD | `crud.ts` | 动态 CRUD 表配置 | tables (CRUD), data (CRUD) |
| 会话 | `session.ts` | 在线会话管理 | list, kick |

## 🔧 标准模式

每个 API 模块遵循统一的编码模式：

```ts
import { http } from '@/utils/http'
import type { User, CreateUserDto, UpdateUserDto } from '@/types/api'

export const userApi = {
  /** 分页查询 */
  list(params?: Record<string, any>) {
    return http.getPage<User>('/user', params)
  },

  /** 获取详情 */
  get(id: number) {
    return http.get<User>(`/user/${id}`)
  },

  /** 创建 */
  create(data: CreateUserDto) {
    return http.post<User>('/user', data)
  },

  /** 更新 */
  update(id: number, data: UpdateUserDto) {
    return http.put<User>(`/user/${id}`, data)
  },

  /** 删除 */
  delete(id: number) {
    return http.delete(`/user/${id}`)
  }
}
```

:::tip
所有 API 方法都返回已解包的业务数据（`Promise<T>`），无需手动解构 `response.data`。详见 [HTTP 客户端](./http.md)。
:::

## 📝 类型定义

类型集中定义在 `frontend/src/types/api.ts`，包含 20+ 实体类型：

```ts
// 用户
export interface User {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string
  status: number
  createdAt: string
  updatedAt: string
}

// 角色
export interface Role {
  id: number
  name: string
  code: string
  description: string
  status: number
}

// 菜单项（树结构）
export interface MenuItem {
  id: number
  parentId: number | null
  name: string
  path: string
  component: string
  icon: string
  type: 1 | 2 | 3  // 目录 | 页面 | 按钮
  sort: number
  children?: MenuItem[]
}

// DTO 类型
export interface CreateUserDto {
  username: string
  password: string
  nickname?: string
  email?: string
}

export interface UpdateUserDto {
  nickname?: string
  email?: string
  status?: number
}

// ... 更多实体类型
```

## 🔗 特殊接口

部分模块提供标准 CRUD 之外的自定义方法：

| 模块 | 方法 | 说明 |
|------|------|------|
| `auth` | `me()` | 获取当前登录用户信息 |
| `menu` | `tree()` | 获取菜单树结构 |
| `rbac` | `myPermissions()` | 获取当前用户权限列表 |
| `rbac` | `myMenuTree()` | 获取当前用户菜单树 |
| `notice` | `publish(id)` | 发布通知 |
| `file` | `upload(file)` | 上传文件（FormData） |
| `job` | `run(id)` | 手动触发任务 |
| `session` | `kick(id)` | 踢出在线用户 |

:::warning
文件上传使用 `FormData` 格式，不走默认的 JSON Content-Type。HttpClient 内部会自动处理。
:::
