/**
 * CRUD 表配置管理 + 注册中心 服务
 * 从 modules/crud/main/service.ts 迁移
 */

import { model, db } from '@/core/model'
import type { Row, Insert, Update } from '@/packages/orm'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import { Model, column, type SchemaDefinition } from '@/packages/orm'

const CrudTable = model.crud_table

// ============ 列定义 JSON → SchemaDefinition ============

/** CrudTable.columns JSON 中每一列的定义格式 */
export interface ColumnDef {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date'
  primaryKey?: boolean
  autoIncrement?: boolean
  nullable?: boolean
  default?: any
  unique?: boolean
  description?: string
  /** 是否在新建表单中显示 */
  showInCreate?: boolean
  /** 是否在更新表单中显示 */
  showInUpdate?: boolean
  /** 是否作为搜索过滤条件 */
  showInFilter?: boolean
  /** 是否在列表表格中显示 */
  showInList?: boolean
}

/**
 * 将 columns JSON 数组转换为 ORM SchemaDefinition
 * 自动追加 createdAt / updatedAt 时间戳（若未定义）
 */
function buildSchemaFromColumns(columns: ColumnDef[]): SchemaDefinition {
  const schema: SchemaDefinition = {}

  for (const col of columns) {
    let builder: any

    switch (col.type) {
      case 'number':
        builder = column.number()
        if (col.autoIncrement) builder = builder.autoIncrement()
        break
      case 'boolean':
        builder = column
          .number()
          .serialize((v: number) => (v === 1 || (v as any) === true ? 1 : 0))
          .deserialize((v: number) =>
            (v as any) === true || v === 1 || (v as any) === '1' || (v as any) === 'true' ? 1 : 0,
          )
        break
      case 'date':
        builder = column
          .date()
          .serialize((v: any) => {
            if (!v) return null
            if (v instanceof Date) return v.toISOString()
            const d = new Date(v)
            return isNaN(d.getTime()) ? v : d.toISOString()
          })
          .deserialize((v: any) => {
            if (!v) return null
            if (v instanceof Date) return v.toISOString()
            const d = new Date(v)
            return isNaN(d.getTime()) ? v : d.toISOString()
          })
        break
      case 'string':
      default:
        builder = column.string()
        break
    }

    if (col.primaryKey) builder = builder.primaryKey()
    if (col.unique) builder = builder.unique()
    if (col.nullable) builder = builder.nullable()
    if (col.default !== undefined) builder = builder.default(col.default)
    if (col.description) builder = builder.description(col.description)

    schema[col.name] = builder
  }

  // 自动追加时间戳
  if (!schema.createdAt) {
    schema.createdAt = column.date().default(() => new Date())
  }
  if (!schema.updatedAt) {
    schema.updatedAt = column.date().default(() => new Date())
  }

  return schema
}

/**
 * 获取 CRUD 动态表在数据库中的实际表名（添加 crud_ 前缀）
 */
function getDbTableName(tableName: string): string {
  return tableName.startsWith('crud_') ? tableName : `crud_${tableName}`
}

/**
 * 从 CrudTable 记录动态创建 ORM Model
 * 会自动同步表结构到数据库
 */
async function createModelFromRecord(
  record: Row<typeof CrudTable>,
): Promise<Model<SchemaDefinition, string>> {
  const columns: ColumnDef[] = JSON.parse(record.columns || '[]')
  const schema = buildSchemaFromColumns(columns)
  const dbTableName = getDbTableName(record.tableName)

  // 同步表结构到数据库（使用带前缀的表名）
  await db.syncTable(dbTableName, schema)

  // 创建 Model 实例（实际数据库表名带 crud_ 前缀）
  return new Model(db.sql, db.dialect, {
    tableName: dbTableName,
    schema,
  })
}

// ============ CRUD 注册中心 ============

/**
 * CRUD 注册中心
 *
 * 统一管理所有通过通配接口 `/crud/:tableName` 暴露的 ORM Model。
 *
 * 支持两种注册方式:
 * 1. **代码级注册**: `register(Model)` — 直接传入已有的 ORM Model
 * 2. **数据库驱动**: CrudTable 记录的增删改自动同步 — 解析 columns JSON，
 *    动态创建 ORM Model 并注册
 */
function createCrudRegistry() {
  /** tableName → Model */
  const models = new Map<string, Model<any, any>>()
  /** 代码级注册的表名（不受 CrudTable 状态影响，始终可用） */
  const staticTables = new Set<string>()

  return {
    // ============ 代码级注册 ============

    register<S extends SchemaDefinition>(m: Model<S, any>) {
      const name = m.tableName
      if (models.has(name)) {
        console.warn(`⚠️  CrudRegistry: 表 "${name}" 已注册，将被覆盖`)
      }
      models.set(name, m)
      staticTables.add(name)
    },

    registerMany(list: Model<any, any>[]) {
      for (const m of list) this.register(m)
    },

    // ============ 数据库驱动同步 ============

    async syncFromRecord(record: Row<typeof CrudTable>) {
      if (record.status !== 1) {
        if (!staticTables.has(record.tableName)) models.delete(record.tableName)
        return
      }
      if (staticTables.has(record.tableName)) return
      try {
        models.set(record.tableName, await createModelFromRecord(record))
      } catch (e) {
        console.error(`❌ CrudRegistry: 同步表 "${record.tableName}" 失败:`, e)
      }
    },

    removeDbDriven(tableName: string) {
      if (staticTables.has(tableName)) return
      models.delete(tableName)
    },

    // ============ 查询接口 ============

    get(tableName: string): Model<any, any> | undefined {
      return models.get(tableName)
    },

    has(tableName: string): boolean {
      return models.has(tableName)
    },

    unregister(tableName: string): boolean {
      staticTables.delete(tableName)
      return models.delete(tableName)
    },

    list(): string[] {
      return Array.from(models.keys())
    },

    listStatic(): string[] {
      return Array.from(staticTables)
    },

    async initFromDb() {
      const enabledRecords = await CrudTable.findMany({ where: `status = 1` })
      let synced = 0
      let skipped = 0

      for (const record of enabledRecords) {
        if (staticTables.has(record.tableName)) {
          skipped++
          continue
        }
        try {
          models.set(record.tableName, await createModelFromRecord(record))
          synced++
        } catch (e) {
          console.error(`❌ CrudRegistry: 初始化表 "${record.tableName}" 失败:`, e)
        }
      }

      console.log(
        `✅ CrudRegistry: 初始化完成 — 代码级 ${staticTables.size} 个，` +
          `数据库驱动 ${synced} 个，跳过(代码优先) ${skipped} 个`,
      )
    },
  }
}

export const crudRegistry = createCrudRegistry()

// ============ CrudTable CRUD 函数 ============

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return CrudTable.page({
    where: buildWhere(CrudTable.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return CrudTable.findOne({ where: buildWhere(CrudTable.tableName, `id = ${id}`, ctx) })
}

export async function findByTableName(tableName: string) {
  return CrudTable.findOne({ where: `tableName = '${tableName}'` })
}

export async function create(data: Insert<typeof CrudTable>, ctx?: CrudContext) {
  if (!checkCreateScope(CrudTable.tableName, data as Record<string, any>, ctx)) return null
  const result = await CrudTable.create(data)
  if (result) await crudRegistry.syncFromRecord(result)
  return result
}

export async function update(id: number, data: Update<typeof CrudTable>, ctx?: CrudContext) {
  const w = buildWhere(CrudTable.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await CrudTable.updateMany(w, data)
  if (n === 0) return null
  const result = await CrudTable.getOne(id as any)
  if (result) await crudRegistry.syncFromRecord(result)
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const record = await findById(id, ctx)
  const w = buildWhere(CrudTable.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await CrudTable.deleteMany(w)) > 0
  if (ok && record) crudRegistry.removeDbDriven(record.tableName)
  return ok
}

/** Schema 代理 */
export const getSchema: (typeof CrudTable)['getSchema'] = CrudTable.getSchema.bind(CrudTable)
