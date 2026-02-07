---
name: ssql-string
description: SSQL 字符串查询的规范用法。简洁、类型安全、防 SQL 注入。
---

# SSQL 字符串最佳实践

**核心原则：直接使用字符串，不用 where() 构建器**

```typescript
// ✅ 推荐
;`id = ${id} && age > 18`

// ❌ 不推荐
where().eq('id', id).gt('age', 18)
```

## 语法速查

```typescript
// 比较运算符
;`id = ${id}``age > 18``age >= 18``age < 60``age <= 60``status != 0`
// 逻辑运算符
`status = 1 && age > 18` // AND
`type = 1 || type = 2` // OR
`status = 1 && (type = 1 || type = 2)` // 分组
// 特殊运算符
`name ~ 'test'` // LIKE '%test%'
`name ~^ 'test'` // LIKE 'test%'
`name ~$ 'test'` // LIKE '%test'
`id ?= [1,2,3]` // IN
`id !?= [1,2,3]` // NOT IN
`age >< [18,60]` // BETWEEN
`email ?null` // IS NULL
`email !?null` // IS NOT NULL
```

## 使用规范

### 查询示例

```typescript
// 单条件
Model.findOne({ where: `id = ${id}` })
Model.findOne({ where: `code = '${code}'` })

// 多条件
Model.findMany({ where: `userId = ${userId} && status = 1` })

// 分页查询
async findAll(query?: { page?: number; pageSize?: number; filter?: string }) {
  const page = query?.page ?? 1
  const pageSize = query?.pageSize ?? 10
  const data = await Model.findMany({
    where: query?.filter,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })
  const total = await Model.count(query?.filter)
  return { data, total, page, pageSize }
}

// 删除
Model.deleteMany(`vipTierId = ${tierId}`)
```

### 插值规则

```typescript
// 数值：直接插值
;`id = ${id}``status = ${status}`
// 字符串：加单引号
`code = '${code}'``name ~ '${keyword}'`

// 动态条件：直接传递
const where = query?.filter
Model.findMany({ where })
```

## 安全性

- Model 自动配置 `allowedFields`（基于 schema）
- 自动转义特殊字符，防 SQL 注入
- 非法字段抛错保护

## 迁移对照

| 构建器                                  | SSQL 字符串                  |
| --------------------------------------- | ---------------------------- |
| `where().eq('id', id)`                  | `\`id = ${id}\``             |
| `where().eq('status', 1).gt('age', 18)` | `\`status = 1 && age > 18\`` |
| `where().like('name', 'test')`          | `\`name ~ 'test'\``          |
| `where().in('id', [1,2,3])`             | `\`id ?= [1,2,3]\``          |

**注意：字符串字段需加引号 `'${code}'`，数值直接 `${id}`，LIKE 无需手动加 %**
