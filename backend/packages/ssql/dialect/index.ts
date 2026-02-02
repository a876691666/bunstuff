import type { Dialect } from '../types'
import { mysql } from './mysql'
import { postgres } from './postgres'
import { sqlite } from './sqlite'

export { mysql } from './mysql'
export { postgres } from './postgres'
export { sqlite } from './sqlite'
export type { Dialect } from '../types'

// 根据驱动名获取方言
export function getDialect(driver: string): Dialect {
  switch (driver) {
    case 'postgres':
    case 'postgresql':
    case 'pg':
      return postgres
    case 'sqlite':
    case 'sqlite3':
      return sqlite
    case 'mysql':
    case 'mysql2':
      return mysql
    default:
      return sqlite
  }
}

// 从数据库连接获取方言
export function getDialectFromConnection(sql: unknown): Dialect {
  // @ts-ignore - 访问 Bun SQL 连接的内部属性
  const dialect = sql?.dialect ?? sql?._dialect ?? sql?.driver ?? 'sqlite'
  if (typeof dialect === 'string') {
    return getDialect(dialect)
  }
  // 尝试从 SQL 实例检测
  // @ts-ignore
  if (sql?.constructor?.name) {
    // @ts-ignore
    const name = sql.constructor.name.toLowerCase()
    if (name.includes('postgres') || name.includes('pg')) return postgres
    if (name.includes('mysql')) return mysql
    if (name.includes('sqlite')) return sqlite
  }
  return sqlite
}
