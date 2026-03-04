# @pkg/ssql

安全 SQL 查询 DSL（Safe SQL），提供类型安全、防注入的查询条件表达能力。支持字符串语法解析和链式 Builder 两种用法。

## 🎯 核心能力

| 功能          | 说明                                                       |
| ------------- | ---------------------------------------------------------- |
| **SSQL 语法** | 类 SQL 但更安全的查询字符串 `status=1 && username~"admin"` |
| **Parser**    | 将 SSQL 字符串解析为表达式树                               |
| **Compiler**  | 将表达式编译为目标数据库 SQL                               |
| **Builder**   | 链式 API 构建查询条件                                      |
| **多方言**    | 支持 MySQL / PostgreSQL / SQLite                           |
| **防注入**    | 参数化查询 + 字段白名单验证                                |

## 📋 SSQL 语法

### 操作符

| 操作符   | 说明            | 示例               |
| -------- | --------------- | ------------------ |
| `=`      | 等于            | `status=1`         |
| `!=`     | 不等于          | `status!=0`        |
| `>`      | 大于            | `age>18`           |
| `>=`     | 大于等于        | `age>=18`          |
| `<`      | 小于            | `score<60`         |
| `<=`     | 小于等于        | `score<=100`       |
| `~`      | 模糊匹配 (LIKE) | `username~"admin"` |
| `!~`     | 非模糊匹配      | `username!~"test"` |
| `?=`     | IN              | `status?=(1,2,3)`  |
| `?!=`    | NOT IN          | `type?!=(1,2)`     |
| `?null`  | IS NULL         | `email?null`       |
| `?!null` | IS NOT NULL     | `email?!null`      |
| `><`     | BETWEEN         | `age><(18,60)`     |

### 逻辑连接

| 连接符 | 说明 | 示例                                     |
| ------ | ---- | ---------------------------------------- |
| `&&`   | AND  | `status=1 && age>18`                     |
| `\|\|` | OR   | `role="admin" \|\| role="manager"`       |
| `()`   | 分组 | `(status=1 && age>18) \|\| role="admin"` |

### 完整示例

```
status=1 && (username~"admin" || email~"admin") && createdAt>"2024-01-01"
```

编译为 SQLite：

```sql
WHERE status = 1 AND (username LIKE '%admin%' OR email LIKE '%admin%') AND createdAt > '2024-01-01'
```

## 🔧 核心 API

### 解析与编译

```typescript
import { toSQL, toSQLite, toMySQL, toPostgres, parse } from '@pkg/ssql'

// SSQL → SQL（指定方言）
const [wherePart, fullSql, params] = toSQLite('status=1 && username~"admin"')
// wherePart → "status = 1 AND username LIKE '%admin%'"

// 带字段白名单验证
const result = toSQLite('status=1', {
  allowedFields: ['status', 'username', 'email'],
})
```

### Builder 链式构建

```typescript
import { where, whereOr } from '@pkg/ssql'

// AND 条件
const filter = where().eq('status', 1).like('username', 'admin').gt('age', 18).toString()
// → '(status=1 && username~"admin" && age>18)'

// OR 条件
const filter = whereOr().eq('role', 'admin').eq('role', 'manager').toString()
// → '(role="admin" || role="manager")'

// 嵌套组合
const filter = where()
  .eq('status', 1)
  .group(whereOr().like('username', 'test').like('email', 'test'))
  .toString()
// → '(status=1 && (username~"test" || email~"test"))'
```

### ORM 条件对象

```typescript
import { toWhere, buildWhere, sqlite } from '@pkg/ssql'

// SSQL 字符串 → ORM 条件对象
const condition = toWhere('status=1 && age>18')

// ORM 条件 → SQL WHERE
const sql = buildWhere(sqlite, condition)
```

## 🌐 前后端统一

前端同样提供 Builder API（位于 `frontend/src/utils/ssql/`），生成 SSQL 字符串后通过 API 的 `filter` 参数传递给后端：

```
前端 Builder → SSQL 字符串 → HTTP filter 参数 → 后端 Parser → SQL WHERE
```

::: tip 安全性
SSQL 的安全性体现在：

- 字段白名单验证，防止访问非授权字段
- 参数化查询输出，防止 SQL 注入
- 无法执行子查询或函数调用
  :::
