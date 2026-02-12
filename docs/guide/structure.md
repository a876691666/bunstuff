# 项目结构

## 顶层结构

```
bunstuff/
├── backend/                # 后端（Bun + Elysia）
├── frontend/               # 管理端前端（Vue 3 + Naive UI）
├── client/                 # 客户端前端（Vue 3 极简）
├── docs/                   # 项目文档（VitePress）
├── release/                # 本地构建输出
├── release-docker/         # Docker 发布包
├── uploads/                # 上传文件存储
├── package.json            # Monorepo 根配置
├── Dockerfile              # Docker 构建文件
├── docker-compose.yml      # Docker Compose 配置
├── build.ts                # 本地构建脚本
└── build-docker.ts         # Docker 构建脚本
```

## 后端结构

```
backend/
├── index.ts                # 应用入口（启动、路由挂载）
├── package.json            # 后端依赖
├── tsconfig.json           # TypeScript 配置（路径别名）
│
├── models/                 # 数据模型层
│   ├── main.ts             # 数据库连接实例
│   ├── schema.ts           # Schema 基类（TimestampSchema、BaseSchema）
│   ├── _build.ts           # 模型构建脚本
│   ├── users/              # 用户模型
│   ├── role/               # 角色模型
│   ├── menu/               # 菜单模型
│   ├── permission/         # 权限模型
│   ├── permission-scope/   # 权限数据范围
│   ├── role-permission/    # 角色-权限关联
│   ├── role-menu/          # 角色-菜单关联
│   ├── session/            # 会话模型
│   ├── dict-type/          # 字典类型
│   ├── dict-data/          # 字典数据
│   ├── sys-config/         # 系统配置
│   ├── sys-file/           # 系统文件
│   ├── notice/             # 通知
│   ├── notice-read/        # 通知已读
│   ├── login-log/          # 登录日志
│   ├── oper-log/           # 操作日志
│   ├── job/                # 定时任务
│   ├── job-log/            # 任务日志
│   ├── vip-tier/           # VIP 等级
│   ├── vip-resource-limit/ # VIP 资源限制
│   ├── user-vip/           # 用户 VIP
│   ├── user-resource-usage/# 用户资源用量
│   ├── rate-limit-rule/    # 限流规则
│   ├── ip-blacklist/       # IP 黑名单
│   ├── crud-table/         # 动态 CRUD 表配置
│   └── seed-log/           # 种子执行日志
│
├── modules/                # 功能模块层
│   ├── index.ts            # 路由聚合（createApi / createAdminApi）
│   ├── response.ts         # 统一响应工具（R）
│   ├── crud-service.ts     # CRUD 基础服务类
│   ├── auth/               # 认证模块
│   │   ├── main/           # 认证核心（login/logout/session）
│   │   └── users/          # 用户管理
│   ├── rbac/               # 权限模块
│   │   ├── main/           # RBAC 核心（缓存/校验）
│   │   ├── role/           # 角色管理
│   │   ├── menu/           # 菜单管理
│   │   ├── permission/     # 权限管理
│   │   ├── permission-scope/ # 数据权限范围
│   │   ├── role-permission/# 角色权限关联
│   │   └── role-menu/      # 角色菜单关联
│   ├── crud/               # 动态 CRUD 模块
│   ├── file/               # 文件管理
│   ├── notice/             # 通知公告
│   ├── job/                # 定时任务
│   ├── seed/               # 种子数据
│   ├── vip/                # VIP 会员
│   └── system/             # 系统功能
│       ├── dict/           # 字典
│       ├── config/         # 配置
│       ├── login-log/      # 登录日志
│       ├── oper-log/       # 操作日志
│       └── rate-limit/     # API 限流
│
├── packages/               # 自研工具包
│   ├── orm/                # ORM 包
│   ├── ssql/               # SSQL 查询构建器
│   └── route-model/        # 路由 Schema 工具
│
├── scripts/                # 工具脚本
│   ├── collect-scopes.ts   # 权限编码收集
│   └── test-rate-limit.ts  # 限流测试
│
├── static/                 # 静态文件
├── temp/                   # 临时文件
└── uploads/                # 上传文件
```

## 前端结构（管理端）

```
frontend/
├── src/
│   ├── main.ts             # 应用入口
│   ├── App.vue             # 根组件
│   ├── api/                # API 请求层（17 个模块）
│   ├── components/         # 通用组件
│   │   ├── common/         # 基础组件（PageTable/FormModal/...）
│   │   └── crud/           # CRUD 组件
│   ├── composables/        # 组合式函数（useTable/useModal/useDict）
│   ├── layouts/            # 布局（AdminLayout）
│   ├── router/             # 路由配置（静态 + 动态）
│   ├── stores/             # Pinia 状态管理
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   │   ├── http.ts         # HTTP 客户端
│   │   └── ssql/           # 前端 SSQL Builder
│   └── views/              # 页面视图
│       ├── auth/           # 认证页面
│       ├── admin/          # 管理页面
│       └── Dashboard.vue   # 仪表盘
├── vite.config.ts          # Vite 配置（base: /_admin/）
└── package.json
```

## 客户端结构

```
client/
├── src/
│   ├── main.ts             # 应用入口
│   ├── App.vue             # 根组件（仅 RouterView）
│   └── views/
│       └── Home.vue        # 首页
├── vite.config.ts          # Vite 配置（端口 5174）
└── package.json
```

## 路径别名

在 `backend/tsconfig.json` 中定义了以下路径别名：

| 别名 | 路径 | 说明 |
|------|------|------|
| `@/*` | `backend/*` | 后端根目录 |
| `@pkg/ssql` | `backend/packages/ssql` | SSQL 包 |
| `@pkg/orm` | `backend/packages/orm` | ORM 包 |
