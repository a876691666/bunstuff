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
  type CompileOptions,
  type OrmFieldCondition,
  type OrmWhereCondition,
  validateField,
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

/** 将字段表达式编译为 SQL（带字段验证） */
export function compileField(
  dialect: Dialect,
  field: string,
  op: Op,
  value: Value | Values | undefined,
  offset = 0,
  options?: CompileOptions,
): InternalSQL {
  // 字段白名单验证
  if (!validateField(field, options)) {
    // 字段不在白名单中且 throwOnInvalidField = false，返回空
    return ['', []]
  }

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
  options?: CompileOptions,
): SQLResult {
  const [sql, params] = compileField(dialect, field, op, value, offset, options)
  return toResult(dialect, sql, params)
}

// ============ ORM 条件编译 ============

/** 将 OrmFieldCondition 编译为 SQL（不含占位符，直接嵌入值） */
export function compileFieldConditionRaw(
  dialect: Dialect,
  field: string,
  condition: OrmFieldCondition,
  options?: CompileOptions,
): string {
  // 字段白名单验证
  if (!validateField(field, options)) {
    return ''
  }

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
export function compileWhereRaw(
  dialect: Dialect,
  where: OrmWhereCondition,
  options?: CompileOptions,
): string {
  const clauses: string[] = []

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (key === '$or' && Array.isArray(value)) {
      const orClauses = value
        .map((c) => compileWhereRaw(dialect, c as OrmWhereCondition, options))
        .filter(Boolean)
      if (orClauses.length > 0) {
        clauses.push(`(${orClauses.map((c) => `(${c})`).join(' OR ')})`)
      }
      continue
    }

    if (key === '$and' && Array.isArray(value)) {
      const andClauses = value
        .map((c) => compileWhereRaw(dialect, c as OrmWhereCondition, options))
        .filter(Boolean)
      if (andClauses.length > 0) {
        clauses.push(`(${andClauses.map((c) => `(${c})`).join(' AND ')})`)
      }
      continue
    }

    const clause = compileFieldConditionRaw(dialect, key, value as OrmFieldCondition, options)
    if (clause) clauses.push(clause)
  }

  return clauses.length > 0 ? clauses.join(' AND ') : '1=1'
}

/** 将 OrmFieldCondition 编译为 SQL（带占位符） */
export function compileFieldCondition(
  dialect: Dialect,
  field: string,
  condition: OrmFieldCondition,
  offset = 0,
  options?: CompileOptions,
): InternalSQL {
  if (condition === null) {
    return compileField(dialect, field, Op.IsNull, undefined, offset, options)
  }

  if (typeof condition !== 'object') {
    return compileField(dialect, field, Op.Eq, condition, offset, options)
  }

  if (isOrmEqCondition(condition)) return compileField(dialect, field, Op.Eq, condition.$eq, offset, options)
  if (isOrmNeCondition(condition))
    return compileField(dialect, field, Op.Neq, condition.$ne, offset, options)
  if (isOrmGtCondition(condition)) return compileField(dialect, field, Op.Gt, condition.$gt, offset, options)
  if (isOrmGteCondition(condition))
    return compileField(dialect, field, Op.Gte, condition.$gte, offset, options)
  if (isOrmLtCondition(condition)) return compileField(dialect, field, Op.Lt, condition.$lt, offset, options)
  if (isOrmLteCondition(condition))
    return compileField(dialect, field, Op.Lte, condition.$lte, offset, options)
  if (isOrmLikeCondition(condition))
    return compileField(dialect, field, Op.Like, condition.$like, offset, options)
  if (isOrmNotLikeCondition(condition))
    return compileField(dialect, field, Op.NotLike, condition.$notLike, offset, options)
  if (isOrmInCondition(condition)) return compileField(dialect, field, Op.In, condition.$in, offset, options)
  if (isOrmNotInCondition(condition))
    return compileField(dialect, field, Op.NotIn, condition.$notIn, offset, options)
  if (isOrmIsNullCondition(condition))
    return compileField(dialect, field, Op.IsNull, undefined, offset, options)
  if (isOrmIsNotNullCondition(condition))
    return compileField(dialect, field, Op.NotNull, undefined, offset, options)
  if (isOrmBetweenCondition(condition))
    return compileField(dialect, field, Op.Between, condition.$between, offset, options)

  return compileField(dialect, field, Op.Eq, condition as Value, offset, options)
}

/** 将 OrmWhereCondition 编译为 SQL（带占位符） */
export function compileWhere(
  dialect: Dialect,
  where: OrmWhereCondition,
  offset = 0,
  options?: CompileOptions,
): InternalSQL {
  const parts: string[] = []
  const params: Values = []

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (key === '$or' && Array.isArray(value)) {
      const orParts: string[] = []
      for (const c of value) {
        const [sql, vals] = compileWhere(dialect, c as OrmWhereCondition, offset + params.length, options)
        if (sql && sql !== '1=1') {
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
        const [sql, vals] = compileWhere(dialect, c as OrmWhereCondition, offset + params.length, options)
        if (sql && sql !== '1=1') {
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
      options,
    )
    if (sql) {
      parts.push(sql)
      params.push(...vals)
    }
  }

  return [parts.length > 0 ? parts.join(' AND ') : '1=1', params]
}

/** 将 OrmWhereCondition 编译为完整 SQL 结果 */
export function compileWhereToSQL(
  dialect: Dialect,
  where: OrmWhereCondition,
  offset = 0,
  options?: CompileOptions,
): SQLResult {
  const [sql, params] = compileWhere(dialect, where, offset, options)
  return toResult(dialect, sql, params)
}
