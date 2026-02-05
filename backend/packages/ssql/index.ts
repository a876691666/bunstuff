// ============ 类型导出 ============
export type {
  Value,
  Values,
  SQLResult,
  Token,
  Dialect,
  CompileOptions,
  OrmFieldCondition,
  OrmWhereCondition,
} from './types'
export { Op, Logic, TokenType, FieldValidationError, validateField } from './types'

// ============ 表达式导出 ============
export { FieldExpr, LogicExpr, GroupExpr, type Expression } from './expression'

// ============ 方言导出 ============
export { mysql, postgres, sqlite, getDialect, getDialectFromConnection } from './dialect'

// ============ 序列化导出 (对象 -> SSQL 字符串) ============
export { stringifyField, stringifyFieldCondition, stringifyWhere } from './stringify'

// ============ 编译导出 (对象 -> 数据库 SQL) ============
export {
  compileField,
  compileFieldToSQL,
  compileFieldCondition,
  compileFieldConditionRaw,
  compileWhere,
  compileWhereRaw,
  compileWhereToSQL,
} from './compile'

// ============ 解析导出 (SSQL 字符串 -> 对象) ============
export { parse } from './parser'

// ============ 构建器导出 ============
export { Builder, where, whereOr } from './builder'

// ============ 便捷函数 ============
import { parse } from './parser'
import { mysql, postgres, sqlite } from './dialect'
import { compileWhereRaw as buildWhereInternal } from './compile'
import { stringifyWhere } from './stringify'
import type { Dialect, SQLResult, OrmWhereCondition, CompileOptions } from './types'

/**
 * 将 SSQL 字符串解析并编译为数据库 SQL（支持字段白名单验证）
 * @param ssql SSQL 字符串
 * @param dialect 数据库方言
 * @param options 编译选项（可指定 allowedFields 白名单）
 * @example toSQL("name = 'test' && age > 18", mysql, { allowedFields: ['name', 'age'] })
 */
export function toSQL(ssql: string, dialect: Dialect = mysql, options?: CompileOptions): SQLResult {
  const expr = parse(ssql)
  return expr ? expr.toSQL(dialect, 0, options) : ['', '', []]
}

export function toMySQL(ssql: string, options?: CompileOptions): SQLResult {
  return toSQL(ssql, mysql, options)
}

export function toPostgres(ssql: string, options?: CompileOptions): SQLResult {
  return toSQL(ssql, postgres, options)
}

export function toSQLite(ssql: string, options?: CompileOptions): SQLResult {
  return toSQL(ssql, sqlite, options)
}

/**
 * 将 SSQL 字符串解析为 ORM WhereCondition
 * @example toWhere("name = 'test'") // { name: 'test' }
 */
export function toWhere(ssql: string): OrmWhereCondition {
  const expr = parse(ssql)
  return expr ? expr.toWhere() : {}
}

/**
 * 将 OrmWhereCondition 编译为数据库 SQL WHERE 子句（支持字段白名单验证）
 * @example buildWhere(mysql, { name: 'test' }, { allowedFields: ['name'] }) // "`name` = 'test'"
 */
export function buildWhere(dialect: Dialect, condition: OrmWhereCondition, options?: CompileOptions): string {
  return buildWhereInternal(dialect, condition, options)
}

/**
 * 将 OrmWhereCondition 序列化为 SSQL 字符串
 * @example toSSQL({ name: 'test', age: { $gt: 18 } }) // "name = 'test' && age > 18"
 */
export function toSSQL(condition: OrmWhereCondition): string {
  return stringifyWhere(condition)
}
