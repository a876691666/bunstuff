// Re-export from ssql
import type { Builder } from "@pkg/ssql";
export type { Builder } from "@pkg/ssql";

// ============ 基础类型 ============

/** 支持的 SQL 值类型 */
export type SqlValue = string | number | boolean | null | Date | Uint8Array;

/** 列的基础类型映射 */
export type ColumnTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  date: Date;
  blob: Uint8Array;
};

/** 列类型名称 */
export type ColumnTypeName = keyof ColumnTypeMap;

// ============ 列定义 ============

/** 列配置 */
/** 序列化/反序列化函数类型 */
export type SerializeFn<T> = (value: T) => T | Promise<T>;
export type DeserializeFn<T> = (value: T) => T | Promise<T>;

export interface ColumnConfig<T extends ColumnTypeName = ColumnTypeName> {
  type: T;
  nullable?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  default?: ColumnTypeMap[T] | null | (() => ColumnTypeMap[T] | null);
  unique?: boolean;
  /** 序列化：从数据库读取后的转换（数据库 -> 应用） */
  serialize?: SerializeFn<ColumnTypeMap[T]>;
  /** 反序列化：写入数据库前的转换（应用 -> 数据库） */
  deserialize?: DeserializeFn<ColumnTypeMap[T]>;
}

/** 列构建器接口 */
export interface ColumnBuilder<T extends ColumnTypeName, Nullable extends boolean> {
  readonly _type: T;
  readonly _nullable: Nullable;
  readonly _config: ColumnConfig<T>;

  /** 设置为可空 */
  nullable(): ColumnBuilder<T, true>;

  /** 设置为主键 */
  primaryKey(): ColumnBuilder<T, Nullable>;

  /** 设置唯一约束 */
  unique(): ColumnBuilder<T, Nullable>;

  /** 设置默认值 */
  default(
    value: Nullable extends true
      ? ColumnTypeMap[T] | null | (() => ColumnTypeMap[T] | null)
      : ColumnTypeMap[T] | (() => ColumnTypeMap[T])
  ): ColumnBuilder<T, Nullable>;

  /** 设置序列化函数（数据库 -> 应用） */
  serialize(fn: SerializeFn<ColumnTypeMap[T]>): ColumnBuilder<T, Nullable>;

  /** 设置反序列化函数（应用 -> 数据库） */
  deserialize(fn: DeserializeFn<ColumnTypeMap[T]>): ColumnBuilder<T, Nullable>;
}

/** 数字列构建器接口（支持自增） */
export interface NumberColumnBuilder<Nullable extends boolean>
  extends ColumnBuilder<"number", Nullable> {
  /** 设置为可空 */
  nullable(): NumberColumnBuilder<true>;

  /** 设置为主键 */
  primaryKey(): NumberColumnBuilder<Nullable>;

  /** 设置唯一约束 */
  unique(): NumberColumnBuilder<Nullable>;

  /** 设置默认值 */
  default(
    value: Nullable extends true
      ? number | null | (() => number | null)
      : number | (() => number)
  ): NumberColumnBuilder<Nullable>;

  /** 设置序列化函数（数据库 -> 应用） */
  serialize(fn: SerializeFn<number>): NumberColumnBuilder<Nullable>;

  /** 设置反序列化函数（应用 -> 数据库） */
  deserialize(fn: DeserializeFn<number>): NumberColumnBuilder<Nullable>;

  /** 设置为自增 */
  autoIncrement(): NumberColumnBuilder<Nullable>;
}

/** 列定义类型（用于 Schema） */
export type ColumnDef<T extends ColumnTypeName, Nullable extends boolean = false> =
  T extends "number"
    ? NumberColumnBuilder<Nullable>
    : ColumnBuilder<T, Nullable>;

/** 从列配置推断 TypeScript 类型 */
export type InferColumnType<C extends ColumnBuilder<any, any>> = C extends ColumnBuilder<
  infer T,
  infer N
>
  ? N extends true
    ? ColumnTypeMap[T] | null
    : ColumnTypeMap[T]
  : never;

// ============ Schema 定义 ============

/** Schema 定义 */
export type SchemaDefinition = Record<string, ColumnBuilder<any, any>>;

/** 从 Schema 推断行类型 */
export type InferRow<S extends SchemaDefinition> = {
  [K in keyof S]: InferColumnType<S[K]>;
};

/** 可选字段（用于插入时自动生成的字段） */
export type OptionalFields<S extends SchemaDefinition> = {
  [K in keyof S]: S[K]["_config"]["primaryKey"] extends true
    ? S[K]["_config"]["autoIncrement"] extends true
      ? K
      : never
    : S[K]["_config"]["default"] extends undefined
      ? never
      : K;
}[keyof S];

/** 插入数据类型 */
export type InsertData<S extends SchemaDefinition> = Omit<InferRow<S>, OptionalFields<S>> &
  Partial<Pick<InferRow<S>, OptionalFields<S>>>;

/** 更新数据类型 */
export type UpdateData<S extends SchemaDefinition> = Partial<InferRow<S>>;

// ============ 排序和分页 ============

/** 排序方向 */
export type OrderDirection = "ASC" | "DESC" | "asc" | "desc";

/** 单个排序项 */
export type OrderByItem<S extends SchemaDefinition> = {
  column: keyof S;
  order?: OrderDirection;
};

/** 排序配置（列表形式） */
export type OrderBy<S extends SchemaDefinition> = OrderByItem<S>[];

/** 分页配置 */
export interface Pagination {
  page?: number;
  perPage?: number;
  offset?: number;
  limit?: number;
}

// ============ 查询选项 ============

/** Where 条件类型（支持 Builder 或 SSQL 字符串） */
export type WhereInput = Builder | string;

/** 查询选项 */
export interface QueryOptions<S extends SchemaDefinition> {
  where?: WhereInput;
  orderBy?: OrderBy<S>;
  limit?: number;
  offset?: number;
  select?: (keyof S)[];
}

/** 列表查询选项 */
export interface ListOptions<S extends SchemaDefinition> extends QueryOptions<S> {
  page?: number;
  perPage?: number;
}

/** 列表结果 */
export interface ListResult<R> {
  items: R[];
  totalItems: number;
  totalPages: number;
  page: number;
  perPage: number;
}

// ============ 序列化/反序列化 ============

/** 列的格式化配置 */
export interface ColumnFormat<T = any> {
  /** 序列化：从数据库读取后的转换（数据库 -> 应用） */
  serialize?: (value: T) => T | Promise<T>;
  /** 反序列化：写入数据库前的转换（应用 -> 数据库） */
  deserialize?: (value: T) => T | Promise<T>;
}

/** Schema 的格式化配置 */
export type FormatConfig<S extends SchemaDefinition> = {
  [K in keyof S]?: ColumnFormat<InferColumnType<S[K]>>;
};

// ============ Model 配置 ============

/** Schema 类构造器类型 */
export type SchemaClass<S extends SchemaDefinition = SchemaDefinition> = {
  new (): any;
  getDefinition(): S;
};

/** Model 配置 */
export interface ModelConfig<S extends SchemaDefinition> {
  tableName: string;
  schema: SchemaClass<S>;
  primaryKey?: keyof S;
}
