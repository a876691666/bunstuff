# 客户端应用

## 概述

客户端（`client/`）是一个极简的 Vue 3 应用，用于面向终端用户的前台界面。

## 技术栈

- **Vue 3**：无额外 UI 框架
- **Vue Router**：基础路由
- **Vite**：构建工具

## 配置

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
```

## 目录结构

```
client/
├── src/
│   ├── main.ts         # createApp + router
│   ├── App.vue         # 纯 <RouterView />
│   └── views/
│       └── Home.vue    # 首页
├── vite.config.ts
└── package.json
```

## 开发

```bash
# 启动客户端开发服务器
bun run dev:client
```

访问地址：`http://localhost:5174`

## 生产部署

构建后的静态文件由后端 Elysia 以 `/` 路径提供服务：

```
请求 /         → client/index.html
请求 /assets/* → client/assets/*
请求 /other    → client/index.html（SPA 路由回退）
```

## 与管理端的区别

| 特性 | 管理端（frontend） | 客户端（client） |
|------|-------------------|-----------------|
| 路径前缀 | `/_admin/` | `/` |
| UI 框架 | Naive UI | 无（自定义） |
| 路由 | 动态（基于菜单树） | 静态 |
| 认证 | 强制登录 | 按需 |
| 权限 | RBAC 控制 | 简单 |
| 端口 | 5173 | 5174 |
