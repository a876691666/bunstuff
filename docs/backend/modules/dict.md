# 字典管理

## 概述

字典模块提供键值对数据的集中管理和全量缓存。位于 `modules/system/dict/`。

## dictPlugin

通过 `derive` 注入字典查询工具：

```typescript
import { dictPlugin } from '@/modules/system/dict/plugin'

const api = new Elysia()
  .use(dictPlugin())
  .get('/data', (ctx) => {
    const statusMap = ctx.getDictMap('sys_status')
    // { '0': '禁用', '1': '正常' }

    const statusList = ctx.getDictList('sys_status')
    // [{ label: '禁用', value: '0' }, { label: '正常', value: '1' }]

    const label = ctx.getDictLabel('sys_status', '1')
    // '正常'
  })
```

### 注入方法

| 方法 | 说明 |
|------|------|
| `getDictMap(dictType)` | 获取字典映射（value → label） |
| `getDictList(dictType)` | 获取字典列表（{ label, value }） |
| `getDictLabel(dictType, value)` | 获取指定值的标签 |

## 数据模型

### DictType（字典类型）

| 字段 | 说明 |
|------|------|
| name | 字典名称 |
| type | 字典编码（unique） |
| status | 状态 |
| remark | 备注 |

### DictData（字典数据）

| 字段 | 说明 |
|------|------|
| dictType | 关联字典类型编码 |
| label | 标签 |
| value | 值 |
| sort | 排序 |
| status | 状态 |

## 缓存策略

- 启动时全量加载到内存
- 字典数据变更时自动刷新缓存
- 查询直接从内存读取，零数据库开销

## 管理端 API

### 字典类型

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/dict-type` | `dict-type:admin:list` |
| POST | `/api/admin/dict-type` | `dict-type:admin:create` |
| PUT | `/api/admin/dict-type/:id` | `dict-type:admin:update` |
| DELETE | `/api/admin/dict-type/:id` | `dict-type:admin:delete` |

### 字典数据

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/admin/dict-data` | `dict-data:admin:list` |
| POST | `/api/admin/dict-data` | `dict-data:admin:create` |
| PUT | `/api/admin/dict-data/:id` | `dict-data:admin:update` |
| DELETE | `/api/admin/dict-data/:id` | `dict-data:admin:delete` |
