import type { Dialect, Value, Values } from '../types'

// 转义字符串中的特殊字符（增强版，防止 SQL 注入）
function escapeString(str: string): string {
  // SQLite 使用双单引号转义，同时移除危险字符
  return str
    .replace(/\x00/g, '') // 移除 NULL 字节
    .replace(/'/g, "''") // 转义单引号
}

// SQLite 方言
export const sqlite: Dialect = {
  name: 'sqlite',

  quote: (field) => `"${field}"`,
  placeholder: () => '?',

  escape(value: Value): string {
    if (value === null) return 'NULL'
    if (typeof value === 'boolean') return value ? '1' : '0'
    if (typeof value === 'number') return String(value)
    return `'${escapeString(String(value))}'`
  },

  assemble(sql: string, params: Values): string {
    let i = 0
    return sql.replace(/\?/g, () => this.escape(params[i++] ?? null))
  },

  // ============ 表操作 ============

  tableExistsSql(tableName: string): string {
    return `SELECT name FROM sqlite_master WHERE type='table' AND name='${escapeString(tableName)}'`
  },

  tableColumnsSql(tableName: string): string {
    return `PRAGMA table_info(${this.quote(tableName)})`
  },

  createTableSql(tableName: string, columnDefs: string[]): string {
    return `CREATE TABLE ${this.quote(tableName)} (\n  ${columnDefs.join(',\n  ')}\n)`
  },

  dropTableSql(tableName: string): string {
    return `DROP TABLE ${this.quote(tableName)}`
  },

  renameTableSql(oldName: string, newName: string): string {
    return `ALTER TABLE ${this.quote(oldName)} RENAME TO ${this.quote(newName)}`
  },

  // ============ 数据操作 ============

  insertSql(tableName: string, columns: string[], values: string[]): string {
    return `INSERT INTO ${this.quote(tableName)} (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING *`
  },

  batchInsertSql(tableName: string, columns: string[], valueRows: string[]): string {
    return `INSERT INTO ${this.quote(tableName)} (${columns.join(', ')}) VALUES ${valueRows.join(', ')} RETURNING *`
  },

  updateSql(tableName: string, setParts: string[], whereClause: string): string {
    return `UPDATE ${this.quote(tableName)} SET ${setParts.join(', ')} WHERE ${whereClause} RETURNING *`
  },

  upsertSql(
    tableName: string,
    columns: string[],
    values: string[],
    conflictCols: string,
    updateParts: string[],
  ): string {
    return `INSERT INTO ${this.quote(tableName)} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (${conflictCols}) DO UPDATE SET ${updateParts.join(', ')} RETURNING *`
  },

  deleteSql(tableName: string, whereClause: string): string {
    return `DELETE FROM ${this.quote(tableName)} WHERE ${whereClause}`
  },

  truncateSql(tableName: string): string {
    return `DELETE FROM ${this.quote(tableName)}`
  },

  selectSql(
    tableName: string,
    columns: string,
    whereClause?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): string {
    let sql = `SELECT ${columns} FROM ${this.quote(tableName)}`
    if (whereClause) sql += ` WHERE ${whereClause}`
    if (orderBy) sql += ` ORDER BY ${orderBy}`
    if (limit !== undefined) sql += ` LIMIT ${limit}`
    if (offset !== undefined) sql += ` OFFSET ${offset}`
    return sql
  },

  countSql(tableName: string, whereClause?: string): string {
    let sql = `SELECT COUNT(*) as count FROM ${this.quote(tableName)}`
    if (whereClause) sql += ` WHERE ${whereClause}`
    return sql
  },
}

export default sqlite
