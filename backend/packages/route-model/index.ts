/**
 * Route Model 工具包
 *
 * 提供标准化的 Elysia 路由模型生成函数
 */
import { t, type TSchema } from 'elysia'
import type { TObject, TProperties, TOptional } from '@sinclair/typebox'
import type { SchemaDefinition, ColumnBuilder } from '@pkg/orm'

// ============ 类型定义 ============

export interface ModelOptions {
  description?: string
}

export interface SchemaOptions extends ModelOptions {
  /** 是否包含时间戳字段，默认 true */
  timestamps?: boolean
}

export interface BodyOptions extends ModelOptions {
  /** 排除的字段 */
  exclude?: string[]
  /** 必填字段（更新时保持必填） */
  required?: string[]
}

export interface QueryOptions extends ModelOptions {
  /** 是否包含分页，默认 true */
  pagination?: boolean
  /** 是否包含 filter，默认 true */
  filter?: boolean
}

export interface IdParamsOptions extends ModelOptions {
  /** 参数名，默认 'id' */
  name?: string
  /** 参数描述 */
  label?: string
  /** 使用 Numeric 类型，默认 true */
  numeric?: boolean
}

export interface TreeOptions extends ModelOptions {
  /** 子节点字段名，默认 'children' */
  childrenField?: string
  /** 排除的字段 */
  exclude?: string[]
}

// ============ 合并工具 ============

/**
 * 合并多个对象，类型安全
 *
 * @example
 * ```ts
 * const merged = merge(baseFields, extraFields, moreFields)
 * ```
 */
export function merge<T extends TProperties, U extends TProperties>(a: T, b: U): T & U
export function merge<T extends TProperties, U extends TProperties, V extends TProperties>(
  a: T,
  b: U,
  c: V,
): T & U & V
export function merge<
  T extends TProperties,
  U extends TProperties,
  V extends TProperties,
  W extends TProperties,
>(a: T, b: U, c: V, d: W): T & U & V & W
export function merge(...objects: TProperties[]): TProperties {
  return Object.assign({}, ...objects)
}

/**
 * 从对象中排除指定键
 */
export function omit<T extends TProperties, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = {} as TProperties
  for (const key of Object.keys(obj)) {
    if (!keys.includes(key as K)) {
      result[key] = obj[key]!
    }
  }
  return result as Omit<T, K>
}

/**
 * 从对象中选取指定键
 */
export function pick<T extends TProperties, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as TProperties
  for (const key of keys) {
    if (key in obj) {
      result[key as string] = obj[key]!
    }
  }
  return result as Pick<T, K>
}

// ============ 预设字段 ============

/** 时间戳字段 */
export const timestamps = {
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
} as const

/** 分页字段 */
export const pagination = {
  page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
} as const

/** 过滤字段 */
export const filterField = {
  filter: t.Optional(t.String({ description: 'SSQL过滤条件' })),
} as const

// ============ 核心函数 ============

/**
 * 创建响应 Schema（自动添加时间戳）
 *
 * @example
 * ```ts
 * export const UserSchema = schema({
 *   id: t.Number({ description: 'ID' }),
 *   username: t.String({ description: '用户名' }),
 * })
 * ```
 */
export function schema<T extends TProperties>(
  properties: T,
  options: SchemaOptions = {},
): TObject<T & typeof timestamps> | TObject<T> {
  const { timestamps: withTimestamps = true, description } = options
  const props = withTimestamps ? merge(properties, timestamps) : properties
  return t.Object(props, description ? { description } : undefined)
}

/**
 * 创建请求体
 *
 * @example
 * ```ts
 * export const createUserBody = body({
 *   username: t.String({ description: '用户名', minLength: 2 }),
 *   roleId: t.Number({ description: '角色ID' }),
 * })
 * ```
 */
export function body<T extends TProperties>(properties: T, options: BodyOptions = {}): TObject<T> {
  const { description, exclude = [] } = options
  const props = exclude.length ? omit(properties, exclude as (keyof T)[]) : properties
  return t.Object(props as T, description ? { description } : undefined)
}

/**
 * 创建更新请求体（字段自动可选化）
 *
 * @example
 * ```ts
 * export const updateUserBody = updateBody({
 *   username: t.String({ description: '用户名' }),
 *   status: t.Number({ description: '状态' }),
 * })
 * ```
 */
type Optionalize<T extends TProperties> = {
  [K in keyof T]: TOptional<T[K]>
}

export function updateBody<T extends TProperties>(
  properties: T,
  options: BodyOptions = {},
): TObject<Optionalize<T>> {
  const { description, exclude = [], required = [] } = options
  const result = {} as TProperties
  for (const [key, value] of Object.entries(properties)) {
    if (exclude.includes(key)) continue
    result[key] = required.includes(key) ? value : t.Optional(value as TSchema)
  }
  return t.Object(result, description ? { description } : undefined) as TObject<Optionalize<T>>
}

/**
 * 创建 ID 路径参数
 *
 * @example
 * ```ts
 * export const userIdParams = idParams() // { id: Numeric }
 * export const roleIdParams = idParams({ name: 'roleId', label: '角色ID' })
 * ```
 */
export function idParams<N extends string = 'id'>(
  options: IdParamsOptions & { name?: N } = {},
): TObject<{ [K in N]: ReturnType<typeof t.Numeric> }> {
  const { name = 'id' as N, label = 'ID', numeric = true, description } = options
  const idType = numeric ? t.Numeric({ description: label }) : t.Number({ description: label })
  const props = { [name]: idType } as { [K in N]: ReturnType<typeof t.Numeric> }
  return t.Object(props, description ? { description } : undefined)
}

/**
 * 创建查询参数（分页 + 过滤）
 *
 * @example
 * ```ts
 * export const userQueryParams = query()
 * export const logQueryParams = query({
 *   extra: { username: t.Optional(t.String({ description: '用户名' })) }
 * })
 * ```
 */
export function query<T extends TProperties = {}>(
  options: QueryOptions & { extra?: T } = {},
): TObject<typeof pagination & typeof filterField & T> {
  const { pagination: withPagination = true, filter = true, extra, description } = options
  let fields: TProperties = {}
  if (withPagination) fields = merge(fields, pagination)
  if (filter) fields = merge(fields, filterField)
  if (extra) fields = merge(fields, extra)
  return t.Object(fields, description ? { description } : undefined) as TObject<
    typeof pagination & typeof filterField & T
  >
}

/**
 * 创建树形结构 Schema
 *
 * @example
 * ```ts
 * export const MenuTreeSchema = tree({
 *   id: t.Number({ description: 'ID' }),
 *   parentId: t.Nullable(t.Number({ description: '父ID' })),
 *   name: t.String({ description: '名称' }),
 * })
 * ```
 */
export function tree<T extends TProperties>(properties: T, options: TreeOptions = {}) {
  const { childrenField = 'children', description, exclude = [] } = options
  const props = exclude.length ? omit(properties, exclude as (keyof T)[]) : properties
  return t.Recursive(
    (Self) =>
      t.Object(
        merge(props as T, {
          [childrenField]: t.Optional(t.Array(Self, { description: '子节点列表' })),
        }),
      ),
    description ? { description } : undefined,
  )
}

// ============ 从 ORM Model 生成 Schema ============

export interface FromModelOptions {
  /** 包含的字段（优先级高于 exclude） */
  include?: string[]
  /** 排除的字段 */
  exclude?: string[]
  /** 是否包含时间戳字段，默认 true */
  timestamps?: boolean
}

/**
 * 从 ORM Schema 类生成 Elysia TypeBox Schema
 *
 * @example
 * ```ts
 * import UsersSchema from '@/models/users/schema'
 *
 * export const UserSchema = fromModel(UsersSchema)
 * export const UserSchemaWithoutPassword = fromModel(UsersSchema, { exclude: ['password'] })
 * ```
 */
export function fromModel<T extends { getDefinition(): SchemaDefinition }>(
  SchemaClass: T,
  options: FromModelOptions = {},
): TObject<any> {
  const { include, exclude = [], timestamps: withTimestamps = true } = options
  const definition = SchemaClass.getDefinition()
  const properties: TProperties = {}

  // 遍历所有字段
  for (const [key, column] of Object.entries(definition)) {
    // 跳过时间戳字段（如果设置不包含）
    if (!withTimestamps && (key === 'createdAt' || key === 'updatedAt')) {
      continue
    }

    // 如果指定了 include，只包含这些字段
    if (include && !include.includes(key)) {
      continue
    }

    // 排除指定字段
    if (exclude.includes(key)) {
      continue
    }

    properties[key] = columnToTypeBox(column as ColumnBuilder<any, any>)
  }

  return t.Object(properties)
}

/**
 * 将 ORM Column 转换为 TypeBox Schema
 */
function columnToTypeBox(column: ColumnBuilder<any, any>): TSchema {
  const { _type, _nullable, _config } = column
  const { description } = _config
  const options = description ? { description } : undefined

  let baseType: TSchema

  // 根据类型创建对应的 TypeBox schema
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
      baseType = t.String(options) // 日期序列化为字符串
      break
    case 'blob':
      baseType = t.Any(options) // Blob 类型使用 Any
      break
    default:
      baseType = t.Any(options)
  }

  // 如果字段可为 null，使用 Nullable 包装
  return _nullable ? t.Nullable(baseType) : baseType
}
