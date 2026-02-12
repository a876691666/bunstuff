# API 层

## 概述

`frontend/src/api/` 目录包含所有后端接口的请求封装，每个模块一个文件。

## API 模块清单

| 文件 | 模块 | 主要接口 |
|------|------|----------|
| `auth.ts` | 认证 | login, register, logout, me, changePassword |
| `user.ts` | 用户管理 | list, detail, create, update, delete |
| `role.ts` | 角色管理 | list, detail, create, update, delete |
| `menu.ts` | 菜单管理 | list, create, update, delete |
| `permission.ts` | 权限管理 | list, create, update, delete |
| `permission-scope.ts` | 权限范围 | list, create, update, delete |
| `role-menu.ts` | 角色菜单 | list, bindMenus |
| `role-permission.ts` | 角色权限 | list, bindPermissions |
| `rbac.ts` | RBAC 查询 | permissions, menus, permissionInfo |
| `system.ts` | 系统功能 | dictType, dictData, config, loginLog, operLog |
| `notice.ts` | 通知公告 | list, create, update, delete, unreadCount |
| `file.ts` | 文件管理 | list, upload, delete |
| `job.ts` | 定时任务 | list, create, update, delete, run, pause, resume |
| `rate-limit.ts` | 限流 | rules, ipBlacklist |
| `crud.ts` | 动态CRUD | list, create, update, delete, tableConfig |
| `vip.ts` | VIP管理 | tiers, resourceLimits, userVips |

## 标准 CRUD API 模板

```typescript
// api/article.ts
import { http } from '@/utils/http'

export const articleApi = {
  // 分页列表
  list: (params?: Record<string, any>) =>
    http.getPage('/api/admin/article', params),

  // 详情
  detail: (id: number) =>
    http.get(`/api/admin/article/${id}`),

  // 创建
  create: (data: Record<string, any>) =>
    http.post('/api/admin/article', data),

  // 更新
  update: (id: number, data: Record<string, any>) =>
    http.put(`/api/admin/article/${id}`, data),

  // 删除
  delete: (id: number) =>
    http.delete(`/api/admin/article/${id}`),
}
```

## 认证 API 示例

```typescript
// api/auth.ts
import { http } from '@/utils/http'

export const authApi = {
  login: (data: { username: string; password: string }) =>
    http.post('/api/login', data),

  register: (data: { username: string; password: string }) =>
    http.post('/api/register', data),

  logout: () =>
    http.post('/api/logout'),

  me: () =>
    http.get('/api/me'),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    http.post('/api/change-password', data),
}
```

## 在组件中使用

```vue
<script setup lang="ts">
import { articleApi } from '@/api/article'
import { useTable } from '@/composables/useTable'

const { tableData, loading, pagination, refresh } = useTable({
  fetchApi: articleApi.list,
})
</script>
```
