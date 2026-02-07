import type { Dialect, Value, Values } from '../types'

// 转义字符串中的特殊字符
function escapeString(str: string): string {
  return str.replace(/'/g, "''")
}

// PostgreSQL 方言
export const postgres: Dialect = {
  name: 'postgres',

  quote: (field) => `"${field}"`,
  placeholder: (index) => `$${index + 1}`,

  escape(value: Value): string {
    if (value === null) return 'NULL'
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
    if (typeof value === 'number') return String(value)
    return `'${escapeString(String(value))}'`
  },

  assemble(sql: string, params: Values): string {
    return sql.replace(/\$(\d+)/g, (_, n) => this.escape(params[Number(n) - 1] ?? null))
  },

  // ============ 表操作 ============

  tableExistsSql(tableName: string): string {
    return `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = '${escapeString(tableName)}'`
  },

  tableColumnsSql(tableName: string): string {
    return `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${escapeString(tableName)}'`
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
    return `TRUNCATE TABLE ${this.quote(tableName)} RESTART IDENTITY`
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

export default postgres
