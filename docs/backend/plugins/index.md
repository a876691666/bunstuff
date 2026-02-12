# 插件概览

## 插件体系

Bunstuff 后端基于 Elysia 的插件系统构建，所有功能模块都以插件形式组织。插件通过 `derive` 生命周期钩子向请求上下文注入工具函数。

## 插件清单

| 插件 | 导入路径 | 注入内容 |
|------|---------|----------|
| `authPlugin()` | `@/modules/auth/main/plugin` | `session`, `userId`, `roleId`, `rbac` |
| `rbacPlugin()` | `@/modules/rbac/main/plugin` | `dataScope` |
| `vipPlugin()` | `@/modules/vip/plugin` | `vipTierId`, `canUseResource`, `incrementResource` 等 |
| `filePlugin()` | `@/modules/file/plugin` | `getFile`, `uploadLocal`, `getFileUrl` 等 |
| `noticePlugin()` | `@/modules/notice/plugin` | `publishNotice`, `sendToUser`, `markAsRead` 等 |
| `dictPlugin()` | `@/modules/system/dict/plugin` | `getDictMap`, `getDictList`, `getDictLabel` |
| `configPlugin()` | `@/modules/system/config/plugin` | `getConfigValue`, `getConfigValueOrDefault` |
| `loginLogPlugin()` | `@/modules/system/login-log/plugin` | `logLogin` |
| `operLogPlugin()` | `@/modules/system/oper-log/plugin` | 自动记录操作日志（基于路由 detail） |

## 依赖关系

```
authPlugin()     ← 无依赖
rbacPlugin()     ← 依赖 authPlugin
vipPlugin()      ← 依赖 authPlugin
operLogPlugin()  ← 依赖 authPlugin
loginLogPlugin() ← 无依赖
dictPlugin()     ← 无依赖
configPlugin()   ← 无依赖
filePlugin()     ← 依赖 authPlugin
noticePlugin()   ← 依赖 authPlugin
```

## 使用模式

### 标准管理端路由

```typescript
const api = new Elysia({ prefix: '/my-module', tags: ['我的模块'] })
  .use(authPlugin())       // 必须：认证
  .use(rbacPlugin())       // 必须：权限
  .use(operLogPlugin())    // 可选：操作日志
  .use(dictPlugin())       // 可选：字典查询
  .use(configPlugin())     // 可选：配置查询
```

### 客户端路由

```typescript
const api = new Elysia({ prefix: '/public', tags: ['公开接口'] })
  .use(authPlugin())       // 认证（部分路由可 skipAuth）
  .use(filePlugin())       // 可选：文件操作
  .use(noticePlugin())     // 可选：通知
```

## 声明扩展

多个插件通过 TypeScript 声明扩展在路由 `detail` 中添加配置：

```typescript
// 路由配置示例
.get('/data', handler, {
  detail: {
    // auth 插件
    auth: { skipAuth: false },
    
    // rbac 插件
    rbac: {
      scope: {
        permissions: ['data:admin:list'],
        roles: ['admin'],
      },
    },
    
    // operLog 插件
    operLog: {
      title: '数据管理',
      type: 'list',
    },
  },
})
```
