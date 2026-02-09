/**
 * SSQL 表达式类
 * 核心数据结构，持有表达式数据
 */

import {
  Op,
  Logic,
  type Value,
  type Values,
  type Dialect,
  type SQLResult,
  type CompileOptions,
  type OrmFieldCondition,
  type OrmWhereCondition,
} from './types'
import { stringifyField } from './stringify'
import { compileField } from './compile'

// ============ 内部类型 ============

type InternalSQL = [sql: string, params: Values]

// ============ 结果组装 ============

function toResult(dialect: Dialect, sql: string, params: Values): SQLResult {
  return [dialect.assemble(sql, params), sql, params]
}

// ============ 字段表达式 ============

export class FieldExpr {
  constructor(
    public readonly field: string,
    public readonly op: Op,
    public readonly value?: Value | Values,
  ) {}

  /** 转为 SSQL 字符串 */
  toString(): string {
    return stringifyField(this.field, this.op, this.value)
  }

  /** @internal 内部编译方法（支持字段白名单验证） */
  _compile(dialect: Dialect, offset = 0, options?: CompileOptions): InternalSQL {
    return compileField(dialect, this.field, this.op, this.value, offset, options)
  }

  /** 转为数据库 SQL（支持字段白名单验证） */
  toSQL(dialect: Dialect, offset = 0, options?: CompileOptions): SQLResult {
    const [sql, params] = this._compile(dialect, offset, options)
    return toResult(dialect, sql, params)
  }

  /** 转为 ORM WhereCondition */
  toWhere(): OrmWhereCondition {
    return { [this.field]: this.toFieldCondition() }
  }

  /** 转为 ORM FieldCondition */
  toFieldCondition(): OrmFieldCondition {
    switch (this.op) {
      case Op.Eq:
        return this.value as Value
      case Op.Neq:
        return { $ne: this.value as Value }
      case Op.Gt:
        return { $gt: this.value as Value }
      case Op.Gte:
        return { $gte: this.value as Value }
      case Op.Lt:
        return { $lt: this.value as Value }
      case Op.Lte:
        return { $lte: this.value as Value }
      case Op.Like:
        return { $like: this.value as string }
      case Op.NotLike:
        return { $notLike: this.value as string }
      case Op.In:
        return { $in: this.value as Values }
      case Op.NotIn:
        return { $notIn: this.value as Values }
      case Op.IsNull:
        return { $isNull: true }
      case Op.NotNull:
        return { $isNotNull: true }
      case Op.Between: {
        const vals = this.value as Values
        return { $between: [vals[0] ?? null, vals[1] ?? null] as [Value, Value] }
      }
    }
  }
}

// ============ 逻辑表达式 ============

export class LogicExpr {
  constructor(
    public readonly logic: Logic,
    public readonly exprs: (FieldExpr | LogicExpr | GroupExpr | LiteralExpr)[],
  ) {}

  /** 转为 SSQL 字符串 */
  toString(): string {
    const len = this.exprs.length
    if (len === 0) return ''
    if (len === 1) return this.exprs[0]!.toString()

    const conn = this.logic === Logic.Or ? ' || ' : ' && '
    return `(${this.exprs.map((e) => e.toString()).join(conn)})`
  }

  /** @internal 内部编译方法（支持字段白名单验证） */
  _compile(dialect: Dialect, offset = 0, options?: CompileOptions): InternalSQL {
    const len = this.exprs.length
    if (len === 0) return ['', []]
    if (len === 1) return this.exprs[0]!._compile(dialect, offset, options)

    const parts: string[] = []
    const params: Values = []

    for (const expr of this.exprs) {
      const [sql, vals] = expr._compile(dialect, offset + params.length, options)
      if (sql) {
        parts.push(sql)
        params.push(...vals)
      }
    }

    if (parts.length === 0) return ['', []]
    if (parts.length === 1) return [parts[0]!, params]

    const conn = this.logic === Logic.Or ? ' OR ' : ' AND '
    return [`(${parts.join(conn)})`, params]
  }

  /** 转为数据库 SQL（支持字段白名单验证） */
  toSQL(dialect: Dialect, offset = 0, options?: CompileOptions): SQLResult {
    const [sql, params] = this._compile(dialect, offset, options)
    return toResult(dialect, sql, params)
  }

  /** 转为 ORM WhereCondition */
  toWhere(): OrmWhereCondition {
    if (this.exprs.length === 0) return {}
    if (this.exprs.length === 1) return this.exprs[0]!.toWhere()

    // 尝试合并为扁平结构（当所有子表达式都是简单字段条件且逻辑是 AND 时）
    if (this.logic === Logic.And) {
      const canFlatten = this.exprs.every((e) => e instanceof FieldExpr)
      if (canFlatten) {
        const result: OrmWhereCondition = {}
        for (const expr of this.exprs) {
          Object.assign(result, expr.toWhere())
        }
        return result
      }
    }

    // 使用 $or 或 $and
    const conditions = this.exprs.map((e) => e.toWhere())
    return this.logic === Logic.Or ? { $or: conditions } : { $and: conditions }
  }
}

// ============ 分组表达式 ============

export class GroupExpr {
  constructor(public readonly inner: FieldExpr | LogicExpr | GroupExpr | LiteralExpr) {}

  /** 转为 SSQL 字符串 */
  toString(): string {
    const s = this.inner.toString()
    return s ? `(${s})` : ''
  }

  /** @internal 内部编译方法（支持字段白名单验证） */
  _compile(dialect: Dialect, offset = 0, options?: CompileOptions): InternalSQL {
    const [sql, params] = this.inner._compile(dialect, offset, options)
    return sql ? [`(${sql})`, params] : ['', []]
  }

  /** 转为数据库 SQL（支持字段白名单验证） */
  toSQL(dialect: Dialect, offset = 0, options?: CompileOptions): SQLResult {
    const [sql, params] = this._compile(dialect, offset, options)
    return toResult(dialect, sql, params)
  }

  /** 转为 ORM WhereCondition */
  toWhere(): OrmWhereCondition {
    return this.inner.toWhere()
  }
}

/** 表达式类型 */
export type Expression = FieldExpr | LogicExpr | GroupExpr | LiteralExpr

// ============ 字面量比较表达式 ============

/** 字面量比较表达式（如 1 = 1, 'get' = 'get'） */
export class LiteralExpr {
  constructor(
    public readonly left: Value,
    public readonly op: Op,
    public readonly right: Value,
  ) {}

  /** 转为 SSQL 字符串 */
  toString(): string {
    return `${this.formatVal(this.left)} ${this.opStr()} ${this.formatVal(this.right)}`
  }

  /** @internal 内部编译方法 */
  _compile(dialect: Dialect, _offset = 0, _options?: CompileOptions): InternalSQL {
    const opSql = this.opToSQL()
    return [`${dialect.escape(this.left)} ${opSql} ${dialect.escape(this.right)}`, []]
  }

  /** 转为数据库 SQL */
  toSQL(dialect: Dialect, offset = 0, options?: CompileOptions): SQLResult {
    const [sql, params] = this._compile(dialect, offset, options)
    return toResult(dialect, sql, params)
  }

  /** 转为 ORM WhereCondition（字面量比较不映射到 ORM 条件，返回空） */
  toWhere(): OrmWhereCondition {
    return {}
  }

  private formatVal(v: Value): string {
    if (v === null) return 'null'
    if (typeof v === 'boolean') return String(v)
    if (typeof v === 'string') return `'${v}'`
    return String(v)
  }

  private opStr(): string {
    switch (this.op) {
      case Op.Eq: return '='
      case Op.Neq: return '!='
      case Op.Gt: return '>'
      case Op.Gte: return '>='
      case Op.Lt: return '<'
      case Op.Lte: return '<='
      default: return '='
    }
  }

  private opToSQL(): string {
    switch (this.op) {
      case Op.Eq: return '='
      case Op.Neq: return '!='
      case Op.Gt: return '>'
      case Op.Gte: return '>='
      case Op.Lt: return '<'
      case Op.Lte: return '<='
      default: return '='
    }
  }
}
