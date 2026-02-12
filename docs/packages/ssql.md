# SSQL

## 概述

`@pkg/ssql` 是零依赖的 SQL 条件构建器，提供类 SQL 语法的字符串查询能力，支持前后端共用。

## 核心特性

- **类 SQL 语法**：学习成本极低
- **前后端共用**：前端构建，后端编译
- **防注入**：白名单字段校验 + 自动转义
- **多方言**：SQLite / MySQL / PostgreSQL
- **AST 支持**：解析 → AST → 编译

## 语法速查

### 比较运算符

| SSQL | SQL | 示例 |
|------|-----|------|
| `=` | `=` | `status = 1` |
| `!=` | `!=` | `status != 0` |
| `>` | `>` | `age > 18` |
| `>=` | `>=` | `age >= 18` |
| `<` | `<` | `price < 100` |
| `<=` | `<=` | `price <= 100` |

### 模糊匹配

| SSQL | SQL | 示例 |
|------|-----|------|
| `~` | `LIKE` | `name ~ 'test'` |
| `!~` | `NOT LIKE` | `name !~ 'admin'` |

### 集合运算

| SSQL | SQL | 示例 |
|------|-----|------|
| `?=` | `IN` | `id ?= [1,2,3]` |
| `!?=` | `NOT IN` | `id !?= [4,5,6]` |

### 空值判断

| SSQL | SQL | 示例 |
|------|-----|------|
| `?null` | `IS NULL` | `email ?null` |
| `!?null` | `IS NOT NULL` | `email !?null` |

### 范围

| SSQL | SQL | 示例 |
|------|-----|------|
| `><` | `BETWEEN` | `age >< [18,60]` |

### 逻辑运算

| SSQL | SQL | 示例 |
|------|-----|------|
| `&&` | `AND` | `a = 1 && b = 2` |
| `\|\|` | `OR` | `a = 1 \|\| b = 2` |
| `()` | 分组 | `(a = 1 \|\| b = 2) && c = 3` |

## 后端使用

### SSQL 字符串（推荐）

最简洁的方式，直接使用模板字符串：

```typescript
// 简单条件
const users = await User.findMany(`status = 1`)

// 变量插值（自动安全处理）
const users = await User.findMany(`id = ${id}`)
const users = await User.findMany(`name ~ '${keyword}'`)

// 复合条件
const users = await User.findMany(`status = 1 && roleId = ${roleId}`)

// IN 查询
const users = await User.findMany(`id ?= [${ids.join(',')}]`)
```

### 安全机制

Model 自动配置 `allowedFields` 白名单：

```typescript
// SSQL 中只允许使用模型定义的字段名
const result = await User.findMany(`hackField = 1`)
// ❌ 抛出错误：字段 'hackField' 不在白名单中

const result = await User.findMany(`username = 'admin'`)
// ✅ username 是 User 模型的合法字段
```

### CrudService 中的 SSQL

`CrudService.findAll()` 自动处理前端传来的 SSQL `filter`：

```typescript
// 前端请求: GET /api/admin/users?filter=status%20=%201%20&&%20name%20~%20'test'

.get('/users', async (ctx) => {
  // ctx.query.filter 包含 SSQL 字符串
  // findAll 自动解析并合并到查询条件
  return R.page(await userService.findAll(ctx.query, ctx))
})
```

## 前端使用

### SSQL Builder

前端提供 Builder API 构建 SSQL 字符串：

```typescript
import { SSQLBuilder } from '@/utils/ssql'

const filter = new SSQLBuilder()
  .eq('status', 1)           // status = 1
  .like('name', 'test')      // name ~ 'test'
  .gt('age', 18)             // age > 18
  .in('roleId', [1, 2])      // roleId ?= [1,2]
  .between('price', 10, 100) // price >< [10,100]
  .isNull('deletedAt')       // deletedAt ?null
  .build()

// 结果: "status = 1 && name ~ 'test' && age > 18 && roleId ?= [1,2] && price >< [10,100] && deletedAt ?null"
```

### 在 useTable 中使用

`useTable` 的搜索功能内部使用 SSQL Builder：

```typescript
handleSearch({
  username: 'admin',   // → username ~ 'admin'
  status: 1,           // → status = 1
})
// 自动构建: username ~ 'admin' && status = 1
```

## AST 结构

SSQL 内部使用 AST 表示条件：

```
SSQL: "status = 1 && name ~ 'test'"

AST:
LogicExpr {
  op: '&&',
  left: FieldExpr { field: 'status', op: '=', value: 1 },
  right: FieldExpr { field: 'name', op: '~', value: 'test' },
}
```

### 节点类型

| 类型 | 说明 |
|------|------|
| `FieldExpr` | 字段比较表达式 |
| `LogicExpr` | 逻辑运算（AND/OR） |
| `GroupExpr` | 括号分组 |
| `LiteralExpr` | 字面量（true/false） |

## 编译流程

```
SSQL 字符串
  → Lexer（词法分析）→ Token 流
  → Parser（语法分析）→ AST
  → Compiler（编译）→ SQL + 参数
```

```typescript
// 输入
"status = 1 && name ~ 'test'"

// 编译输出（SQLite）
{
  sql: "status = ? AND name LIKE ?",
  params: [1, '%test%']
}
```
