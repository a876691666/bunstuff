// Types
export type {
  SqlValue,
  ColumnTypeMap,
  ColumnTypeName,
  ColumnConfig,
  ColumnBuilder,
  NumberColumnBuilder,
  ColumnDef,
  InferColumnType,
  SchemaDefinition,
  SchemaClass,
  // 传统类型（从 Schema 定义推断）
  InferRow,
  InsertData,
  UpdateData,
  // 新的简洁类型工具（从 Model 实例推断）
  ModelLike,
  Row,
  Insert,
  Update,
  OrderDirection,
  OrderBy,
  Pagination,
  QueryOptions,
  ListOptions,
  ListResult,
  ModelConfig,
  WhereInput,
  Builder,
  ColumnFormat,
  FormatConfig,
  InstanceKeys,
} from './types'

// Model
export { Model, type GetSchemaOptions } from './model'

// DB and Table types
export type { SyncTableOptions } from './db'
export { DB } from './db'

// Utils (database-agnostic)
export {
  escape,
  escapeString,
  generateTempTableName,
  columnToSql,
  columnTypeToSql,
  sqlTypeToColumnType,
  getTypeConversionExpr,
  parseTableColumns,
  type TableColumnInfo,
} from './utils'

// Column builders
export { column } from './column'

// Schema base classes
export { Schema, TimestampSchema, BaseSchema } from './schema'

// Re-export dialect from ssql
export {
  getDialect,
  getDialectFromConnection,
  sqlite,
  mysql,
  postgres,
  type Dialect,
  where,
  whereOr,
} from '@pkg/ssql'
