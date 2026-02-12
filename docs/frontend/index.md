# 管理端前端总览

## 概述

管理端前端基于 **Vue 3 + Naive UI + Pinia + Vue Router** 构建，提供完整的后台管理界面。

## 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | Composition API + `<script setup>` |
| Naive UI | 企业级 UI 组件库 |
| Pinia | 状态管理 |
| Vue Router | 路由（静态 + 动态） |
| Vite | 开发构建工具 |
| SSQL Builder | 前端查询条件构建 |

## 项目配置

### Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  base: '/_admin/',          // 管理端路径前缀
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',  // 代理到后端
    },
  },
})
```

### 路径别名

| 别名 | 路径 |
|------|------|
| `@/` | `frontend/src/` |

## 目录结构

```
src/
├── main.ts              # 应用入口
├── App.vue              # 根组件
├── api/                 # API 请求层
│   ├── auth.ts          # 认证
│   ├── user.ts          # 用户
│   ├── role.ts          # 角色
│   ├── menu.ts          # 菜单
│   ├── permission.ts    # 权限
│   ├── permission-scope.ts
│   ├── role-menu.ts
│   ├── role-permission.ts
│   ├── rbac.ts          # RBAC 查询
│   ├── system.ts        # 系统功能
│   ├── notice.ts        # 通知
│   ├── file.ts          # 文件
│   ├── job.ts           # 定时任务
│   ├── rate-limit.ts    # 限流
│   ├── crud.ts          # 动态CRUD
│   └── vip.ts           # VIP
├── components/          # 通用组件
│   ├── common/          # 基础组件
│   └── crud/            # CRUD 组件
├── composables/         # 组合式函数
│   ├── useTable.ts      # 表格逻辑
│   ├── useModal.ts      # 弹窗逻辑
│   └── useDict.ts       # 字典数据
├── layouts/             # 布局组件
│   └── AdminLayout.vue  # 管理端布局
├── router/              # 路由
│   ├── index.ts         # 路由配置
│   └── dynamic.ts       # 动态路由生成
├── stores/              # Pinia Store
│   └── auth.ts          # 认证状态
├── types/               # TypeScript 类型
├── utils/               # 工具函数
│   ├── http.ts          # HTTP 客户端
│   └── ssql/            # SSQL Builder
└── views/               # 页面视图
    ├── Dashboard.vue    # 仪表盘
    ├── NotFound.vue     # 404
    ├── auth/            # 认证页面
    └── admin/           # 管理页面
```

## 页面清单

### 认证页面

| 页面 | 路径 | 说明 |
|------|------|------|
| Login | `/login` | 登录 |
| Profile | `/profile` | 个人信息 |
| ChangePassword | `/change-password` | 修改密码 |

### 系统管理

| 页面 | 路径 | 权限 |
|------|------|------|
| Users | `/admin/system/users` | `user:admin:list` |
| Roles | `/admin/system/roles` | `role:admin:list` |
| Menus | `/admin/system/menus` | `menu:admin:list` |
| Permissions | `/admin/system/permissions` | `permission:admin:list` |
| PermissionScopes | `/admin/system/permission-scopes` | `permission-scope:admin:list` |
| DictTypes | `/admin/system/dict-types` | `dict-type:admin:list` |
| DictData | `/admin/system/dict-data` | `dict-data:admin:list` |
| Configs | `/admin/system/configs` | `config:admin:list` |
| LoginLogs | `/admin/system/login-logs` | `login-log:admin:list` |
| OperLogs | `/admin/system/oper-logs` | `oper-log:admin:list` |

### 权限管理

| 页面 | 路径 | 权限 |
|------|------|------|
| RoleMenus | `/admin/rbac/role-menus` | `role-menu:admin:list` |
| RolePermissions | `/admin/rbac/role-permissions` | `role-permission:admin:list` |
| Sessions | `/admin/rbac/sessions` | 在线会话管理 |
| Cache | `/admin/rbac/cache` | 缓存管理 |

### 功能模块

| 页面 | 路径 | 说明 |
|------|------|------|
| CrudTable | `/admin/crud` | 动态 CRUD 表管理 |
| Files | `/admin/file` | 文件管理 |
| Jobs | `/admin/job` | 定时任务 |
| Notices | `/admin/notice` | 通知公告 |
| RateLimits | `/admin/rate-limit` | 限流规则 |
| IpBlacklist | `/admin/rate-limit/ip-blacklist` | IP 黑名单 |
| VipTiers | `/admin/vip` | VIP 等级管理 |

### 其他

| 页面 | 路径 | 说明 |
|------|------|------|
| Dashboard | `/` | 仪表盘 |
| NotFound | `/*` | 404 页面 |
