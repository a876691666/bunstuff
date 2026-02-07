// ============ 基础类型 ============

export type Value = string | number | boolean | null
export type Values = Value[]
export type SQLResult = [raw: string, sql: string, params: Values]

// ============ 编译选项 ============

/** 编译选项（用于安全验证） */
export interface CompileOptions {
  /** 允许的字段名列表（白名单）。如果提供，则只允许这些字段 */
  allowedFields?: string[]
  /** 是否在字段不在白名单时抛出错误（默认 true）。设为 false 则静默忽略非法字段 */
  throwOnInvalidField?: boolean
}

/** 字段验证错误 */
export class FieldValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly allowedFields: string[],
  ) {
    super(`Field "${field}" is not allowed. Allowed fields: ${allowedFields.join(', ')}`)
    this.name = 'FieldValidationError'
  }
}

/** 验证字段名是否在白名单中 */
export function validateField(field: string, options?: CompileOptions): boolean {
  if (!options?.allowedFields) return true

  // 支持 table.field 格式，只验证字段部分
  const fieldName = field.includes('.') ? field.split('.').pop()! : field
  const isValid = options.allowedFields.includes(fieldName) || options.allowedFields.includes(field)

  if (!isValid && options.throwOnInvalidField !== false) {
    throw new FieldValidationError(field, options.allowedFields)
  }

  return isValid
}

// ============ ORM 兼容类型 ============

/** 字段条件操作符类型 */
export type OrmEqCondition<T = Value> = { $eq: T }
export type OrmNeCondition<T = Value> = { $ne: T }
export type OrmGtCondition<T = Value> = { $gt: T }
export type OrmGteCondition<T = Value> = { $gte: T }
export type OrmLtCondition<T = Value> = { $lt: T }
export type OrmLteCondition<T = Value> = { $lte: T }
export type OrmLikeCondition = { $like: string }
export type OrmNotLikeCondition = { $notLike: string }
export type OrmInCondition<T = Value> = { $in: T[] }
export type OrmNotInCondition<T = Value> = { $notIn: T[] }
export type OrmIsNullCondition = { $isNull: true }
export type OrmIsNotNullCondition = { $isNotNull: true }
export type OrmBetweenCondition<T = Value> = { $between: [T, T] }

/** 字段条件（ORM 格式） */
export type OrmFieldCondition<T = Value> =
  | T
  | OrmEqCondition<T>
  | OrmNeCondition<T>
  | OrmGtCondition<T>
  | OrmGteCondition<T>
  | OrmLtCondition<T>
  | OrmLteCondition<T>
  | OrmLikeCondition
  | OrmNotLikeCondition
  | OrmInCondition<T>
  | OrmNotInCondition<T>
  | OrmIsNullCondition
  | OrmIsNotNullCondition
  | OrmBetweenCondition<T>

/** Where 条件（ORM 格式） */
export interface OrmWhereCondition {
  [field: string]: OrmFieldCondition | OrmWhereCondition[] | undefined
  $or?: OrmWhereCondition[]
  $and?: OrmWhereCondition[]
}

// ============ 类型守卫 ============

export function isOrmEqCondition(c: OrmFieldCondition): c is OrmEqCondition {
  return typeof c === 'object' && c !== null && '$eq' in c
}
export function isOrmNeCondition(c: OrmFieldCondition): c is OrmNeCondition {
  return typeof c === 'object' && c !== null && '$ne' in c
}
export function isOrmGtCondition(c: OrmFieldCondition): c is OrmGtCondition {
  return typeof c === 'object' && c !== null && '$gt' in c
}
export function isOrmGteCondition(c: OrmFieldCondition): c is OrmGteCondition {
  return typeof c === 'object' && c !== null && '$gte' in c
}
export function isOrmLtCondition(c: OrmFieldCondition): c is OrmLtCondition {
  return typeof c === 'object' && c !== null && '$lt' in c
}
export function isOrmLteCondition(c: OrmFieldCondition): c is OrmLteCondition {
  return typeof c === 'object' && c !== null && '$lte' in c
}
export function isOrmLikeCondition(c: OrmFieldCondition): c is OrmLikeCondition {
  return typeof c === 'object' && c !== null && '$like' in c
}
export function isOrmNotLikeCondition(c: OrmFieldCondition): c is OrmNotLikeCondition {
  return typeof c === 'object' && c !== null && '$notLike' in c
}
export function isOrmInCondition(c: OrmFieldCondition): c is OrmInCondition {
  return typeof c === 'object' && c !== null && '$in' in c
}
export function isOrmNotInCondition(c: OrmFieldCondition): c is OrmNotInCondition {
  return typeof c === 'object' && c !== null && '$notIn' in c
}
export function isOrmIsNullCondition(c: OrmFieldCondition): c is OrmIsNullCondition {
  return typeof c === 'object' && c !== null && '$isNull' in c
}
export function isOrmIsNotNullCondition(c: OrmFieldCondition): c is OrmIsNotNullCondition {
  return typeof c === 'object' && c !== null && '$isNotNull' in c
}
export function isOrmBetweenCondition(c: OrmFieldCondition): c is OrmBetweenCondition {
  return typeof c === 'object' && c !== null && '$between' in c
}

// ============ 操作符 ============

export const enum Op {
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

export const enum Logic {
  And = '&&',
  Or = '||',
}

// ============ Token ============

export const enum TokenType {
  Field,
  Op,
  Value,
  And,
  Or,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Comma,
  EOF,
}

export interface Token {
  type: TokenType
  value: string
  pos: number
}

// ============ 方言接口 ============

export interface Dialect {
  readonly name: string

  // ============ 基础 SQL 操作 ============

  /** 引用标识符 */
  quote(field: string): string

  /** 生成占位符 */
  placeholder(index: number): string

  /** 转义值 */
  escape(value: Value): string

  /** 组装 SQL（将占位符替换为实际值） */
  assemble(sql: string, params: Values): string

  // ============ 表操作 SQL ============

  /** 检查表是否存在的 SQL */
  tableExistsSql(tableName: string): string

  /** 获取表列信息的 SQL */
  tableColumnsSql(tableName: string): string

  /** 创建表 SQL */
  createTableSql(tableName: string, columnDefs: string[]): string

  /** 删除表 SQL */
  dropTableSql(tableName: string): string

  /** 重命名表 SQL */
  renameTableSql(oldName: string, newName: string): string

  // ============ 数据操作 SQL ============

  /** 插入 SQL（带 RETURNING） */
  insertSql(tableName: string, columns: string[], values: string[]): string

  /** 批量插入 SQL（带 RETURNING） */
  batchInsertSql(tableName: string, columns: string[], valueRows: string[]): string

  /** 更新 SQL（带 RETURNING） */
  updateSql(tableName: string, setParts: string[], whereClause: string): string

  /** Upsert SQL */
  upsertSql(
    tableName: string,
    columns: string[],
    values: string[],
    conflictCols: string,
    updateParts: string[],
  ): string

  /** 删除 SQL */
  deleteSql(tableName: string, whereClause: string): string

  /** 清空表 SQL（TRUNCATE） */
  truncateSql(tableName: string): string

  /** SELECT SQL */
  selectSql(
    tableName: string,
    columns: string,
    whereClause?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): string

  /** COUNT SQL */
  countSql(tableName: string, whereClause?: string): string
}
