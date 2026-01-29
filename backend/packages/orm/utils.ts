import type { ColumnBuilder, ColumnTypeName, SqlValue } from "./types";
import type { Dialect } from "@pkg/ssql";

// ============ 纯工具函数（与数据库类型无关） ============

/** 转义字符串（单引号） */
export function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

/** 转义值为 SQL 安全字符串 */
export function escape(value: SqlValue): string {
  if (value === null) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString("hex")}'`;
  return `'${escapeString(String(value))}'`;
}

/** 生成随机临时表名 */
export function generateTempTableName(tableName: string): string {
  return `_${tableName}_temp_${Date.now()}`;
}

// ============ ORM 列类型相关 ============

/** 表列信息 */
export interface TableColumnInfo {
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: string | null;
  pk: boolean;
}

/** 将 ORM 列类型转换为 SQL 类型 */
export function columnTypeToSql(dialectName: string, type: ColumnTypeName): string {
  switch (type) {
    case "string":
      return "TEXT";
    case "number":
      return dialectName === "mysql" ? "INT" : "INTEGER";
    case "boolean":
      return dialectName === "mysql" ? "TINYINT(1)" : "INTEGER";
    case "date":
      return dialectName === "mysql" ? "DATETIME" : "TEXT";
    case "blob":
      return "BLOB";
    default:
      return "TEXT";
  }
}

/** 将 SQL 类型转换为 ORM 列类型 */
export function sqlTypeToColumnType(sqlType: string): ColumnTypeName {
  const normalized = sqlType.toUpperCase();
  if (normalized.includes("INT") || normalized.includes("TINYINT")) return "number";
  if (normalized.includes("BLOB")) return "blob";
  if (normalized.includes("TEXT") || normalized.includes("CHAR") || normalized.includes("CLOB"))
    return "string";
  if (normalized.includes("REAL") || normalized.includes("FLOA") || normalized.includes("DOUB"))
    return "number";
  if (normalized.includes("DATETIME") || normalized.includes("TIMESTAMP"))
    return "date";
  return "string";
}

/** 生成类型转换表达式 */
export function getTypeConversionExpr(
  dialect: Dialect,
  columnName: string,
  fromType: ColumnTypeName,
  toType: ColumnTypeName
): string {
  const quotedName = dialect.quote(columnName);

  if (fromType === toType) return quotedName;

  if (toType === "string" || toType === "date") {
    if (fromType === "number" || fromType === "boolean") {
      return `CAST(${quotedName} AS TEXT)`;
    }
    return quotedName;
  }

  if (toType === "number" || toType === "boolean") {
    if (fromType === "string" || fromType === "date") {
      return `CAST(${quotedName} AS INTEGER)`;
    }
    return quotedName;
  }

  if (toType === "blob") {
    return `CAST(${quotedName} AS BLOB)`;
  }

  return quotedName;
}

/** 从列构建器生成列定义 SQL */
export function columnToSql(dialect: Dialect, name: string, column: ColumnBuilder<any, any>): string {
  const config = column._config;
  const parts: string[] = [dialect.quote(name), columnTypeToSql(dialect.name, config.type)];

  if (config.primaryKey) {
    parts.push("PRIMARY KEY");
    if (config.autoIncrement) {
      if (dialect.name === "mysql") {
        parts.push("AUTO_INCREMENT");
      } else {
        parts.push("AUTOINCREMENT");
      }
    }
  }

  if (!config.nullable && !config.primaryKey) {
    parts.push("NOT NULL");
  }

  if (config.unique && !config.primaryKey) {
    parts.push("UNIQUE");
  }

  if (config.default !== undefined) {
    const defaultValue = typeof config.default === "function" ? config.default() : config.default;
    parts.push(`DEFAULT ${escape(defaultValue as SqlValue)}`);
  }

  return parts.join(" ");
}

/** 解析表列信息结果（SQLite） */
export function parseTableColumnsSqlite(result: any[]): TableColumnInfo[] {
  return result.map((row) => ({
    name: row.name,
    type: row.type,
    notnull: row.notnull === 1,
    dflt_value: row.dflt_value,
    pk: row.pk === 1,
  }));
}

/** 解析表列信息结果（MySQL） */
export function parseTableColumnsMysql(result: any[]): TableColumnInfo[] {
  return result.map((row) => ({
    name: row.Field || row.COLUMN_NAME,
    type: (row.Type || row.DATA_TYPE || "").toUpperCase(),
    notnull: (row.Null || row.IS_NULLABLE) === "NO",
    dflt_value: row.Default || row.COLUMN_DEFAULT,
    pk: (row.Key || row.COLUMN_KEY) === "PRI",
  }));
}

/** 解析表列信息结果（PostgreSQL） */
export function parseTableColumnsPostgres(result: any[]): TableColumnInfo[] {
  return result.map((row) => ({
    name: row.column_name,
    type: row.data_type.toUpperCase(),
    notnull: row.is_nullable === "NO",
    dflt_value: row.column_default,
    pk: false, // PostgreSQL 需要额外查询获取主键信息
  }));
}

/** 根据方言解析表列信息 */
export function parseTableColumns(dialectName: string, result: any[]): TableColumnInfo[] {
  switch (dialectName) {
    case "mysql":
      return parseTableColumnsMysql(result);
    case "postgres":
      return parseTableColumnsPostgres(result);
    default:
      return parseTableColumnsSqlite(result);
  }
}
