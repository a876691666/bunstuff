# 页面视图

## 🎯 概述

前端管理后台包含 **25+ 个页面视图**，覆盖系统管理、权限管理、VIP 管理、通知、文件、任务调度和频率限制等业务模块。

## 📊 Dashboard

仪表盘首页，展示系统关键统计数据：

| 统计卡片 | 说明 | 数据来源 |
|----------|------|----------|
| 在线用户 | 当前活跃会话数 | session API |
| 系统用户 | 注册用户总数 | user API |
| 角色数量 | 系统角色总数 | role API |
| VIP 用户 | VIP 用户数量 | vip API |

## 🔐 认证页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 登录 | `auth/Login.vue` | Tab 切换登录/注册表单 |
| 个人资料 | `auth/Profile.vue` | 查看和编辑个人信息 |
| 修改密码 | `auth/ChangePassword.vue` | 旧密码 + 新密码 + 确认密码 |

:::tip
Login.vue 使用 NTabs 组件实现登录和注册的 Tab 切换，无需跳转页面。
:::

## 🏢 系统管理（system/）

| 页面 | 文件 | 说明 | 核心功能 |
|------|------|------|----------|
| 用户管理 | `Users.vue` | 系统用户 CRUD | 增删改查、状态切换、密码重置 |
| 角色管理 | `Roles.vue` | 角色 CRUD | 增删改查 |
| 权限管理 | `Permissions.vue` | 权限项 CRUD | 增删改查 |
| 权限范围 | `PermissionScopes.vue` | 权限范围 CRUD | 增删改查 |
| 菜单管理 | `Menus.vue` | 菜单树 CRUD | 树形表格、拖拽排序 |
| 字典类型 | `DictTypes.vue` | 字典分类管理 | 增删改查 |
| 字典数据 | `DictData.vue` | 字典项管理 | 按类型筛选、排序 |
| 系统配置 | `Configs.vue` | 配置参数管理 | Key-Value 管理 |
| 登录日志 | `LoginLogs.vue` | 登录记录查看 | 查询、IP 显示 |
| 操作日志 | `OperLogs.vue` | 操作记录查看 | 查询、详情查看 |

## 🛡️ 权限管理（rbac/）

| 页面 | 文件 | 说明 | 核心功能 |
|------|------|------|----------|
| 角色菜单 | `RoleMenus.vue` | 角色→菜单授权 | 树形勾选、批量保存 |
| 角色权限 | `RolePermissions.vue` | 角色→权限授权 | 勾选分配 |
| 会话管理 | `Sessions.vue` | 在线用户管理 | 查看、强制下线 |
| 权限缓存 | `Cache.vue` | RBAC 缓存管理 | 查看、刷新缓存 |

## 💎 VIP 管理（vip/）

| 页面 | 文件 | 说明 | 核心功能 |
|------|------|------|----------|
| VIP 等级 | `Tiers.vue` | VIP 等级配置 | 增删改查、等级排序 |
| 资源限额 | `ResourceLimits.vue` | 各等级资源限额 | 配置每个等级的配额 |
| VIP 用户 | `Users.vue` | 用户 VIP 状态 | 分配/取消 VIP |

## 📢 通知管理（notice/）

| 页面 | 文件 | 说明 | 核心功能 |
|------|------|------|----------|
| 通知列表 | `Notices.vue` | 系统通知管理 | 增删改查、发布通知 |

## 📁 文件管理（file/）

| 页面 | 文件 | 说明 | 核心功能 |
|------|------|------|----------|
| 文件列表 | `Files.vue` | 上传文件管理 | 上传、预览、删除 |

## ⏰ 任务调度（job/）

| 页面 | 文件 | 说明 | 核心功能 |
|------|------|------|----------|
| 任务管理 | `Jobs.vue` | 定时任务 CRUD | 增删改查、手动执行 |
| 任务日志 | `JobLogs.vue` | 执行记录查看 | 查询、状态、耗时 |

## 🚦 频率限制（rate-limit/）

| 页面 | 文件 | 说明 | 核心功能 |
|------|------|------|----------|
| 限流规则 | `RateLimitRules.vue` | 限流规则 CRUD | 路径、窗口、限额配置 |
| IP 黑名单 | `IpBlacklist.vue` | 封禁 IP 管理 | 增删改查、过期时间 |

## 🔨 CRUD 管理（crud/）

| 页面 | 文件 | 说明 | 核心功能 |
|------|------|------|----------|
| CRUD 表配置 | `CrudTables.vue` | 动态表管理 | 表结构定义 |
| CRUD 数据 | `CrudData.vue` | 动态表数据 | 基于表配置的数据操作 |

## 📐 页面开发规范

所有管理页面遵循统一模式：

```vue
<script setup lang="ts">
import { useTable, useModal, useDict } from '@/composables'
import { xxxApi } from '@/api/xxx'

// 1. 字典
const { options } = useDict('xxx_type')

// 2. 表格
const table = useTable({ api: xxxApi.list, ... })

// 3. 弹窗
const modal = useModal({ createApi: xxxApi.create, ... })

// 4. 列定义
const columns = [...]

// 5. 操作方法
async function handleDelete(id: number) { ... }
</script>

<template>
  <CrudSearch ... />
  <CrudTable ... />
  <CrudModal ... />
</template>
```

:::warning
日志类页面（LoginLogs、OperLogs、JobLogs）通常为只读，不提供创建和编辑功能。
:::
