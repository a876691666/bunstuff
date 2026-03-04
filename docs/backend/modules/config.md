# 参数配置

参数配置模块用于管理系统动态配置常用参数，支持全量缓存和变更自动刷新。

## 🎯 功能概述

| 功能         | 说明                          |
| ------------ | ----------------------------- |
| **键值配置** | 以 key-value 形式管理系统参数 |
| **全量缓存** | 启动时全量加载到内存          |
| **自动刷新** | 配置变更时自动刷新缓存        |
| **默认值**   | 支持获取配置时指定默认值      |

## 🔌 configPlugin

`configPlugin` 向路由上下文注入 `config` 对象。

### 注入上下文

| 方法                                                | 说明                          |
| --------------------------------------------------- | ----------------------------- |
| `config.getConfigValue(key)`                        | 获取配置值，不存在返回 `null` |
| `config.getConfigValueOrDefault(key, defaultValue)` | 获取配置值，不存在返回默认值  |

### 使用示例

```typescript
.get('/settings', async ({ config }) => {
  const siteName = config.getConfigValueOrDefault('sys.site.name', 'Bunstuff')
  const uploadMaxSize = config.getConfigValueOrDefault('sys.upload.maxSize', '10')
  return R.ok({ siteName, uploadMaxSize })
})
```

## 🗄️ SysConfig 模型

| 字段          | 类型     | 说明                        |
| ------------- | -------- | --------------------------- |
| `id`          | `number` | 主键                        |
| `configName`  | `string` | 参数名称                    |
| `configKey`   | `string` | 参数键名（唯一）            |
| `configValue` | `string` | 参数键值                    |
| `configType`  | `string` | 系统内置：`Y` / 自定义：`N` |
| `remark`      | `string` | 备注                        |

## 📡 API 接口

### 客户端 API

| 方法  | 路径                 | 说明         |
| ----- | -------------------- | ------------ |
| `GET` | `/api/_/config/:key` | 查询指定配置 |

### 管理端 API

| 方法     | 路径                        | 说明     | 权限                  |
| -------- | --------------------------- | -------- | --------------------- |
| `GET`    | `/api/admin/config`         | 配置列表 | `config:admin:list`   |
| `POST`   | `/api/admin/config`         | 创建配置 | `config:admin:create` |
| `PUT`    | `/api/admin/config/:id`     | 更新配置 | `config:admin:update` |
| `DELETE` | `/api/admin/config/:id`     | 删除配置 | `config:admin:delete` |
| `POST`   | `/api/admin/config/refresh` | 刷新缓存 | `config:admin:update` |
