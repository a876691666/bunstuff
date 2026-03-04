# 字典管理

字典管理模块用于维护系统中常用的固定数据（如状态、类型等），支持全量缓存和变更自动刷新。

## 🎯 功能概述

| 功能         | 说明                                          |
| ------------ | --------------------------------------------- |
| **字典类型** | 定义字典分类（如 `sys_status`、`sys_gender`） |
| **字典数据** | 每个类型下的具体选项（如 `正常/停用`）        |
| **全量缓存** | 启动时全量加载到内存，查询零 DB 访问          |
| **自动刷新** | 字典数据变更时自动刷新缓存                    |

## 🔌 dictPlugin

`dictPlugin` 向路由上下文注入 `dict` 对象。

### 注入上下文

| 方法                             | 说明                            |
| -------------------------------- | ------------------------------- |
| `dict.getDictMap(type)`          | 获取字典 Map（key → label）     |
| `dict.getDictList(type)`         | 获取字典列表 `[{value, label}]` |
| `dict.getDictLabel(type, value)` | 获取字典标签                    |

### 使用示例

```typescript
.get('/options', async ({ dict }) => {
  const statusList = dict.getDictList('sys_status')
  // [{ value: '0', label: '停用' }, { value: '1', label: '正常' }]
  return R.ok({ statusList })
})
```

## 🗄️ 数据模型

### DictType（字典类型）

| 字段       | 类型     | 说明                  |
| ---------- | -------- | --------------------- |
| `id`       | `number` | 主键                  |
| `dictType` | `string` | 字典类型编码（唯一）  |
| `dictName` | `string` | 字典类型名称          |
| `status`   | `number` | 状态：0 停用 / 1 正常 |
| `remark`   | `string` | 备注                  |

### DictData（字典数据）

| 字段        | 类型     | 说明             |
| ----------- | -------- | ---------------- |
| `id`        | `number` | 主键             |
| `dictType`  | `string` | 关联字典类型编码 |
| `dictLabel` | `string` | 字典标签         |
| `dictValue` | `string` | 字典值           |
| `dictSort`  | `number` | 排序值           |
| `status`    | `number` | 状态             |
| `cssClass`  | `string` | CSS 样式类名     |
| `listClass` | `string` | 列表样式         |

## 💾 缓存机制

```
启动时
    │
    ▼
┌──────────────────────────────┐
│ dictService.initCache()       │
│ 全量加载 dict_type + dict_data│
│ 存入 Map<type, data[]>        │
└──────────────────────────────┘

运行时（字典变更）
    │
    ▼
┌──────────────────────────────┐
│ 管理端创建/更新/删除字典       │
│ → 自动调用缓存刷新            │
│ → 重新加载对应类型的字典数据    │
└──────────────────────────────┘
```

## 📡 API 接口

### 客户端 API

| 方法  | 路径                    | 说明                   |
| ----- | ----------------------- | ---------------------- |
| `GET` | `/api/_/dict/:dictType` | 查询指定类型的字典数据 |

### 管理端 API

| 方法     | 路径                       | 说明         | 权限                |
| -------- | -------------------------- | ------------ | ------------------- |
| `GET`    | `/api/admin/dict/type`     | 字典类型列表 | `dict:admin:list`   |
| `POST`   | `/api/admin/dict/type`     | 创建字典类型 | `dict:admin:create` |
| `PUT`    | `/api/admin/dict/type/:id` | 更新字典类型 | `dict:admin:update` |
| `DELETE` | `/api/admin/dict/type/:id` | 删除字典类型 | `dict:admin:delete` |
| `GET`    | `/api/admin/dict/data`     | 字典数据列表 | `dict:admin:list`   |
| `POST`   | `/api/admin/dict/data`     | 创建字典数据 | `dict:admin:create` |
| `PUT`    | `/api/admin/dict/data/:id` | 更新字典数据 | `dict:admin:update` |
| `DELETE` | `/api/admin/dict/data/:id` | 删除字典数据 | `dict:admin:delete` |
| `POST`   | `/api/admin/dict/refresh`  | 手动刷新缓存 | `dict:admin:update` |
