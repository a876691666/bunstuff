import type { Dialect, Value, Values } from "../types";

// 转义字符串中的特殊字符
function escapeString(str: string): string {
  return str.replace(/[\0\b\t\n\r\x1a"'\\]/g, (c) => {
    switch (c) {
      case "\0": return "\\0";
      case "\b": return "\\b";
      case "\t": return "\\t";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\x1a": return "\\Z";
      case '"': return '\\"';
      case "'": return "\\'";
      case "\\": return "\\\\";
      default: return c;
    }
  });
}

// MySQL 方言
export const mysql: Dialect = {
  name: "mysql",
  
  quote: (field) => `\`${field}\``,
  placeholder: () => "?",

  escape(value: Value): string {
    if (value === null) return "NULL";
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (typeof value === "number") return String(value);
    return `'${escapeString(String(value))}'`;
  },

  assemble(sql: string, params: Values): string {
    let i = 0;
    return sql.replace(/\?/g, () => this.escape(params[i++] ?? null));
  },

  // ============ 表操作 ============

  tableExistsSql(tableName: string): string {
    return `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_NAME = '${escapeString(tableName)}'`;
  },

  tableColumnsSql(tableName: string): string {
    return `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_NAME = '${escapeString(tableName)}'`;
  },

  createTableSql(tableName: string, columnDefs: string[]): string {
    return `CREATE TABLE ${this.quote(tableName)} (\n  ${columnDefs.join(",\n  ")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
  },

  dropTableSql(tableName: string): string {
    return `DROP TABLE ${this.quote(tableName)}`;
  },

  renameTableSql(oldName: string, newName: string): string {
    return `RENAME TABLE ${this.quote(oldName)} TO ${this.quote(newName)}`;
  },

  // ============ 数据操作 ============

  insertSql(tableName: string, columns: string[], values: string[]): string {
    // MySQL 不原生支持 RETURNING，但较新版本支持
    return `INSERT INTO ${this.quote(tableName)} (${columns.join(", ")}) VALUES (${values.join(", ")})`;
  },

  batchInsertSql(tableName: string, columns: string[], valueRows: string[]): string {
    return `INSERT INTO ${this.quote(tableName)} (${columns.join(", ")}) VALUES ${valueRows.join(", ")}`;
  },

  updateSql(tableName: string, setParts: string[], whereClause: string): string {
    return `UPDATE ${this.quote(tableName)} SET ${setParts.join(", ")} WHERE ${whereClause}`;
  },

  upsertSql(tableName: string, columns: string[], values: string[], _conflictCols: string, updateParts: string[]): string {
    // MySQL 使用 ON DUPLICATE KEY UPDATE
    return `INSERT INTO ${this.quote(tableName)} (${columns.join(", ")}) VALUES (${values.join(", ")}) ON DUPLICATE KEY UPDATE ${updateParts.join(", ")}`;
  },

  deleteSql(tableName: string, whereClause: string): string {
    return `DELETE FROM ${this.quote(tableName)} WHERE ${whereClause}`;
  },

  selectSql(tableName: string, columns: string, whereClause?: string, orderBy?: string, limit?: number, offset?: number): string {
    let sql = `SELECT ${columns} FROM ${this.quote(tableName)}`;
    if (whereClause) sql += ` WHERE ${whereClause}`;
    if (orderBy) sql += ` ORDER BY ${orderBy}`;
    if (limit !== undefined) sql += ` LIMIT ${limit}`;
    if (offset !== undefined) sql += ` OFFSET ${offset}`;
    return sql;
  },

  countSql(tableName: string, whereClause?: string): string {
    let sql = `SELECT COUNT(*) as count FROM ${this.quote(tableName)}`;
    if (whereClause) sql += ` WHERE ${whereClause}`;
    return sql;
  },
};

export default mysql;
