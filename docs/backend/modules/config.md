# 参数配置

## 概述

配置模块提供系统参数的集中管理和全量缓存。位于 `modules/system/config/`。

## configPlugin

通过 `derive` 注入配置查询工具：

```typescript
import { configPlugin } from '@/modules/system/config/plugin'

const api = new Elysia()
  .use(configPlugin())
  .get('/info', (ctx) => {
    const value = ctx.getConfigValue('sys.name')
    // 'Bunstuff'

    const valueWithDefault = ctx.getConfigValueOrDefault('sys.pageSize', '10')
    // '10'（不存在时返回默认值）
  })
```

### 注入方法

| 方法 | 说明 |
|------|------|
| `getConfigValue(key)` | 获取配置值，不存在返回 null |
| `getConfigValueOrDefault(key, defaultValue)` | 获取配置值，不存在返回默认值 |

## 数据模型（SysConfig）

| 字段 | 说明 |
|------|------|
| name | 配置名称 |
| key | 配置键（unique） |
| value | 配置值 |
| type | 配置类型（Y=系统内置 N=自定义） |
| remark | 备注 |

## 缓存策略

- 启动时全量加载到内存
- 配置变更时自动刷新缓存
- 查询直接从内存读取

## 管理端 API

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/config` | `config:admin:list` |
| POST | `/api/admin/config` | `config:admin:create` |
| PUT | `/api/admin/config/:id` | `config:admin:update` |
| DELETE | `/api/admin/config/:id` | `config:admin:delete` |
