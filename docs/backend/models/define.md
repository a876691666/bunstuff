# Schema 定义

Schema 类定义数据表的字段结构，是 ORM 自动建表、类型推导、CRUD 接口生成的基础。

## 🎯 基本结构

每个模型的 `schema.ts` 文件需要导出两个内容：

```typescript
import { TimestampSchema, column } from '../../packages/orm'

// 1. 导出表名
export const tableName = 'users'

// 2. 默认导出 Schema 类
export default class UsersSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement().description('用户ID')
  username = column.string().default('').description('用户名')
  email = column.string().nullable().default(null).description('邮箱')
  status = UsersSchema.status(1).description('状态')
}
```

::: tip 基类 TimestampSchema
继承 `TimestampSchema` 会自动添加 `createdAt` 和 `updatedAt` 时间戳字段，由 ORM 自动维护。
:::

## 📋 字段类型

`column` 提供以下类型构造器：

| 构造器             | SQL 类型  | TypeScript 类型 | 说明          |
| ------------------ | --------- | --------------- | ------------- |
| `column.string()`  | `TEXT`    | `string`        | 字符串        |
| `column.number()`  | `INTEGER` | `number`        | 数值          |
| `column.boolean()` | `INTEGER` | `boolean`       | 布尔值（0/1） |
| `column.date()`    | `TEXT`    | `Date`          | 日期时间      |
| `column.blob()`    | `BLOB`    | `Buffer`        | 二进制数据    |

## 🔗 链式修饰符

每个字段支持链式调用修饰符：

| 修饰符               | 说明                     | 示例                                           |
| -------------------- | ------------------------ | ---------------------------------------------- |
| `.primaryKey()`      | 主键                     | `column.number().primaryKey()`                 |
| `.autoIncrement()`   | 自增                     | `column.number().primaryKey().autoIncrement()` |
| `.nullable()`        | 允许 NULL                | `column.string().nullable()`                   |
| `.unique()`          | 唯一约束                 | `column.string().unique()`                     |
| `.default(value)`    | 默认值                   | `column.number().default(0)`                   |
| `.description(text)` | 字段说明（用于 OpenAPI） | `column.string().description('用户名')`        |
| `.deserialize(fn)`   | 写入时转换               | `column.string().deserialize(v => hash(v))`    |

### 链式组合示例

```typescript
// 可空 + 唯一 + 默认值
email = column.string().nullable().unique().default(null).description('邮箱')

// 主键 + 自增
id = column.number().primaryKey().autoIncrement().description('ID')

// 写入时加密
password = column
  .string()
  .default('')
  .description('密码')
  .deserialize((v) => Bun.password.hash(v))
```

## 🏗️ 基类便捷方法

`TimestampSchema` 提供了常用的静态方法生成标准字段：

| 方法                     | 说明            | 等效写法                           |
| ------------------------ | --------------- | ---------------------------------- |
| `Schema.status(default)` | 状态字段（0/1） | `column.number().default(default)` |
| `Schema.sort(default)`   | 排序字段        | `column.number().default(default)` |

```typescript
export default class RoleSchema extends TimestampSchema {
  id = column.string().primaryKey().description('角色编码')
  name = column.string().default('').description('角色名称')
  status = RoleSchema.status(1).description('状态：1启用 0禁用')
  sort = RoleSchema.sort(0).description('排序值')
}
```

## 🌳 树形结构

通过 `parentId` 字段实现树形结构，配合前端树形组件和后端 tree 接口使用：

```typescript
export default class MenuSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement().description('菜单ID')
  parentId = column.number().nullable().default(null).description('父菜单ID')
  name = column.string().default('').description('菜单名称')
  type = column.number().default(2).description('类型：1目录 2菜单 3按钮')
  sort = MenuSchema.sort(0).description('排序值')
}
```

## 📝 完整示例

以字典类型表为例：

```typescript
import { TimestampSchema, column } from '../../packages/orm'

export const tableName = 'dict_type'

export default class DictTypeSchema extends TimestampSchema {
  /** ID */
  id = column.number().primaryKey().autoIncrement().description('ID')
  /** 字典名称 */
  name = column.string().default('').description('字典名称')
  /** 字典类型（唯一标识） */
  type = column.string().unique().default('').description('字典类型')
  /** 状态 */
  status = DictTypeSchema.status(1).description('状态：1启用 0禁用')
  /** 备注 */
  remark = column.string().nullable().default(null).description('备注')
}
```

## ⚙️ getSchema 方法

每个注册到 `model` 的模型实例都拥有 `getSchema()` 方法，用于自动生成 Elysia 路由的请求/响应 Schema：

```typescript
import { model } from '@/core/model'

// 获取完整 Schema（用于响应）
const fullSchema = model.users.getSchema()

// 获取部分字段（用于创建 Body）
const createBody = model.users.getSchema('omit', ['id', 'createdAt', 'updatedAt'])

// 获取指定字段（用于更新 Body）
const updateBody = model.users.getSchema('pick', ['username', 'nickname', 'email'])
```

::: tip 与 route-model 配合
`getSchema()` 返回的是 Elysia `t.Object()` 类型，可直接用于路由的 `body` / `response` 定义，参见 [route-model 包文档](/packages/route-model)。
:::

## 🔄 代码生成

新增模型后需运行代码生成器更新注册表：

```bash
bun run generate
```

生成器会：

1. 扫描 `models/*/schema.ts`
2. 生成 `_generated/schemas.generated.ts`（Schema 注册表）
3. 生成 `_generated/model.generated.ts`（TypeScript 类型定义）
