/**
 * SSQL 前端类型定义
 * 与后端 ssql 包保持一致
 */

// ============ 基础类型 ============

export type Value = string | number | boolean | null
export type Values = Value[]

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

// ============ 操作符映射 ============

export const OpLabel: Record<Op, string> = {
  [Op.Eq]: '等于',
  [Op.Neq]: '不等于',
  [Op.Gt]: '大于',
  [Op.Gte]: '大于等于',
  [Op.Lt]: '小于',
  [Op.Lte]: '小于等于',
  [Op.Like]: '包含',
  [Op.NotLike]: '不包含',
  [Op.In]: '在...中',
  [Op.NotIn]: '不在...中',
  [Op.IsNull]: '为空',
  [Op.NotNull]: '不为空',
  [Op.Between]: '介于',
}

// ============ 字段配置类型 ============

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'select'

export interface FieldConfig {
  /** 字段名 */
  field: string
  /** 显示标签 */
  label: string
  /** 字段类型 */
  type: FieldType
  /** 默认操作符 */
  defaultOp?: Op
  /** 可用操作符 */
  ops?: Op[]
  /** 选项（select 类型使用） */
  options?: Array<{ label: string; value: Value }>
}

// ============ 过滤条件类型 ============

export interface FilterCondition {
  field: string
  op: Op
  value?: Value | Values
}

export interface FilterGroup {
  logic: Logic
  conditions: (FilterCondition | FilterGroup)[]
}
