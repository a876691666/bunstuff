/**
 * SSQL 条件构建器
 * 前端版本，用于构建查询条件
 */

import { Op, Logic, type Value, type Values, type FilterCondition, type FilterGroup } from './types'

// ============ 字符串化工具 ============

function escapeValue(value: Value): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  // 字符串需要转义引号
  return `"${String(value).replace(/"/g, '\\"')}"`
}

function stringifyField(field: string, op: Op, value?: Value | Values): string {
  const f = field

  switch (op) {
    case Op.Eq:
      return `${f}=${escapeValue(value as Value)}`
    case Op.Neq:
      return `${f}!=${escapeValue(value as Value)}`
    case Op.Gt:
      return `${f}>${escapeValue(value as Value)}`
    case Op.Gte:
      return `${f}>=${escapeValue(value as Value)}`
    case Op.Lt:
      return `${f}<${escapeValue(value as Value)}`
    case Op.Lte:
      return `${f}<=${escapeValue(value as Value)}`
    case Op.Like:
      return `${f}~${escapeValue(value as Value)}`
    case Op.NotLike:
      return `${f}!~${escapeValue(value as Value)}`
    case Op.In: {
      const vals = (value as Values).map(escapeValue).join(',')
      return `${f}?=[${vals}]`
    }
    case Op.NotIn: {
      const vals = (value as Values).map(escapeValue).join(',')
      return `${f}?!=[${vals}]`
    }
    case Op.IsNull:
      return `${f}?null`
    case Op.NotNull:
      return `${f}?!null`
    case Op.Between: {
      const vals = value as Values
      return `${f}><[${escapeValue(vals[0] ?? null)},${escapeValue(vals[1] ?? null)}]`
    }
  }
}

// ============ Builder 类 ============

export class Builder {
  private readonly conditions: FilterCondition[] = []
  private logic: Logic = Logic.And

  // 设置逻辑
  and(): this {
    this.logic = Logic.And
    return this
  }

  or(): this {
    this.logic = Logic.Or
    return this
  }

  // 添加条件
  private addCondition(field: string, op: Op, value?: Value | Values): this {
    this.conditions.push({ field, op, value })
    return this
  }

  // 比较操作
  eq(field: string, value?: Value): this {
    if (value === undefined || value === null || value === '') return this
    return this.addCondition(field, Op.Eq, value)
  }

  neq(field: string, value?: Value): this {
    if (value === undefined || value === null || value === '') return this
    return this.addCondition(field, Op.Neq, value)
  }

  gt(field: string, value?: Value): this {
    if (value === undefined || value === null || value === '') return this
    return this.addCondition(field, Op.Gt, value)
  }

  gte(field: string, value?: Value): this {
    if (value === undefined || value === null || value === '') return this
    return this.addCondition(field, Op.Gte, value)
  }

  lt(field: string, value?: Value): this {
    if (value === undefined || value === null || value === '') return this
    return this.addCondition(field, Op.Lt, value)
  }

  lte(field: string, value?: Value): this {
    if (value === undefined || value === null || value === '') return this
    return this.addCondition(field, Op.Lte, value)
  }

  // 模糊匹配
  like(field: string, value?: string): this {
    if (!value) return this
    return this.addCondition(field, Op.Like, value)
  }

  notLike(field: string, value?: string): this {
    if (!value) return this
    return this.addCondition(field, Op.NotLike, value)
  }

  // 集合操作
  in(field: string, values?: Values): this {
    if (!values || values.length === 0) return this
    return this.addCondition(field, Op.In, values)
  }

  notIn(field: string, values?: Values): this {
    if (!values || values.length === 0) return this
    return this.addCondition(field, Op.NotIn, values)
  }

  // 空值检查
  isNull(field: string): this {
    return this.addCondition(field, Op.IsNull)
  }

  notNull(field: string): this {
    return this.addCondition(field, Op.NotNull)
  }

  // 范围
  between(field: string, start?: Value, end?: Value): this {
    if (start === undefined && end === undefined) return this
    return this.addCondition(field, Op.Between, [start ?? null, end ?? null])
  }

  // 条件添加（如果条件成立才添加）
  when(condition: boolean, fn: (b: Builder) => void): this {
    if (condition) fn(this)
    return this
  }

  // 从对象构建（自动跳过空值）
  fromObject(obj: Record<string, Value | undefined>, opMap?: Record<string, Op>): this {
    for (const [field, value] of Object.entries(obj)) {
      if (value === undefined || value === null || value === '') continue
      const op = opMap?.[field] ?? Op.Eq
      if (op === Op.Like) {
        this.like(field, String(value))
      } else {
        this.addCondition(field, op, value)
      }
    }
    return this
  }

  // 构建 FilterGroup
  build(): FilterGroup {
    return {
      logic: this.logic,
      conditions: [...this.conditions],
    }
  }

  // 转换为 SSQL 字符串
  toString(): string {
    if (this.conditions.length === 0) return ''
    if (this.conditions.length === 1) {
      const c = this.conditions[0]!
      return stringifyField(c.field, c.op, c.value)
    }

    const parts = this.conditions.map((c) => stringifyField(c.field, c.op, c.value))
    const connector = this.logic === Logic.Or ? ' || ' : ' && '
    return `(${parts.join(connector)})`
  }

  // 转为查询参数对象（用于 API 请求）
  toParams(): Record<string, string> {
    const ssql = this.toString()
    return ssql ? { filter: ssql } : {}
  }

  // 是否为空
  isEmpty(): boolean {
    return this.conditions.length === 0
  }

  // 获取条件数量
  get length(): number {
    return this.conditions.length
  }
}

// ============ 快捷函数 ============

export const where = () => new Builder().and()
export const whereOr = () => new Builder().or()

// 从普通对象创建查询
export function fromSearch(
  params: Record<string, Value | undefined>,
  opMap?: Record<string, Op>,
): string {
  return where().fromObject(params, opMap).toString()
}
