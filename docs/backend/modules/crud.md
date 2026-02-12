# 动态 CRUD

## 概述

动态 CRUD 模块允许通过数据库配置动态创建数据表和对应的 CRUD 接口，无需编写代码。位于 `modules/crud/`。

## 工作原理

```
CrudTable 数据库记录
  ↓ 启动时加载
crudRegistry.initFromDb()
  ↓ 解析 columns JSON
动态建表（syncTable）
  ↓ 创建 Model
注册到 CrudRegistry
  ↓
通配路由匹配
  GET/POST/PUT/DELETE /api/crud/:tableName
```

## CrudRegistry

统一管理所有 CRUD 服务实例：

### 注册方式

#### 代码级注册

```typescript
// 在代码中直接注册
crudRegistry.register(MyModel)
```

#### 数据库驱动注册

通过 `CrudTable` 模型在管理端配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| tableName | string | 表名 |
| displayName | string | 显示名称 |
| columns | JSON | 列定义（类型/默认值/描述等） |
| description | string | 表描述 |
| status | number | 1=启用 0=禁用 |

### columns JSON 格式

```json
[
  {
    "name": "title",
    "type": "string",
    "default": "",
    "description": "标题",
    "required": true
  },
  {
    "name": "content",
    "type": "string",
    "default": "",
    "description": "内容"
  },
  {
    "name": "status",
    "type": "number",
    "default": 1,
    "description": "状态"
  }
]
```

## 通配 API

### 客户端路由

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/crud/:tableName` | 列表查询 |
| GET | `/api/crud/:tableName/:id` | 详情查询 |
| POST | `/api/crud/:tableName` | 创建 |
| PUT | `/api/crud/:tableName/:id` | 更新 |
| DELETE | `/api/crud/:tableName/:id` | 删除 |

### 管理端路由（CrudTable 配置管理）

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/admin/crud-table` | `crud-table:admin:list` | 表配置列表 |
| POST | `/api/admin/crud-table` | `crud-table:admin:create` | 创建表配置 |
| PUT | `/api/admin/crud-table/:id` | `crud-table:admin:update` | 更新表配置 |
| DELETE | `/api/admin/crud-table/:id` | `crud-table:admin:delete` | 删除表配置 |

## 使用场景

- **快速原型**：无需编写后端代码，通过管理界面即可创建数据表和接口
- **动态表单**：配合前端动态表单组件，实现灵活的数据采集
- **低代码场景**：管理端可视化配置数据结构
