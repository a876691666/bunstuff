# SSQL - Simple SQL Query Builder

一个零依赖、高性能的 SQL 条件构建器，支持链式 API 和字符串解析两种方式。

## 特性

- 🚀 **零依赖** - 纯 TypeScript 实现，无任何外部依赖
- 🔒 **类型安全** - 完整的 TypeScript 类型支持
- ⚡ **高性能** - 简洁高效的实现
- 🎯 **多数据库** - 支持 MySQL、PostgreSQL、SQLite
- 🔗 **链式 API** - 流畅的构建器模式
- 📝 **字符串解析** - 支持从 SSQL 字符串解析
- 🛡️ **SQL 注入防护** - 自动转义特殊字符
- 🔄 **ORM 兼容** - 支持转换为 ORM WhereCondition 格式

## 模块结构

```
ssql/
├── types.ts       # 基础类型定义
├── expression.ts  # 表达式类 (FieldExpr, LogicExpr, GroupExpr)
├── stringify.ts   # 对象 -> SSQL 字符串 (序列化)
├── compile.ts     # 对象 -> 数据库 SQL (编译)
├── parser.ts      # SSQL 字符串 -> 对象 (反序列化)
├── lexer.ts       # 词法分析器
├── builder.ts     # 链式构建器
├── dialect/       # 数据库方言
└── index.ts       # 统一导出
```

### 三大核心功能

| 功能         | 模块           | 描述               |
| ------------ | -------------- | ------------------ |
| **序列化**   | `stringify.ts` | 对象 → SSQL 字符串 |
| **编译**     | `compile.ts`   | 对象 → 数据库 SQL  |
| **反序列化** | `parser.ts`    | SSQL 字符串 → 对象 |

## 安装

```typescript
import {
  where,
  whereOr,
  parse,
  toMySQL,
  toPostgres,
  toSQLite,
  toWhere,
  toSSQL,
  buildWhere,
} from './packages/ssql'
```

## 快速开始

### Builder API（构建器模式）

```typescript
import { where } from './packages/ssql'

const [raw, sql, params] = where().eq('status', 1).like('name', '张').toMySQL()

// raw: "`status` = 1 AND `name` LIKE '%张%'"     // 组装后的完整 SQL
// sql: "`status` = ? AND `name` LIKE ?"          // 带占位符的 SQL
// params: [1, "%张%"]                            // 参数列表
```

### Parser API（SSQL 字符串 → SQL）

```typescript
import { toMySQL } from './packages/ssql'

const [raw, sql, params] = toMySQL("status = 1 && name ~ '张'")

// raw: "`status` = 1 AND `name` LIKE '%张%'"
// sql: "`status` = ? AND `name` LIKE ?"
// params: [1, "%张%"]
```

### toWhere API（SSQL 字符串 → ORM 对象）

将 SSQL 字符串解析为 ORM 兼容的 WhereCondition 对象：

```typescript
import { toWhere } from './packages/ssql'

// 简单等于
toWhere("name = 'test'")
// => { name: 'test' }

// 多条件 AND
toWhere('age > 18 && status = 1')
// => { age: { $gt: 18 }, status: 1 }

// OR 条件
toWhere('type = 1 || type = 2')
// => { $or: [{ type: 1 }, { type: 2 }] }

// IN 查询
toWhere('id ?= [1, 2, 3]')
// => { id: { $in: [1, 2, 3] } }

// LIKE 查询
toWhere("name ~ 'test'")
// => { name: { $like: 'test' } }

// BETWEEN 查询
toWhere('age >< [18, 30]')
// => { age: { $between: [18, 30] } }

// NULL 检查
toWhere('email ?null')
// => { email: { $isNull: true } }

// 复杂嵌套
toWhere('(status = 1 && type = 2) || (status = 3 && type = 4)')
// => { $or: [{ status: 1, type: 2 }, { status: 3, type: 4 }] }
```

### toSSQL API（ORM 对象 → SSQL 字符串）

将 ORM WhereCondition 对象序列化为 SSQL 字符串：

```typescript
import { toSSQL } from './packages/ssql'

// 简单条件
toSSQL({ name: 'test' })
// => "name = 'test'"

// 多条件
toSSQL({ age: { $gt: 18 }, status: 1 })
// => "age > 18 && status = 1"

// OR 条件
toSSQL({ $or: [{ type: 1 }, { type: 2 }] })
// => "(type = 1 || type = 2)"

// IN 查询
toSSQL({ id: { $in: [1, 2, 3] } })
// => "id ?= [1, 2, 3]"
```

### buildWhere API（ORM 对象 → 数据库 SQL）

将 ORM WhereCondition 对象直接编译为数据库 SQL：

```typescript
import { buildWhere, mysql } from './packages/ssql'

// 简单条件
buildWhere(mysql, { name: 'test' })
// => "`name` = 'test'"

// 多条件
buildWhere(mysql, { age: { $gt: 18 }, status: 1 })
// => "`age` > 18 AND `status` = 1"
```

### 与 ORM Model 配合使用

```typescript
import { toWhere } from './packages/ssql'
import User from './models/user'

// 从 URL 查询参数解析条件
const filter = 'status = 1 && age > 18'
const where = toWhere(filter)

// 直接传入 Model 的查询方法
const users = await User.findMany({ where })
```

### 返回值说明

所有 `toSQL`、`toMySQL`、`toPostgres`、`toSQLite` 方法都返回三元组：

```typescript
type SQLResult = [raw: string, sql: string, params: Values]
```

| 返回值   | 说明                                     |
| -------- | ---------------------------------------- |
| `raw`    | 组装后的完整 SQL（值已转义，可直接执行） |
| `sql`    | 带占位符的 SQL（用于预处理语句）         |
| `params` | 参数列表                                 |

---

## Builder API 详解

### 创建构建器

```typescript
import { where, whereOr, Builder } from './packages/ssql'

// 创建 AND 条件构建器
const builder1 = where()

// 创建 OR 条件构建器
const builder2 = whereOr()

// 直接创建 Builder 实例
const builder3 = new Builder()
```

### 设置逻辑运算符

```typescript
// 设置为 AND 逻辑（默认）
where().and()

// 设置为 OR 逻辑
where().or()
```

---

## 比较操作符

### eq - 等于

```typescript
const [raw, sql, params] = where().eq('status', 1).toMySQL()
// raw: "`status` = 1"
// sql: "`status` = ?"
// params: [1]

const [raw2] = where().eq('name', '张三').toMySQL()
// raw2: "`name` = '张三'"

const [raw3] = where().eq('active', true).toMySQL()
// raw3: "`active` = TRUE"

const [raw4] = where().eq('data', null).toMySQL()
// raw4: "`data` = NULL"
```

### neq - 不等于

```typescript
const [raw, sql, params] = where().neq('status', 0).toMySQL()
// raw: "`status` != 0"
// sql: "`status` != ?"
// params: [0]
```

### gt - 大于

```typescript
const [raw, sql, params] = where().gt('age', 18).toMySQL()
// raw: "`age` > 18"
// sql: "`age` > ?"
// params: [18]
```

### gte - 大于等于

```typescript
const [raw, sql, params] = where().gte('score', 60).toMySQL()
// raw: "`score` >= 60"
// sql: "`score` >= ?"
// params: [60]
```

### lt - 小于

```typescript
const [raw, sql, params] = where().lt('quantity', 10).toMySQL()
// raw: "`quantity` < 10"
// sql: "`quantity` < ?"
// params: [10]
```

### lte - 小于等于

```typescript
const [raw, sql, params] = where().lte('level', 5).toMySQL()
// raw: "`level` <= 5"
// sql: "`level` <= ?"
// params: [5]
```

---

## 模糊匹配

### like - 包含匹配

```typescript
const [raw, sql, params] = where().like('name', '张').toMySQL()
// raw: "`name` LIKE '%张%'"
// sql: "`name` LIKE ?"
// params: ["%张%"]
```

### notLike - 不包含

```typescript
const [raw, sql, params] = where().notLike('title', '测试').toMySQL()
// raw: "`title` NOT LIKE '%测试%'"
// sql: "`title` NOT LIKE ?"
// params: ["%测试%"]
```

---

## 集合操作

### in - 在列表中

```typescript
const [raw, sql, params] = where().in('id', [1, 2, 3]).toMySQL()
// raw: "`id` IN (1, 2, 3)"
// sql: "`id` IN (?, ?, ?)"
// params: [1, 2, 3]

const [raw2, sql2, params2] = where().in('status', ['active', 'pending']).toMySQL()
// raw2: "`status` IN ('active', 'pending')"
// sql2: "`status` IN (?, ?)"
// params2: ["active", "pending"]
```

### notIn - 不在列表中

```typescript
const [raw, sql, params] = where().notIn('category', [4, 5, 6]).toMySQL()
// raw: "`category` NOT IN (4, 5, 6)"
// sql: "`category` NOT IN (?, ?, ?)"
// params: [4, 5, 6]
```

---

## 空值检查

### isNull - 为空

```typescript
const [raw, sql, params] = where().isNull('deleted_at').toMySQL()
// raw: "`deleted_at` IS NULL"
// sql: "`deleted_at` IS NULL"
// params: []
```

### notNull - 不为空

```typescript
const [raw, sql, params] = where().notNull('email').toMySQL()
// raw: "`email` IS NOT NULL"
// sql: "`email` IS NOT NULL"
// params: []
```

---

## 范围查询

### between - 区间

```typescript
const [raw, sql, params] = where().between('age', 18, 60).toMySQL()
// raw: "`age` BETWEEN 18 AND 60"
// sql: "`age` BETWEEN ? AND ?"
// params: [18, 60]

const [raw2, sql2, params2] = where().between('created_at', '2024-01-01', '2024-12-31').toMySQL()
// raw2: "`created_at` BETWEEN '2024-01-01' AND '2024-12-31'"
// sql2: "`created_at` BETWEEN ? AND ?"
// params2: ["2024-01-01", "2024-12-31"]
```

---

## 组合条件

### AND 组合

```typescript
const [raw, sql, params] = where().eq('status', 1).gt('age', 18).like('name', '张').toMySQL()
// raw: "(`status` = 1 AND `age` > 18 AND `name` LIKE '%张%')"
// sql: "(`status` = ? AND `age` > ? AND `name` LIKE ?)"
// params: [1, 18, "%张%"]
```

### OR 组合

```typescript
const [raw, sql, params] = whereOr().eq('role', 'admin').eq('role', 'superadmin').toMySQL()
// raw: "(`role` = 'admin' OR `role` = 'superadmin')"
// sql: "(`role` = ? OR `role` = ?)"
// params: ["admin", "superadmin"]
```

### 嵌套分组 - group

```typescript
// status = 1 AND (type = 'a' OR type = 'b')
const [raw, sql, params] = where()
  .eq('status', 1)
  .group((b) => b.or().eq('type', 'a').eq('type', 'b'))
  .toMySQL()
// raw: "(`status` = 1 AND ((`type` = 'a' OR `type` = 'b')))"
// sql: "(`status` = ? AND ((`type` = ? OR `type` = ?)))"
// params: [1, "a", "b"]

// (age > 18 AND age < 60) OR vip = true
const [raw2, sql2, params2] = whereOr()
  .group((b) => b.gt('age', 18).lt('age', 60))
  .eq('vip', true)
  .toMySQL()
// raw2: "(((`age` > 18 AND `age` < 60)) OR `vip` = TRUE)"
// sql2: "(((`age` > ? AND `age` < ?)) OR `vip` = ?)"
// params2: [18, 60, true]

// 多层嵌套
const [raw3] = where()
  .eq('active', true)
  .group((b) =>
    b
      .or()
      .group((b2) => b2.eq('role', 'admin').eq('level', 10))
      .group((b2) => b2.eq('role', 'vip').gte('points', 1000)),
  )
  .toMySQL()
// raw3: "(`active` = TRUE AND (((`role` = 'admin' AND `level` = 10)) OR ((`role` = 'vip' AND `points` >= 1000))))"
```

### 添加表达式 - expr

```typescript
import { where, parse, FieldExpr, Op } from './packages/ssql'

// 添加解析的表达式
const condition = parse('age > 18')
const [raw, sql, params] = where().eq('status', 1).expr(condition).toMySQL()
// raw: "(`status` = 1 AND `age` > 18)"
// sql: "(`status` = ? AND `age` > ?)"
// params: [1, 18]

// 添加手动创建的表达式
const fieldExpr = new FieldExpr('level', Op.Gte, 5)
const [raw2, sql2, params2] = where().eq('active', true).expr(fieldExpr).toMySQL()
// raw2: "(`active` = TRUE AND `level` >= 5)"
// sql2: "(`active` = ? AND `level` >= ?)"
// params2: [true, 5]
```

---

## 输出方法

### toString - 转为 SSQL 字符串

```typescript
where().eq('name', 'test').gt('age', 18).toString()
// => "(name = 'test' && age > 18)"

where().in('id', [1, 2, 3]).toString()
// => "id ?= [1, 2, 3]"

where().isNull('deleted_at').toString()
// => "deleted_at ?null"
```

### toSQL - 指定方言

```typescript
import { where, mysql, postgres, sqlite, getDialect } from './packages/ssql'

// 使用默认 MySQL
const [raw, sql, params] = where().eq('id', 1).toSQL()
// raw: "`id` = 1"
// sql: "`id` = ?"
// params: [1]

// 指定方言
const [raw2, sql2, params2] = where().eq('id', 1).toSQL(postgres)
// raw2: "\"id\" = 1"
// sql2: "\"id\" = $1"
// params2: [1]

// 使用 getDialect
const dialect = getDialect('postgres')
const [raw3, sql3, params3] = where().eq('id', 1).toSQL(dialect)
// raw3: "\"id\" = 1"
// sql3: "\"id\" = $1"
// params3: [1]
```

### toMySQL - MySQL 输出

```typescript
const [raw, sql, params] = where().eq('id', 1).in('status', [1, 2]).toMySQL()
// raw: "(`id` = 1 AND `status` IN (1, 2))"
// sql: "(`id` = ? AND `status` IN (?, ?))"
// params: [1, 1, 2]
```

### toPostgres - PostgreSQL 输出

```typescript
const [raw, sql, params] = where().eq('id', 1).in('status', [1, 2]).toPostgres()
// raw: "(\"id\" = 1 AND \"status\" IN (1, 2))"
// sql: "(\"id\" = $1 AND \"status\" IN ($2, $3))"
// params: [1, 1, 2]
```

### toSQLite - SQLite 输出

```typescript
const [raw, sql, params] = where().eq('id', 1).in('status', [1, 2]).toSQLite()
// raw: "(\"id\" = 1 AND \"status\" IN (1, 2))"
// sql: "(\"id\" = ? AND \"status\" IN (?, ?))"
// params: [1, 1, 2]
```

---

## Parser API 详解

### SSQL 语法

| 操作符   | 含义                | 示例                 |
| -------- | ------------------- | -------------------- |
| `=`      | 等于                | `name = '张三'`      |
| `!=`     | 不等于              | `status != 0`        |
| `>`      | 大于                | `age > 18`           |
| `>=`     | 大于等于            | `score >= 60`        |
| `<`      | 小于                | `price < 100`        |
| `<=`     | 小于等于            | `level <= 5`         |
| `~`      | 包含(LIKE)          | `name ~ '张'`        |
| `!~`     | 不包含(NOT LIKE)    | `title !~ '测试'`    |
| `?=`     | 在列表中(IN)        | `id ?= [1, 2, 3]`    |
| `?!=`    | 不在列表中(NOT IN)  | `status ?!= [4, 5]`  |
| `?null`  | 为空(IS NULL)       | `deleted_at ?null`   |
| `?!null` | 不为空(IS NOT NULL) | `email ?!null`       |
| `><`     | 区间(BETWEEN)       | `age >< [18, 60]`    |
| `&&`     | 逻辑与(AND)         | `a = 1 && b = 2`     |
| `\|\|`   | 逻辑或(OR)          | `a = 1 \|\| b = 2`   |
| `()`     | 分组                | `(a = 1 \|\| b = 2)` |

### 值类型

```typescript
// 字符串 - 单引号或双引号
toMySQL("name = '张三'")
toMySQL('name = "张三"')

// 数字 - 整数或小数
toMySQL('age = 18')
toMySQL('price = 99.9')
toMySQL('discount = -5')

// 布尔值
toMySQL('active = true')
toMySQL('deleted = false')

// 空值
toMySQL('data = null')

// 数组
toMySQL('id ?= [1, 2, 3]')
toMySQL("name ?= ['a', 'b', 'c']")
```

### parse - 解析为表达式

```typescript
import { parse, mysql } from './packages/ssql'

const expr = parse('status = 1 && age > 18')

// 转为 SSQL 字符串
expr?.toString()
// => "(status = 1 && age > 18)"

// 转为 SQL
const [raw, sql, params] = expr?.toSQL(mysql) ?? ['', '', []]
// raw: "`status` = 1 AND `age` > 18"
// sql: "`status` = ? AND `age` > ?"
// params: [1, 18]
```

### toSQL - 解析并转为 SQL

```typescript
import { toSQL, mysql, postgres } from './packages/ssql'

const [raw, sql, params] = toSQL("name = 'test'", mysql)
// raw: "`name` = 'test'"
// sql: "`name` = ?"
// params: ["test"]

const [raw2, sql2, params2] = toSQL("name = 'test'", postgres)
// raw2: "\"name\" = 'test'"
// sql2: "\"name\" = $1"
// params2: ["test"]
```

### toMySQL - 解析并转为 MySQL

```typescript
import { toMySQL } from './packages/ssql'

const [raw, sql, params] = toMySQL('status = 1')
// raw: "`status` = 1"
// sql: "`status` = ?"
// params: [1]

const [raw2, sql2, params2] = toMySQL('id ?= [1, 2, 3]')
// raw2: "`id` IN (1, 2, 3)"
// sql2: "`id` IN (?, ?, ?)"
// params2: [1, 2, 3]

const [raw3, sql3, params3] = toMySQL("name ~ '张' && age >= 18")
// raw3: "(`name` LIKE '%张%' AND `age` >= 18)"
// sql3: "(`name` LIKE ? AND `age` >= ?)"
// params3: ["%张%", 18]

const [raw4, sql4, params4] = toMySQL("(type = 'a' || type = 'b') && status = 1")
// raw4: "(((`type` = 'a' OR `type` = 'b')) AND `status` = 1)"
// sql4: "(((`type` = ? OR `type` = ?)) AND `status` = ?)"
// params4: ["a", "b", 1]
```

### toPostgres - 解析并转为 PostgreSQL

```typescript
import { toPostgres } from './packages/ssql'

const [raw, sql, params] = toPostgres('status = 1')
// raw: "\"status\" = 1"
// sql: "\"status\" = $1"
// params: [1]

const [raw2, sql2, params2] = toPostgres('id ?= [1, 2, 3]')
// raw2: "\"id\" IN (1, 2, 3)"
// sql2: "\"id\" IN ($1, $2, $3)"
// params2: [1, 2, 3]
```

### toSQLite - 解析并转为 SQLite

```typescript
import { toSQLite } from './packages/ssql'

const [raw, sql, params] = toSQLite('status = 1')
// raw: "\"status\" = 1"
// sql: "\"status\" = ?"
// params: [1]

// SQLite 布尔值转为 0/1
const [raw2, sql2, params2] = toSQLite('active = true')
// raw2: "\"active\" = 1"
// sql2: "\"active\" = ?"
// params2: [true]
```

---

## 方言 (Dialect)

### 内置方言

```typescript
import { mysql, postgres, sqlite, getDialect } from './packages/ssql'

// MySQL 方言
mysql.name // => "mysql"
mysql.quote('id') // => "`id`"
mysql.placeholder(0) // => "?"

// PostgreSQL 方言
postgres.name // => "postgres"
postgres.quote('id') // => "\"id\""
postgres.placeholder(0) // => "$1"
postgres.placeholder(1) // => "$2"

// SQLite 方言
sqlite.name // => "sqlite"
sqlite.quote('id') // => "\"id\""
sqlite.placeholder(0) // => "?"
```

### getDialect - 根据驱动名获取方言

```typescript
import { getDialect } from './packages/ssql'

getDialect('mysql') // => mysql
getDialect('mysql2') // => mysql
getDialect('postgres') // => postgres
getDialect('postgresql') // => postgres
getDialect('pg') // => postgres
getDialect('sqlite') // => sqlite
getDialect('sqlite3') // => sqlite
getDialect('unknown') // => sqlite (默认)
```

### escape - 转义值

每种方言提供 `escape` 方法将值转换为可安全嵌入 SQL 的字符串：

```typescript
import { mysql, postgres, sqlite } from './packages/ssql'

// MySQL 转义（使用反斜杠）
mysql.escape('hello') // => "'hello'"
mysql.escape("it's") // => "'it\\'s'"
mysql.escape('say "hi"') // => "'say \\\"hi\\\"'"
mysql.escape(123) // => "123"
mysql.escape(true) // => "TRUE"
mysql.escape(false) // => "FALSE"
mysql.escape(null) // => "NULL"

// PostgreSQL/SQLite 转义（使用双单引号）
postgres.escape("it's") // => "'it''s'"
sqlite.escape("it's") // => "'it''s'"

// SQLite 布尔值转为数字
sqlite.escape(true) // => "1"
sqlite.escape(false) // => "0"
```

### assemble - 组装 SQL

将带占位符的 SQL 和参数组装成完整的 SQL 语句：

```typescript
import { mysql, postgres, sqlite } from './packages/ssql'

// MySQL (? 占位符)
mysql.assemble('`name` = ? AND `age` > ?', ['张三', 18])
// => "`name` = '张三' AND `age` > 18"

// PostgreSQL ($n 占位符)
postgres.assemble('"name" = $1 AND "age" > $2', ['张三', 18])
// => '"name" = \'张三\' AND "age" > 18'

// SQLite (? 占位符)
sqlite.assemble('"active" = ?', [true])
// => '"active" = 1'
```

### 自定义方言

```typescript
import type { Dialect, Value, Values } from './packages/ssql'
import { where } from './packages/ssql'

// Oracle 方言示例
const oracle: Dialect = {
  name: 'oracle',
  quote: (field) => `"${field.toUpperCase()}"`,
  placeholder: (index) => `:p${index + 1}`,
  escape: (value: Value): string => {
    if (value === null) return 'NULL'
    if (typeof value === 'boolean') return value ? '1' : '0'
    if (typeof value === 'number') return String(value)
    return `'${String(value).replace(/'/g, "''")}'`
  },
  assemble: (sql: string, params: Values): string => {
    let result = sql
    for (let i = 0; i < params.length; i++) {
      result = result.replace(`:p${i + 1}`, oracle.escape(params[i]!))
    }
    return result
  },
}

const [raw, sql, params] = where().eq('id', 1).in('status', [1, 2]).toSQL(oracle)
// raw: "\"ID\" = 1 AND \"STATUS\" IN (1, 2)"
// sql: "\"ID\" = :p1 AND \"STATUS\" IN (:p2, :p3)"
// params: [1, 1, 2]
```

---

## 表达式类

### FieldExpr - 字段表达式

```typescript
import { FieldExpr, Op, mysql } from './packages/ssql'

const expr = new FieldExpr('age', Op.Gt, 18)

expr.field // => "age"
expr.op // => ">"
expr.value // => 18
expr.toString() // => "age > 18"

const [raw, sql, params] = expr.toSQL(mysql)
// raw: "`age` > 18"
// sql: "`age` > ?"
// params: [18]
```

### LogicExpr - 逻辑表达式

```typescript
import { LogicExpr, FieldExpr, Op, Logic, mysql } from './packages/ssql'

const expr = new LogicExpr(Logic.And, [new FieldExpr('a', Op.Eq, 1), new FieldExpr('b', Op.Eq, 2)])

expr.logic // => "&&"
expr.exprs // => [FieldExpr, FieldExpr]
expr.toString() // => "(a = 1 && b = 2)"

const [raw, sql, params] = expr.toSQL(mysql)
// raw: "(`a` = 1 AND `b` = 2)"
// sql: "(`a` = ? AND `b` = ?)"
// params: [1, 2]
```

### GroupExpr - 分组表达式

```typescript
import { GroupExpr, FieldExpr, Op, mysql } from './packages/ssql'

const inner = new FieldExpr('status', Op.Eq, 1)
const expr = new GroupExpr(inner)

expr.inner // => FieldExpr
expr.toString() // => "(status = 1)"

const [raw, sql, params] = expr.toSQL(mysql)
// raw: "(`status` = 1)"
// sql: "(`status` = ?)"
// params: [1]
```

---

## 完整示例

### 用户查询

```typescript
import { where } from './packages/ssql'

// 查询活跃的成年用户
const [raw, sql, params] = where()
  .eq('active', true)
  .gte('age', 18)
  .notNull('email')
  .isNull('deleted_at')
  .toMySQL()

// raw: "(`active` = TRUE AND `age` >= 18 AND `email` IS NOT NULL AND `deleted_at` IS NULL)"
// 可直接用于: SELECT * FROM users WHERE {raw}
```

### 商品搜索

```typescript
import { where } from './packages/ssql'

// 搜索价格在 100-500 之间，分类为 1,2,3 的商品
const [raw, sql, params] = where()
  .between('price', 100, 500)
  .in('category_id', [1, 2, 3])
  .like('name', '手机')
  .eq('status', 'on_sale')
  .toMySQL()

// raw: "(`price` BETWEEN 100 AND 500 AND `category_id` IN (1, 2, 3) AND `name` LIKE '%手机%' AND `status` = 'on_sale')"
```

### 订单筛选

```typescript
import { where, Builder } from './packages/ssql'

// 查询待处理或已付款的订单
const [raw, sql, params] = where()
  .group((b: Builder) => b.or().eq('status', 'pending').eq('status', 'paid'))
  .gte('amount', 100)
  .notNull('user_id')
  .toPostgres()

// raw: "((\"status\" = 'pending' OR \"status\" = 'paid') AND \"amount\" >= 100 AND \"user_id\" IS NOT NULL)"
// sql: "((\"status\" = $1 OR \"status\" = $2) AND \"amount\" >= $3 AND \"user_id\" IS NOT NULL)"
// params: ["pending", "paid", 100]
```

### 动态条件

```typescript
import { where, parse } from './packages/ssql'

function buildQuery(filters: Record<string, any>) {
  const builder = where()

  if (filters.status !== undefined) {
    builder.eq('status', filters.status)
  }
  if (filters.minAge !== undefined) {
    builder.gte('age', filters.minAge)
  }
  if (filters.keyword) {
    builder.like('name', filters.keyword)
  }
  if (filters.ids?.length) {
    builder.in('id', filters.ids)
  }

  // 也可以添加解析的条件
  if (filters.extra) {
    builder.expr(parse(filters.extra))
  }

  return builder.toMySQL()
}

const [raw, sql, params] = buildQuery({ status: 1, minAge: 18, keyword: 'test' })
// raw: "(`status` = 1 AND `age` >= 18 AND `name` LIKE '%test%')"
// sql: "(`status` = ? AND `age` >= ? AND `name` LIKE ?)"
// params: [1, 18, "%test%"]
```

### 使用 raw SQL 直接执行

```typescript
import { where } from './packages/ssql'

// 当你需要直接执行 SQL（如日志、调试、或简单查询）
const [raw, sql, params] = where()
  .eq('id', 1)
  .like('name', "O'Brien") // 特殊字符会被正确转义
  .toMySQL()

// raw: "`id` = 1 AND `name` LIKE '%O\\'Brien%'"
// 可直接用于: db.query(raw)

// 当你需要使用预处理语句（推荐用于生产环境）
// 使用 sql 和 params: db.query(sql, params)
```

---

## 类型定义

```typescript
// 值类型
type Value = string | number | boolean | null
type Values = Value[]

// SQL 结果 - 三元组
type SQLResult = [raw: string, sql: string, params: Values]
// raw:    组装后的完整 SQL（值已转义）
// sql:    带占位符的 SQL
// params: 参数列表

// 操作符
enum Op {
  Eq = '=',
  Neq = '!=',
  Gt = '>',
  Gte = '>=',
  Lt = '<',
  Lte = '<=',
  Like = '~',
  NotLike = '!~',
  In = '?=',
  NotIn = '?!=',
  IsNull = '?null',
  NotNull = '?!null',
  Between = '><',
}

// 逻辑运算符
enum Logic {
  And = '&&',
  Or = '||',
}

// 方言接口
interface Dialect {
  readonly name: string
  quote(field: string): string
  placeholder(index: number): string
  escape(value: Value): string // 转义单个值
  assemble(sql: string, params: Values): string // 组装完整 SQL
}

// 表达式接口
interface Expression {
  toSQL(dialect: Dialect, offset?: number): SQLResult
  toString(): string
}
```

---

## 文件结构

```
packages/ssql/
├── index.ts           # 主入口，导出所有 API
├── types.ts           # 类型定义
├── expression.ts      # 表达式类
├── builder.ts         # 构建器
├── lexer.ts           # 词法分析器
├── parser.ts          # 语法分析器
├── dialect/           # 数据库方言
│   ├── index.ts
│   ├── mysql.ts       # MySQL 方言（反斜杠转义）
│   ├── postgres.ts    # PostgreSQL 方言（$n 占位符）
│   └── sqlite.ts      # SQLite 方言（布尔值转数字）
└── index.test.ts      # 测试文件
```

## License

MIT
