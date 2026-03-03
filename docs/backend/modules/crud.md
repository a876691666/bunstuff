# 🔄 动态 CRUD

动态 CRUD 模块提供运行时表管理能力，通过 JSON 配置动态创建数据库表，并通过统一的通配路由提供增删改查 API。

## 📖 模块概览

| 组件 | 路径 | 说明 |
|------|------|------|
| `CrudRegistry` | `services/crud-table.ts` | CRUD 表注册中心 |
| `CrudTable` | `models/crud-table/schema.ts` | 动态表配置模型 |
| 通配路由 | `api/_/crud/index.ts` | `/api/crud/:tableName` 通用接口 |
| 管理路由 | `api/admin/crud-table/index.ts` | CRUD 表配置管理 |

## 🗃️ CrudTable 数据模型

`CrudTable` 存储动态表的元数据配置：

```typescript
class CrudTableSchema extends TimestampSchema {
  id          = column.number().primaryKey().autoIncrement()
  tableName   = column.string().default('')          // 表名（唯一标识）
  displayName = column.string().default('')          // 显示名称
  columns     = column.string().default('[]')        // 列定义 JSON
  description = column.string().nullable()           // 表描述
  status      = CrudTableSchema.status(1)            // 状态：1启用 0禁用
  createBy    = column.number().default(0)           // 创建者 ID
  remark      = column.string().nullable()           // 备注
}
```

### 列定义 JSON 格式

`columns` 字段存储 JSON 数组，每个元素定义一个表列：

```typescript
interface ColumnDef {
  name: string                    // 列名
  type: 'string' | 'number' | 'boolean' | 'date'  // 数据类型
  primaryKey?: boolean            // 是否主键
  autoIncrement?: boolean         // 是否自增
  nullable?: boolean              // 是否可空
  default?: any                   // 默认值
  unique?: boolean                // 是否唯一
  description?: string            // 列描述
  showInCreate?: boolean          // 是否在新建表单显示
  showInUpdate?: boolean          // 是否在更新表单显示
  showInFilter?: boolean          // 是否作为搜索过滤条件
  showInList?: boolean            // 是否在列表表格显示
}
```

**示例：**

```json
[
  { "name": "id", "type": "number", "primaryKey": true, "autoIncrement": true },
  { "name": "title", "type": "string", "description": "标题", "showInCreate": true, "showInList": true },
  { "name": "content", "type": "string", "nullable": true, "description": "内容" },
  { "name": "status", "type": "number", "default": 1, "description": "状态", "showInFilter": true },
  { "name": "isPublished", "type": "boolean", "default": false, "description": "是否发布" }
]
```

:::tip 自动时间戳
系统会自动为动态表追加 `createdAt` 和 `updatedAt` 字段（如果 JSON 中未定义）。
:::

### 数据库表名映射

动态创建的表使用 `crud_` 前缀以区分系统表：

```typescript
function getDbTableName(tableName: string): string {
  return tableName.startsWith('crud_') ? tableName : `crud_${tableName}`
}

// 配置表名: "feedback" → 数据库表名: "crud_feedback"
```

## 🏭 CrudRegistry 注册中心

CrudRegistry 是动态 CRUD 的核心，统一管理所有通过通配接口暴露的 ORM Model。

### 两种注册方式

| 方式 | 方法 | 说明 |
|------|------|------|
| 代码级注册 | `register(Model)` | 直接传入 ORM Model，不受 CrudTable 状态影响 |
| 数据库驱动 | `syncFromRecord(record)` | 从 CrudTable 记录动态创建 Model |

```typescript
import { crudRegistry } from '@/services/crud-table'
import { model } from '@/core/model'

// 代码级注册 — 将已有的 ORM Model 暴露到通配接口
crudRegistry.register(model.sys_config)
crudRegistry.registerMany([model.dict_type, model.dict_data])

// 数据库驱动 — CrudTable 记录增删改时自动同步
await crudRegistry.syncFromRecord(crudTableRecord)
```

### 注册优先级

```
代码级注册 > 数据库驱动

如果 tableName 已通过 register() 注册：
  - syncFromRecord() 会跳过
  - removeDbDriven() 不会删除
  - 始终可用，不受 CrudTable.status 影响
```

### 注册中心方法

| 方法 | 说明 |
|------|------|
| `register(model)` | 注册单个 Model |
| `registerMany(models)` | 批量注册 |
| `syncFromRecord(record)` | 从 CrudTable 记录同步（自动创建表） |
| `removeDbDriven(tableName)` | 移除数据库驱动的注册 |
| `get(tableName)` | 获取 Model 实例 |
| `has(tableName)` | 检查是否已注册 |
| `list()` | 列出所有已注册的表名 |
| `listStatic()` | 列出代码级注册的表名 |
| `initFromDb()` | 启动时从数据库初始化 |

### 初始化流程

```
应用启动
  │
  └─ crudRegistry.initFromDb()
      ├─ 查询 CrudTable: status = 1
      ├─ 遍历每条记录:
      │   ├─ 若 tableName 已代码级注册 → 跳过
      │   ├─ 解析 columns JSON → SchemaDefinition
      │   ├─ db.syncTable() → 同步表结构到数据库
      │   └─ new Model() → 注册到 registry
      └─ 输出日志:
         ✅ CrudRegistry: 初始化完成 — 代码级 3 个，数据库驱动 5 个，跳过 1 个
```

## 🌐 通配路由 `/api/crud/:tableName`

通配路由为所有注册到 CrudRegistry 的表提供统一的 CRUD API，自动应用数据权限。

### 接口列表

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/` | 获取已注册表列表 | `crud:admin:list` |
| `GET` | `/:tableName` | 分页查询 | `crud:admin:list` |
| `GET` | `/:tableName/:id` | 按 ID 查询 | `crud:admin:read` |
| `POST` | `/:tableName` | 创建记录 | `crud:admin:create` |
| `PUT` | `/:tableName/:id` | 更新记录 | `crud:admin:update` |
| `DELETE` | `/:tableName/:id` | 删除记录 | `crud:admin:delete` |

### 查询示例

```bash
# 查看已注册的表
curl http://localhost:3000/api/crud/ \
  -H "Authorization: Bearer <token>"

# 返回: { "data": ["feedback", "survey", "announcement"] }

# 分页查询
curl "http://localhost:3000/api/crud/feedback?page=1&pageSize=10&filter=status=1" \
  -H "Authorization: Bearer <token>"

# 创建记录
curl -X POST http://localhost:3000/api/crud/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Bug Report", "content": "...", "status": 1}'

# 更新记录
curl -X PUT http://localhost:3000/api/crud/feedback/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": 2}'

# 删除记录
curl -X DELETE http://localhost:3000/api/crud/feedback/1 \
  -H "Authorization: Bearer <token>"
```

### 数据权限集成

通配路由使用 `buildWhere()` 和 `checkCreateScope()` 自动应用数据权限：

```typescript
// 查询时
const result = await m.page({
  where: buildWhere(m.tableName, ctx.query.filter, ctx),
  page: ctx.query.page,
  pageSize: ctx.query.pageSize,
})

// 创建时
if (!checkCreateScope(m.tableName, ctx.body, ctx)) {
  return R.forbidden('无权创建')
}
```

## 🔧 管理端接口 (`/api/admin/crud-table`)

管理端提供 CrudTable 配置的增删改查，操作会自动同步到 CrudRegistry。

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/` | 获取配置列表（分页） | `crud:admin:list` |
| `GET` | `/:id` | 获取配置详情 | `crud:admin:read` |
| `POST` | `/` | 创建配置 | `crud:admin:create` |
| `PUT` | `/:id` | 更新配置 | `crud:admin:update` |
| `DELETE` | `/:id` | 删除配置 | `crud:admin:delete` |

### 创建动态表

```bash
curl -X POST http://localhost:3000/api/admin/crud-table/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "feedback",
    "displayName": "用户反馈",
    "description": "用户反馈收集表",
    "columns": "[{\"name\":\"id\",\"type\":\"number\",\"primaryKey\":true,\"autoIncrement\":true},{\"name\":\"title\",\"type\":\"string\"},{\"name\":\"content\",\"type\":\"string\",\"nullable\":true},{\"name\":\"status\",\"type\":\"number\",\"default\":1}]",
    "status": 1
  }'
```

创建成功后，系统会：

1. 在数据库中创建 `crud_feedback` 表
2. 生成 ORM Model 并注册到 CrudRegistry
3. 通配接口 `/api/crud/feedback` 立即可用

### 更新表结构

更新 `columns` 字段后，系统会自动调用 `db.syncTable()` 同步表结构：

- 新增列：自动 `ALTER TABLE ADD COLUMN`
- 删除列：**不会**删除已有列（安全策略）
- 修改类型：**不会**修改已有列的类型

:::warning 注意
动态表的结构变更仅支持**新增列**。如需删除或修改列类型，请手动操作数据库。
:::

### 禁用/启用

将配置的 `status` 设为 `0` 会从 CrudRegistry 中移除（代码级注册的除外），通配接口不再提供该表的 API。

## 💡 使用场景

### 快速原型

在开发初期快速创建数据表和 API，无需编写 Schema、Service、API 文件：

```
管理页面创建表 → 前端对接 /api/crud/:tableName → 完成
```

### 动态表单

后台管理中的自定义表单：

```
管理员定义表单字段（columns）
  → 系统创建表 + API
  → 前端根据 columns 渲染表单
  → 用户提交数据存入动态表
```

### 低代码平台

配合前端组件化：

1. 管理员通过拖拽配置表结构
2. 自动生成数据库表和 API
3. 自动生成列表、表单、详情页面

### 代码级 + 数据库驱动混合

```typescript
// 已有的 ORM Model 暴露到通配接口（保持原有 Schema 的类型安全和校验）
crudRegistry.register(model.sys_config)

// 同时支持管理员在线创建新表
// → 数据库驱动注册
```

## 📊 动态表类型映射

| JSON type | ORM column | SQLite 类型 | 说明 |
|-----------|------------|-------------|------|
| `string` | `column.string()` | `TEXT` | 字符串 |
| `number` | `column.number()` | `REAL` | 数字 |
| `boolean` | `column.number()` | `REAL` | 布尔值（1/0） |
| `date` | `column.date()` | `TEXT` | 日期 ISO 字符串 |

:::tip 布尔类型处理
`boolean` 类型底层使用 `number`，通过 `serialize/deserialize` 自动转换：
- 写入时将 `true`/`false` 序列化为 `1`/`0`
- 读取时将 `1`/`0`/`'1'`/`'true'` 反序列化为 `1`/`0`
:::

## 🔄 生命周期

```
┌─────────────────────────────────────────────────┐
│                  CrudTable 生命周期               │
├─────────────────────────────────────────────────┤
│                                                  │
│  创建 CrudTable 配置                              │
│    │                                             │
│    ├─ 解析 columns JSON                          │
│    ├─ buildSchemaFromColumns() → SchemaDefinition │
│    ├─ db.syncTable() → 创建/同步数据库表           │
│    ├─ new Model() → 创建 ORM 实例                 │
│    └─ crudRegistry.set() → 注册                   │
│                                                  │
│  更新 columns → 重新 sync → 新增列生效             │
│  status=0 → 从 registry 移除 → API 不可用         │
│  status=1 → 重新 sync + 注册 → API 恢复           │
│  删除配置 → 从 registry 移除（数据库表保留）        │
│                                                  │
└─────────────────────────────────────────────────┘
```
