/**
 * 对象序列化为数据库 SQL 字符串
 * 负责将表达式对象编译为特定数据库的 SQL
 */

import {
  Op,
  type Value,
  type Values,
  type Dialect,
  type SQLResult,
  type OrmFieldCondition,
  type OrmWhereCondition,
  isOrmEqCondition,
  isOrmNeCondition,
  isOrmGtCondition,
  isOrmGteCondition,
  isOrmLtCondition,
  isOrmLteCondition,
  isOrmLikeCondition,
  isOrmNotLikeCondition,
  isOrmInCondition,
  isOrmNotInCondition,
  isOrmIsNullCondition,
  isOrmIsNotNullCondition,
  isOrmBetweenCondition,
} from './types'

// ============ 内部类型 ============

/** 内部 SQL 结果（不含 raw） */
type InternalSQL = [sql: string, params: Values]

// ============ 结果组装 ============

/** 组装最终结果 */
function toResult(dialect: Dialect, sql: string, params: Values): SQLResult {
  return [dialect.assemble(sql, params), sql, params]
}

// ============ 字段表达式编译 ============

/** 将字段表达式编译为 SQL */
export function compileField(
  dialect: Dialect,
  field: string,
  op: Op,
  value: Value | Values | undefined,
  offset = 0,
): InternalSQL {
  const f = dialect.quote(field)

  switch (op) {
    case Op.Eq:
      return [`${f} = ${dialect.placeholder(offset)}`, [value as Value]]
    case Op.Neq:
      return [`${f} != ${dialect.placeholder(offset)}`, [value as Value]]
    case Op.Gt:
      return [`${f} > ${dialect.placeholder(offset)}`, [value as Value]]
    case Op.Gte:
      return [`${f} >= ${dialect.placeholder(offset)}`, [value as Value]]
    case Op.Lt:
      return [`${f} < ${dialect.placeholder(offset)}`, [value as Value]]
    case Op.Lte:
      return [`${f} <= ${dialect.placeholder(offset)}`, [value as Value]]
    case Op.Like:
      return [`${f} LIKE ${dialect.placeholder(offset)}`, [`%${value}%`]]
    case Op.NotLike:
      return [`${f} NOT LIKE ${dialect.placeholder(offset)}`, [`%${value}%`]]
    case Op.In: {
      const vals = value as Values
      const ph = vals.map((_, i) => dialect.placeholder(offset + i)).join(', ')
      return [`${f} IN (${ph})`, vals]
    }
    case Op.NotIn: {
      const vals = value as Values
      const ph = vals.map((_, i) => dialect.placeholder(offset + i)).join(', ')
      return [`${f} NOT IN (${ph})`, vals]
    }
    case Op.IsNull:
      return [`${f} IS NULL`, []]
    case Op.NotNull:
      return [`${f} IS NOT NULL`, []]
    case Op.Between: {
      const vals = value as Values
      return [
        `${f} BETWEEN ${dialect.placeholder(offset)} AND ${dialect.placeholder(offset + 1)}`,
        [vals[0] ?? null, vals[1] ?? null],
      ]
    }
  }
}

/** 将字段表达式编译为完整 SQL 结果 */
export function compileFieldToSQL(
  dialect: Dialect,
  field: string,
  op: Op,
  value: Value | Values | undefined,
  offset = 0,
): SQLResult {
  const [sql, params] = compileField(dialect, field, op, value, offset)
  return toResult(dialect, sql, params)
}

// ============ ORM 条件编译 ============

/** 将 OrmFieldCondition 编译为 SQL（不含占位符，直接嵌入值） */
export function compileFieldConditionRaw(
  dialect: Dialect,
  field: string,
  condition: OrmFieldCondition,
): string {
  const f = dialect.quote(field)

  if (condition === null) {
    return `${f} IS NULL`
  }

  if (typeof condition !== 'object') {
    return `${f} = ${dialect.escape(condition)}`
  }

  if (isOrmEqCondition(condition)) return `${f} = ${dialect.escape(condition.$eq)}`
  if (isOrmNeCondition(condition)) return `${f} != ${dialect.escape(condition.$ne)}`
  if (isOrmGtCondition(condition)) return `${f} > ${dialect.escape(condition.$gt)}`
  if (isOrmGteCondition(condition)) return `${f} >= ${dialect.escape(condition.$gte)}`
  if (isOrmLtCondition(condition)) return `${f} < ${dialect.escape(condition.$lt)}`
  if (isOrmLteCondition(condition)) return `${f} <= ${dialect.escape(condition.$lte)}`
  if (isOrmLikeCondition(condition)) return `${f} LIKE ${dialect.escape(`%${condition.$like}%`)}`
  if (isOrmNotLikeCondition(condition))
    return `${f} NOT LIKE ${dialect.escape(`%${condition.$notLike}%`)}`
  if (isOrmInCondition(condition)) {
    const arr = condition.$in
    return arr.length > 0 ? `${f} IN (${arr.map((v) => dialect.escape(v)).join(', ')})` : '1=0'
  }
  if (isOrmNotInCondition(condition)) {
    const arr = condition.$notIn
    return arr.length > 0 ? `${f} NOT IN (${arr.map((v) => dialect.escape(v)).join(', ')})` : '1=1'
  }
  if (isOrmIsNullCondition(condition)) return `${f} IS NULL`
  if (isOrmIsNotNullCondition(condition)) return `${f} IS NOT NULL`
  if (isOrmBetweenCondition(condition)) {
    const [min, max] = condition.$between
    return `${f} BETWEEN ${dialect.escape(min)} AND ${dialect.escape(max)}`
  }

  return `${f} = ${dialect.escape(condition as Value)}`
}

/** 将 OrmWhereCondition 编译为 SQL WHERE 子句（不含占位符） */
export function compileWhereRaw(dialect: Dialect, where: OrmWhereCondition): string {
  const clauses: string[] = []

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (key === '$or' && Array.isArray(value)) {
      const orClauses = value
        .map((c) => compileWhereRaw(dialect, c as OrmWhereCondition))
        .filter(Boolean)
      if (orClauses.length > 0) {
        clauses.push(`(${orClauses.map((c) => `(${c})`).join(' OR ')})`)
      }
      continue
    }

    if (key === '$and' && Array.isArray(value)) {
      const andClauses = value
        .map((c) => compileWhereRaw(dialect, c as OrmWhereCondition))
        .filter(Boolean)
      if (andClauses.length > 0) {
        clauses.push(`(${andClauses.map((c) => `(${c})`).join(' AND ')})`)
      }
      continue
    }

    clauses.push(compileFieldConditionRaw(dialect, key, value as OrmFieldCondition))
  }

  return clauses.length > 0 ? clauses.join(' AND ') : '1=1'
}

/** 将 OrmFieldCondition 编译为 SQL（带占位符） */
export function compileFieldCondition(
  dialect: Dialect,
  field: string,
  condition: OrmFieldCondition,
  offset = 0,
): InternalSQL {
  if (condition === null) {
    return compileField(dialect, field, Op.IsNull, undefined, offset)
  }

  if (typeof condition !== 'object') {
    return compileField(dialect, field, Op.Eq, condition, offset)
  }

  if (isOrmEqCondition(condition)) return compileField(dialect, field, Op.Eq, condition.$eq, offset)
  if (isOrmNeCondition(condition))
    return compileField(dialect, field, Op.Neq, condition.$ne, offset)
  if (isOrmGtCondition(condition)) return compileField(dialect, field, Op.Gt, condition.$gt, offset)
  if (isOrmGteCondition(condition))
    return compileField(dialect, field, Op.Gte, condition.$gte, offset)
  if (isOrmLtCondition(condition)) return compileField(dialect, field, Op.Lt, condition.$lt, offset)
  if (isOrmLteCondition(condition))
    return compileField(dialect, field, Op.Lte, condition.$lte, offset)
  if (isOrmLikeCondition(condition))
    return compileField(dialect, field, Op.Like, condition.$like, offset)
  if (isOrmNotLikeCondition(condition))
    return compileField(dialect, field, Op.NotLike, condition.$notLike, offset)
  if (isOrmInCondition(condition)) return compileField(dialect, field, Op.In, condition.$in, offset)
  if (isOrmNotInCondition(condition))
    return compileField(dialect, field, Op.NotIn, condition.$notIn, offset)
  if (isOrmIsNullCondition(condition))
    return compileField(dialect, field, Op.IsNull, undefined, offset)
  if (isOrmIsNotNullCondition(condition))
    return compileField(dialect, field, Op.NotNull, undefined, offset)
  if (isOrmBetweenCondition(condition))
    return compileField(dialect, field, Op.Between, condition.$between, offset)

  return compileField(dialect, field, Op.Eq, condition as Value, offset)
}

/** 将 OrmWhereCondition 编译为 SQL（带占位符） */
export function compileWhere(dialect: Dialect, where: OrmWhereCondition, offset = 0): InternalSQL {
  const parts: string[] = []
  const params: Values = []

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (key === '$or' && Array.isArray(value)) {
      const orParts: string[] = []
      for (const c of value) {
        const [sql, vals] = compileWhere(dialect, c as OrmWhereCondition, offset + params.length)
        if (sql) {
          orParts.push(`(${sql})`)
          params.push(...vals)
        }
      }
      if (orParts.length > 0) {
        parts.push(`(${orParts.join(' OR ')})`)
      }
      continue
    }

    if (key === '$and' && Array.isArray(value)) {
      const andParts: string[] = []
      for (const c of value) {
        const [sql, vals] = compileWhere(dialect, c as OrmWhereCondition, offset + params.length)
        if (sql) {
          andParts.push(`(${sql})`)
          params.push(...vals)
        }
      }
      if (andParts.length > 0) {
        parts.push(`(${andParts.join(' AND ')})`)
      }
      continue
    }

    const [sql, vals] = compileFieldCondition(
      dialect,
      key,
      value as OrmFieldCondition,
      offset + params.length,
    )
    parts.push(sql)
    params.push(...vals)
  }

  return [parts.length > 0 ? parts.join(' AND ') : '1=1', params]
}

/** 将 OrmWhereCondition 编译为完整 SQL 结果 */
export function compileWhereToSQL(
  dialect: Dialect,
  where: OrmWhereCondition,
  offset = 0,
): SQLResult {
  const [sql, params] = compileWhere(dialect, where, offset)
  return toResult(dialect, sql, params)
}
