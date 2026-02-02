/**
 * 对象序列化为 SSQL 字符串
 * 负责将表达式对象转换为 SSQL 语法字符串
 */

import {
  Op,
  type Value,
  type Values,
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

// ============ 值格式化 ============

/** 将值格式化为 SSQL 字符串 */
function formatValue(v: Value): string {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return String(v)
  if (typeof v === 'string') return `'${v}'`
  return String(v)
}

/** 将值数组格式化为 SSQL 字符串 */
function formatValues(vals: Values): string {
  return `[${vals.map(formatValue).join(', ')}]`
}

// ============ 字段表达式字符串化 ============

/** 将字段表达式转为 SSQL 字符串 */
export function stringifyField(field: string, op: Op, value?: Value | Values): string {
  switch (op) {
    case Op.In:
    case Op.NotIn:
    case Op.Between:
      return `${field} ${op} ${formatValues(value as Values)}`
    case Op.IsNull:
    case Op.NotNull:
      return `${field} ${op}`
    default:
      return `${field} ${op} ${formatValue(value as Value)}`
  }
}

// ============ ORM 条件字符串化 ============

/** 将 OrmFieldCondition 转为 SSQL 字符串 */
export function stringifyFieldCondition(field: string, condition: OrmFieldCondition): string {
  if (condition === null) {
    return `${field} ${Op.IsNull}`
  }

  if (typeof condition !== 'object') {
    return `${field} ${Op.Eq} ${formatValue(condition)}`
  }

  if (isOrmEqCondition(condition)) return `${field} ${Op.Eq} ${formatValue(condition.$eq)}`
  if (isOrmNeCondition(condition)) return `${field} ${Op.Neq} ${formatValue(condition.$ne)}`
  if (isOrmGtCondition(condition)) return `${field} ${Op.Gt} ${formatValue(condition.$gt)}`
  if (isOrmGteCondition(condition)) return `${field} ${Op.Gte} ${formatValue(condition.$gte)}`
  if (isOrmLtCondition(condition)) return `${field} ${Op.Lt} ${formatValue(condition.$lt)}`
  if (isOrmLteCondition(condition)) return `${field} ${Op.Lte} ${formatValue(condition.$lte)}`
  if (isOrmLikeCondition(condition)) return `${field} ${Op.Like} ${formatValue(condition.$like)}`
  if (isOrmNotLikeCondition(condition))
    return `${field} ${Op.NotLike} ${formatValue(condition.$notLike)}`
  if (isOrmInCondition(condition)) return `${field} ${Op.In} ${formatValues(condition.$in)}`
  if (isOrmNotInCondition(condition))
    return `${field} ${Op.NotIn} ${formatValues(condition.$notIn)}`
  if (isOrmIsNullCondition(condition)) return `${field} ${Op.IsNull}`
  if (isOrmIsNotNullCondition(condition)) return `${field} ${Op.NotNull}`
  if (isOrmBetweenCondition(condition))
    return `${field} ${Op.Between} ${formatValues(condition.$between)}`

  return `${field} ${Op.Eq} ${formatValue(condition as Value)}`
}

/** 将 OrmWhereCondition 转为 SSQL 字符串 */
export function stringifyWhere(where: OrmWhereCondition): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (key === '$or' && Array.isArray(value)) {
      const orParts = value.map((c) => stringifyWhere(c as OrmWhereCondition)).filter(Boolean)
      if (orParts.length > 0) {
        parts.push(orParts.length === 1 ? orParts[0]! : `(${orParts.join(' || ')})`)
      }
      continue
    }

    if (key === '$and' && Array.isArray(value)) {
      const andParts = value.map((c) => stringifyWhere(c as OrmWhereCondition)).filter(Boolean)
      if (andParts.length > 0) {
        parts.push(andParts.length === 1 ? andParts[0]! : `(${andParts.join(' && ')})`)
      }
      continue
    }

    parts.push(stringifyFieldCondition(key, value as OrmFieldCondition))
  }

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]!

  return parts.join(' && ')
}
