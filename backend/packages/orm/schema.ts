import { column } from './column'
import type { ColumnBuilder, NumberColumnBuilder, SchemaDefinition } from './types'

/**
 * 基础 Schema 类
 * 所有 Schema 都应该继承这个类
 */
export abstract class Schema {
  /** 获取 schema 定义 */
  static getDefinition(): SchemaDefinition {
    const definition: SchemaDefinition = {}
    const instance = new (this as any)()

    for (const key of Object.keys(instance)) {
      const value = instance[key]
      if (value && typeof value === 'object' && '_type' in value && '_config' in value) {
        definition[key] = value
      }
    }

    return definition
  }

  /** 便捷方法：创建自增主键 ID */
  protected static id(): NumberColumnBuilder<false> {
    return column.number().primaryKey().autoIncrement()
  }

  /** 便捷方法：创建字符串列 */
  protected static string(defaultValue?: string): ColumnBuilder<'string', false> {
    const col = column.string()
    return defaultValue !== undefined ? col.default(defaultValue) : col
  }

  /** 便捷方法：创建数字列 */
  protected static number(defaultValue?: number): NumberColumnBuilder<false> {
    const col = column.number()
    return defaultValue !== undefined ? col.default(defaultValue) : col
  }

  /** 便捷方法：创建布尔列 */
  protected static boolean(defaultValue?: boolean): ColumnBuilder<'boolean', false> {
    const col = column.boolean()
    return defaultValue !== undefined ? col.default(defaultValue) : col
  }

  /** 便捷方法：创建日期列（默认当前时间） */
  protected static date(defaultValue?: Date | (() => Date)): ColumnBuilder<'date', false> {
    const col = column.date()
    return defaultValue !== undefined ? col.default(defaultValue) : col.default(() => new Date())
  }

  /** 便捷方法：创建创建时间列 */
  protected static createdAt(): ColumnBuilder<'date', false> {
    return column.date().default(() => new Date())
  }

  /** 便捷方法：创建更新时间列 */
  protected static updatedAt(): ColumnBuilder<'date', false> {
    return column.date().default(() => new Date())
  }

  /** 便捷方法：创建状态列 (0-禁用 1-启用) */
  protected static status(defaultValue: number = 1): NumberColumnBuilder<false> {
    return column.number().default(defaultValue)
  }

  /** 便捷方法：创建排序列 */
  protected static sort(defaultValue: number = 0): NumberColumnBuilder<false> {
    return column.number().default(defaultValue)
  }

  /** 便捷方法：创建备注列 */
  protected static remark(): ColumnBuilder<'string', true> {
    return column.string().nullable().default(null)
  }
}

/**
 * 带时间戳的 Schema 基类
 * 自动包含 createdAt 和 updatedAt 字段
 */
export abstract class TimestampSchema extends Schema {
  /** 创建时间 */
  createdAt = Schema.createdAt()
  /** 更新时间 */
  updatedAt = Schema.updatedAt()
}

/**
 * 带时间戳和备注的 Schema 基类
 * 自动包含 createdAt、updatedAt 和 remark 字段
 */
export abstract class BaseSchema extends TimestampSchema {
  /** 备注 */
  remark = Schema.remark()
}
