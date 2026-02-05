import type {
  ColumnTypeName,
  ColumnConfig,
  ColumnTypeMap,
  ColumnBuilder,
  NumberColumnBuilder,
  SerializeFn,
  DeserializeFn,
} from './types'

/** 基础列构建器实现 */
class BaseColumnBuilder<
  T extends ColumnTypeName,
  Nullable extends boolean,
> implements ColumnBuilder<T, Nullable> {
  readonly _type: T
  readonly _nullable: Nullable
  readonly _config: ColumnConfig<T>

  constructor(type: T, nullable: Nullable, config: ColumnConfig<T>) {
    this._type = type
    this._nullable = nullable
    this._config = config
  }

  nullable(): ColumnBuilder<T, true> {
    return new BaseColumnBuilder(this._type, true, {
      ...this._config,
      nullable: true,
    })
  }

  primaryKey(): ColumnBuilder<T, Nullable> {
    return new BaseColumnBuilder(this._type, this._nullable, {
      ...this._config,
      primaryKey: true,
    })
  }

  unique(): ColumnBuilder<T, Nullable> {
    return new BaseColumnBuilder(this._type, this._nullable, {
      ...this._config,
      unique: true,
    })
  }

  default(
    value: Nullable extends true
      ? ColumnTypeMap[T] | null | (() => ColumnTypeMap[T] | null)
      : ColumnTypeMap[T] | (() => ColumnTypeMap[T]),
  ): ColumnBuilder<T, Nullable> {
    return new BaseColumnBuilder(this._type, this._nullable, {
      ...this._config,
      default: value as any,
    })
  }

  description(text: string): ColumnBuilder<T, Nullable> {
    return new BaseColumnBuilder(this._type, this._nullable, {
      ...this._config,
      description: text,
    })
  }

  serialize(fn: SerializeFn<ColumnTypeMap[T]>): ColumnBuilder<T, Nullable> {
    return new BaseColumnBuilder(this._type, this._nullable, {
      ...this._config,
      serialize: fn,
    })
  }

  deserialize(fn: DeserializeFn<ColumnTypeMap[T]>): ColumnBuilder<T, Nullable> {
    return new BaseColumnBuilder(this._type, this._nullable, {
      ...this._config,
      deserialize: fn,
    })
  }
}

/** 数字列构建器实现（支持自增） */
class NumberColumnBuilderImpl<Nullable extends boolean>
  extends BaseColumnBuilder<'number', Nullable>
  implements NumberColumnBuilder<Nullable>
{
  constructor(nullable: Nullable, config: ColumnConfig<'number'>) {
    super('number', nullable, config)
  }

  override nullable(): NumberColumnBuilder<true> {
    return new NumberColumnBuilderImpl(true, {
      ...this._config,
      nullable: true,
    })
  }

  override primaryKey(): NumberColumnBuilder<Nullable> {
    return new NumberColumnBuilderImpl(this._nullable, {
      ...this._config,
      primaryKey: true,
    })
  }

  override unique(): NumberColumnBuilder<Nullable> {
    return new NumberColumnBuilderImpl(this._nullable, {
      ...this._config,
      unique: true,
    })
  }

  override default(
    value: Nullable extends true ? number | null | (() => number | null) : number | (() => number),
  ): NumberColumnBuilder<Nullable> {
    return new NumberColumnBuilderImpl(this._nullable, {
      ...this._config,
      default: value as any,
    })
  }

  override description(text: string): NumberColumnBuilder<Nullable> {
    return new NumberColumnBuilderImpl(this._nullable, {
      ...this._config,
      description: text,
    })
  }

  override serialize(fn: SerializeFn<number>): NumberColumnBuilder<Nullable> {
    return new NumberColumnBuilderImpl(this._nullable, {
      ...this._config,
      serialize: fn,
    })
  }

  override deserialize(fn: DeserializeFn<number>): NumberColumnBuilder<Nullable> {
    return new NumberColumnBuilderImpl(this._nullable, {
      ...this._config,
      deserialize: fn,
    })
  }

  autoIncrement(): NumberColumnBuilder<Nullable> {
    return new NumberColumnBuilderImpl(this._nullable, {
      ...this._config,
      autoIncrement: true,
    })
  }
}

/** 列定义 API - 链式调用 */
export const column = {
  /** 字符串列 */
  string(): ColumnBuilder<'string', false> {
    return new BaseColumnBuilder('string', false, { type: 'string' })
  },

  /** 数字列 */
  number(): NumberColumnBuilder<false> {
    return new NumberColumnBuilderImpl(false, { type: 'number' })
  },

  /** 整数列（number 的别名） */
  integer(): NumberColumnBuilder<false> {
    return new NumberColumnBuilderImpl(false, { type: 'number' })
  },

  /** 布尔列 */
  boolean(): ColumnBuilder<'boolean', false> {
    return new BaseColumnBuilder('boolean', false, { type: 'boolean' })
  },

  /** 日期列 */
  date(): ColumnBuilder<'date', false> {
    return new BaseColumnBuilder('date', false, { type: 'date' })
  },

  /** 二进制列 */
  blob(): ColumnBuilder<'blob', false> {
    return new BaseColumnBuilder('blob', false, { type: 'blob' })
  },
}

// 导出类以便测试
export { BaseColumnBuilder, NumberColumnBuilderImpl }
