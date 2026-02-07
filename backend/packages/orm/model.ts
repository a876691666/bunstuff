import { sql, type SQL } from 'bun'
import { t, type TSchema } from 'elysia'
import type { TObject, TProperties, TOptional } from '@sinclair/typebox'
import type {
  SchemaDefinition,
  InferRow,
  InsertData,
  UpdateData,
  QueryOptions,
  ListOptions,
  ListResult,
  SqlValue,
  WhereInput,
  FormatConfig,
  ColumnBuilder,
} from './types'
import { escape } from './utils'
import { Builder, parse, type Dialect, type CompileOptions } from '@pkg/ssql'

/** Model 内部配置（schema 已解析） */
interface ModelInternalConfig<S extends SchemaDefinition> {
  tableName: string
  schema: S
  primaryKey?: keyof S
}

/** 从 schema 定义中提取 format 配置 */
function extractFormatFromSchema<S extends SchemaDefinition>(schema: S): FormatConfig<S> {
  const format: FormatConfig<S> = {}
  for (const [key, column] of Object.entries(schema)) {
    const config = column._config
    if (config.serialize || config.deserialize) {
      ;(format as any)[key] = {
        serialize: config.serialize,
        deserialize: config.deserialize,
      }
    }
  }
  return format
}

/** 解析 where 条件为 SQL 字符串（支持字段白名单验证） */
function resolveWhereSQL(
  dialect: Dialect,
  where: WhereInput | undefined,
  options?: CompileOptions,
): string {
  if (!where) return ''
  if (where instanceof Builder) {
    return where.toWhereSQL(dialect, options)
  }
  // 字符串：解析 SSQL 然后编译
  const expr = parse(where)
  if (!expr) return ''
  const [raw] = expr.toSQL(dialect, 0, options)
  return raw
}

// ============ getSchema 类型定义 ============

/** 时间戳字段 */
const timestampProps = {
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
} as const

/** ORM Column 转 TypeBox Schema */
function columnToTypeBox(column: ColumnBuilder<any, any>): TSchema {
  const { _type, _nullable, _config } = column
  const { description } = _config
  const options = description ? { description } : undefined

  let baseType: TSchema
  switch (_type) {
    case 'string':
      baseType = t.String(options)
      break
    case 'number':
      baseType = t.Number(options)
      break
    case 'boolean':
      baseType = t.Boolean(options)
      break
    case 'date':
      baseType = t.String(options)
      break
    case 'blob':
      baseType = t.Any(options)
      break
    default:
      baseType = t.Any(options)
  }

  return _nullable ? t.Nullable(baseType) : baseType
}

/** getSchema 选项 - 基础版本 */
export interface GetSchemaOptionsBase {
  /** 所有字段可选 */
  partial?: boolean
  /** 是否包含时间戳，默认 true */
  timestamps?: boolean
  /** Schema 描述 */
  description?: string
}

/** getSchema 选项 - 完整版本 */
export interface GetSchemaOptions<K extends string> extends GetSchemaOptionsBase {
  /** 包含的字段 */
  include?: K[]
  /** 排除的字段 */
  exclude?: K[]
  /** 必填字段（在 partial 模式下保持必填） */
  required?: K[]
}

// ============ 精确类型推导 ============

import type { TAny } from '@sinclair/typebox'

/** getSchema 返回类型 - 带有具体键名的 TObject */
type ModelSchema<Keys extends string> = TObject<{ [K in Keys]: TAny }>

/** Model 类 - S 是 SchemaDefinition，K 是具体键名类型 */
export class Model<S extends SchemaDefinition, K extends string = string> {
  readonly tableName: string
  readonly schema: S
  readonly primaryKey: keyof S
  readonly format: FormatConfig<S>
  /** 编译选项（包含字段白名单，用于防止 SQL 注入） */
  private readonly compileOptions: CompileOptions

  constructor(
    private db: SQL,
    private dialect: Dialect,
    config: ModelInternalConfig<S>,
  ) {
    this.tableName = config.tableName
    this.schema = config.schema
    this.primaryKey = config.primaryKey ?? this.detectPrimaryKey()
    // 从 schema 中提取 format 配置
    this.format = extractFormatFromSchema(config.schema)
    // 设置编译选项，字段白名单为 schema 的所有字段名
    this.compileOptions = {
      allowedFields: Object.keys(config.schema),
      throwOnInvalidField: true,
    }
  }

  // ============ Schema 生成 ============

  /**
   * 从 Model 生成 TypeBox Schema
   *
   * @example
   * ```ts
   * const UserSchema = User.getSchema()
   * const UserPartial = User.getSchema({ exclude: ['password'], partial: true })
   * const UserCreate = User.getSchema(
   *   { exclude: ['id'], required: ['username', 'password'] },
   *   { confirmPassword: t.String({ description: '确认密码' }) }
   * )
   * ```
   */
  getSchema(): ModelSchema<K>
  getSchema<E extends TProperties>(extra: E): ModelSchema<K | (keyof E & string)>
  getSchema<Exc extends K>(
    options: { exclude?: Exc[]; include?: K[]; required?: K[] } & GetSchemaOptionsBase,
  ): ModelSchema<Exclude<K, Exc>>
  getSchema<Exc extends K, E extends TProperties>(
    options: { exclude?: Exc[]; include?: K[]; required?: K[] } & GetSchemaOptionsBase,
    extra: E,
  ): ModelSchema<Exclude<K, Exc> | (keyof E & string)>
  getSchema<Key extends K, E extends TProperties>(
    optionsOrExtra?: GetSchemaOptions<Key> | E,
    extra?: E,
  ): TObject<any> {
    // 解析参数
    let options: GetSchemaOptions<Key> = {}
    let extraFields: TProperties = {}

    if (optionsOrExtra) {
      // 判断是 options 还是 extra
      if (
        'include' in optionsOrExtra ||
        'exclude' in optionsOrExtra ||
        'partial' in optionsOrExtra ||
        'required' in optionsOrExtra ||
        'timestamps' in optionsOrExtra
      ) {
        options = optionsOrExtra as GetSchemaOptions<Key>
        if (extra) extraFields = extra
      } else {
        // 第一个参数就是 extra
        extraFields = optionsOrExtra as TProperties
      }
    }

    const {
      include,
      exclude = [],
      partial = false,
      required = [],
      timestamps = true,
      description,
    } = options

    const properties: TProperties = {}

    // 遍历所有字段
    for (const [key, column] of Object.entries(this.schema)) {
      // 跳过时间戳字段（如果设置不包含）
      if (!timestamps && (key === 'createdAt' || key === 'updatedAt')) {
        continue
      }

      // 如果指定了 include，只包含这些字段
      if (include && !include.includes(key as Key)) {
        continue
      }

      // 排除指定字段
      if (exclude.includes(key as Key)) {
        continue
      }

      let prop = columnToTypeBox(column as ColumnBuilder<any, any>)

      // partial 模式下，非 required 字段变为可选
      if (partial && !required.includes(key as Key)) {
        prop = t.Optional(prop)
      }

      properties[key] = prop
    }

    // 添加时间戳（如果需要且不在原始 schema 中）
    if (timestamps && !('createdAt' in properties) && !exclude.includes('createdAt' as Key)) {
      properties.createdAt = timestampProps.createdAt
    }
    if (timestamps && !('updatedAt' in properties) && !exclude.includes('updatedAt' as Key)) {
      properties.updatedAt = timestampProps.updatedAt
    }

    // 合并额外字段
    Object.assign(properties, extraFields)

    return t.Object(properties, description ? { description } : undefined)
  }

  /** 检测主键 */
  private detectPrimaryKey(): keyof S {
    for (const [key, col] of Object.entries(this.schema)) {
      if (col._config.primaryKey) {
        return key as keyof S
      }
    }
    // 默认使用 id
    if ('id' in this.schema) {
      return 'id' as keyof S
    }
    throw new Error(`No primary key found for table ${this.tableName}`)
  }

  /** 序列化数据（数据库 -> 应用） */
  private async serialize<T extends InferRow<S>>(row: T): Promise<T>
  private async serialize<T extends InferRow<S>>(row: T | null): Promise<T | null>
  private async serialize<T extends InferRow<S>>(row: T | null): Promise<T | null> {
    if (!row) return null
    const result = { ...row }
    for (const [key, config] of Object.entries(this.format)) {
      if (config?.serialize && key in result) {
        ;(result as any)[key] = await config.serialize((result as any)[key])
      }
    }
    return result
  }

  /** 序列化数组 */
  private async serializeMany<T extends InferRow<S>>(rows: T[]): Promise<T[]> {
    return Promise.all(rows.map((row) => this.serialize(row)))
  }

  /** 反序列化数据（应用 -> 数据库） */
  private async deserialize<T extends Record<string, any>>(data: T): Promise<T> {
    const result = { ...data }
    for (const [key, config] of Object.entries(this.format)) {
      if (config?.deserialize && key in result) {
        ;(result as any)[key] = await config.deserialize((result as any)[key])
      }
    }
    return result
  }

  /** 获取所有列名 */
  private get columnNames(): string[] {
    return Object.keys(this.schema)
  }

  /** 引用标识符 */
  private quote(identifier: string): string {
    return this.dialect.quote(identifier)
  }

  /** 执行原始 SQL (已转义，无需参数) */
  async raw<T = any>(sql: string): Promise<T[]> {
    return (await this.db.unsafe(sql)) as T[]
  }

  /** 执行原始 SQL 返回单行 */
  async rawOne<T = any>(sql: string): Promise<T | null> {
    const rows = (await this.db.unsafe(sql)) as T[]
    return rows[0] ?? null
  }

  // ============ 查询方法 ============

  /** 根据主键获取单条记录 */
  async getOne(id: InferRow<S>[keyof S]): Promise<InferRow<S> | null> {
    const sql = `SELECT * FROM ${this.quote(this.tableName)} WHERE ${this.quote(String(this.primaryKey))} = ${escape(id as SqlValue)} LIMIT 1`
    const row = await this.rawOne<InferRow<S>>(sql)
    return this.serialize(row)
  }

  /** 根据条件获取单条记录 */
  async findOne(options: QueryOptions<S> = {}): Promise<InferRow<S> | null> {
    const results = await this.findMany({ ...options, limit: 1 })
    return results[0] ?? null
  }

  /** 根据条件获取多条记录 */
  async findMany(options: QueryOptions<S> = {}): Promise<InferRow<S>[]> {
    const selectCols = options.select
      ? options.select.map((c) => this.quote(String(c))).join(', ')
      : '*'

    let sql = `SELECT ${selectCols} FROM ${this.quote(this.tableName)}`

    // WHERE（使用字段白名单验证防止 SQL 注入）
    const whereSQL = resolveWhereSQL(this.dialect, options.where, this.compileOptions)
    if (whereSQL) {
      sql += ` WHERE ${whereSQL}`
    }

    // ORDER BY
    if (options.orderBy && options.orderBy.length > 0) {
      const orderParts = options.orderBy.map(
        (item) => `${this.quote(String(item.column))} ${item.order ?? 'ASC'}`,
      )
      sql += ` ORDER BY ${orderParts.join(', ')}`
    }

    // LIMIT & OFFSET
    if (options.limit !== undefined) {
      sql += ` LIMIT ${escape(options.limit)}`
    }
    if (options.offset !== undefined) {
      sql += ` OFFSET ${escape(options.offset)}`
    }

    const rows = await this.raw<InferRow<S>>(sql)
    return this.serializeMany(rows)
  }

  /** 获取完整列表（分页） */
  async getFullList(options: ListOptions<S> = {}): Promise<InferRow<S>[]> {
    return this.findMany(options)
  }

  /** 获取列表（带分页信息） */
  async getList(options: ListOptions<S> = {}): Promise<ListResult<InferRow<S>>> {
    const page = options.page ?? 1
    const perPage = options.perPage ?? 20
    const offset = (page - 1) * perPage

    // 获取总数
    const totalItems = await this.count(options.where)

    // 获取数据
    const items = await this.findMany({
      ...options,
      limit: perPage,
      offset,
    })

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      page,
      perPage,
    }
  }

  /** 获取第一条记录 */
  async getFirstListItem(options: QueryOptions<S> = {}): Promise<InferRow<S> | null> {
    return this.findOne(options)
  }

  // ============ 聚合方法 ============

  /** 计数 */
  async count(where?: WhereInput): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.quote(this.tableName)}`

    const whereSQL = resolveWhereSQL(this.dialect, where, this.compileOptions)
    if (whereSQL) {
      sql += ` WHERE ${whereSQL}`
    }

    const result = await this.rawOne<{ count: number }>(sql)
    return result?.count ?? 0
  }

  /** 检查是否存在 */
  async exists(where: WhereInput): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }

  // ============ 写入方法 ============

  /** 创建记录 */
  async create(data: InsertData<S>): Promise<InferRow<S>> {
    const columns: string[] = []
    const values: string[] = []

    // 反序列化数据
    const deserializedData = await this.deserialize(data)

    // 自动添加时间戳
    const now = new Date()
    if ('createdAt' in this.schema && !('createdAt' in deserializedData)) {
      ;(deserializedData as any).createdAt = now
    }
    if ('updatedAt' in this.schema && !('updatedAt' in deserializedData)) {
      ;(deserializedData as any).updatedAt = now
    }

    for (const [key, value] of Object.entries(deserializedData)) {
      if (key in this.schema) {
        columns.push(this.quote(key))
        values.push(escape(value as SqlValue))
      }
    }

    const sql = this.dialect.insertSql(this.tableName, columns, values)
    const result = await this.rawOne<InferRow<S>>(sql)

    if (!result) {
      throw new Error('Failed to create record')
    }

    return this.serialize(result)
  }

  /** 批量创建 */
  async createMany(dataList: InsertData<S>[]): Promise<InferRow<S>[]> {
    if (dataList.length === 0) return []

    const first = dataList[0]
    if (!first) return []

    // 反序列化所有数据并添加时间戳
    const now = new Date()
    const deserializedList = await Promise.all(
      dataList.map(async (data) => {
        const deserialized = await this.deserialize(data)
        // 自动添加时间戳
        if ('createdAt' in this.schema && !('createdAt' in deserialized)) {
          ;(deserialized as any).createdAt = now
        }
        if ('updatedAt' in this.schema && !('updatedAt' in deserialized)) {
          ;(deserialized as any).updatedAt = now
        }
        return deserialized
      }),
    )

    // 使用第一个反序列化后的数据来获取列名（包含时间戳列）
    const columns = Object.keys(deserializedList[0]!).filter((k) => k in this.schema)
    const quotedColumns = columns.map((c) => this.quote(c))

    const valueRows = deserializedList.map((data) => {
      const rowValues = columns.map((col) => {
        const val = (data as Record<string, SqlValue>)[col]
        return escape(val ?? null)
      })
      return `(${rowValues.join(', ')})`
    })

    const sql = this.dialect.batchInsertSql(this.tableName, quotedColumns, valueRows)
    const rows = await this.raw<InferRow<S>>(sql)
    return this.serializeMany(rows)
  }

  /** 更新记录 */
  async update(id: InferRow<S>[keyof S], data: UpdateData<S>): Promise<InferRow<S> | null> {
    const setParts: string[] = []

    // 反序列化数据
    const deserializedData = await this.deserialize(data)

    // 自动更新 updatedAt 时间戳
    if ('updatedAt' in this.schema && !('updatedAt' in deserializedData)) {
      ;(deserializedData as any).updatedAt = new Date()
    }

    for (const [key, value] of Object.entries(deserializedData)) {
      if (key in this.schema && key !== this.primaryKey) {
        setParts.push(`${this.quote(key)} = ${escape(value as SqlValue)}`)
      }
    }

    if (setParts.length === 0) {
      return this.getOne(id)
    }

    const whereClause = `${this.quote(String(this.primaryKey))} = ${escape(id as SqlValue)}`
    const sql = this.dialect.updateSql(this.tableName, setParts, whereClause)

    const result = await this.rawOne<InferRow<S>>(sql)
    return this.serialize(result)
  }

  /** 根据条件更新 */
  async updateMany(where: WhereInput, data: UpdateData<S>): Promise<number> {
    const setParts: string[] = []

    // 反序列化数据
    const deserializedData = await this.deserialize(data)

    // 自动更新 updatedAt 时间戳
    if ('updatedAt' in this.schema && !('updatedAt' in deserializedData)) {
      ;(deserializedData as any).updatedAt = new Date()
    }

    for (const [key, value] of Object.entries(deserializedData)) {
      if (key in this.schema) {
        setParts.push(`${this.quote(key)} = ${escape(value as SqlValue)}`)
      }
    }

    if (setParts.length === 0) return 0

    const whereClause = resolveWhereSQL(this.dialect, where, this.compileOptions)
    if (!whereClause) return 0
    const sql = `UPDATE ${this.quote(this.tableName)} SET ${setParts.join(', ')} WHERE ${whereClause}`

    await this.raw(sql)
    return this.count(where)
  }

  /** Upsert（存在则更新，不存在则创建） */
  async upsert(data: InsertData<S>, conflictKeys?: (keyof S)[]): Promise<InferRow<S>> {
    const columns: string[] = []
    const values: string[] = []
    const updateParts: string[] = []

    // 反序列化数据
    const deserializedData = await this.deserialize(data)

    // 自动添加时间戳
    const now = new Date()
    if ('createdAt' in this.schema && !('createdAt' in deserializedData)) {
      ;(deserializedData as any).createdAt = now
    }
    if ('updatedAt' in this.schema && !('updatedAt' in deserializedData)) {
      ;(deserializedData as any).updatedAt = now
    }

    for (const [key, value] of Object.entries(deserializedData)) {
      if (key in this.schema) {
        columns.push(this.quote(key))
        values.push(escape(value as SqlValue))
        if (key !== this.primaryKey) {
          updateParts.push(`${this.quote(key)} = excluded.${this.quote(key)}`)
        }
      }
    }

    const conflictCols = conflictKeys
      ? conflictKeys.map((k) => this.quote(String(k))).join(', ')
      : this.quote(String(this.primaryKey))

    const sql = this.dialect.upsertSql(this.tableName, columns, values, conflictCols, updateParts)
    const result = await this.rawOne<InferRow<S>>(sql)

    if (!result) {
      throw new Error('Failed to upsert record')
    }

    return this.serialize(result)
  }

  // ============ 删除方法 ============

  /** 删除记录 */
  async delete(id: InferRow<S>[keyof S]): Promise<boolean> {
    const whereClause = `${this.quote(String(this.primaryKey))} = ${escape(id as SqlValue)}`
    const sql = this.dialect.deleteSql(this.tableName, whereClause)
    await this.raw(sql)
    return true
  }

  /** 根据条件删除 */
  async deleteMany(where: WhereInput): Promise<number> {
    const whereClause = resolveWhereSQL(this.dialect, where, this.compileOptions)
    if (!whereClause) return 0

    // 先获取数量
    const count = await this.count(where)

    const sql = this.dialect.deleteSql(this.tableName, whereClause)
    await this.raw(sql)

    return count
  }

  /** 清空表（TRUNCATE），用于清空日志等场景，比 deleteMany 更高效 */
  async truncate(): Promise<void> {
    const sql = this.dialect.truncateSql(this.tableName)
    await this.raw(sql)
  }
}
