import CrudTable from '@/models/crud-table'
import type { Row, Insert, Update } from '@/packages/orm'
import { CrudService, type CrudContext, type PageQuery, type PageResult } from '@/modules/crud-service'
import { Model, column, type SchemaDefinition } from '@/packages/orm'
import { db } from '@/models/main'

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
        builder = column.boolean()
        break
      case 'date':
        builder = column.date()
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
 * 从 CrudTable 记录动态创建 ORM Model
 * 会自动同步表结构到数据库
 */
async function createModelFromRecord(record: Row<typeof CrudTable>): Promise<Model<SchemaDefinition, string>> {
  const columns: ColumnDef[] = JSON.parse(record.columns || '[]')
  const schema = buildSchemaFromColumns(columns)

  // 同步表结构到数据库
  await db.syncTable(record.tableName, schema)

  // 创建 Model 实例
  return new Model(db.sql, db.dialect, {
    tableName: record.tableName,
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
 *    动态创建 ORM Model + CrudService 并注册
 *
 * `get(tableName)` 返回对应的 CrudService（代码级注册始终可用；
 * 数据库驱动需 CrudTable status=1）。
 *
 * @example
 * ```ts
 * import { crudRegistry } from '@/modules/crud'
 * import Notice from '@/models/notice'
 *
 * // 方式 1: 代码级注册已有 Model
 * crudRegistry.register(Notice)
 *
 * // 方式 2: 管理员在 CrudTable 中创建记录
 * //   { tableName: 'my_table', columns: '[...]', status: 1 }
 * //   → CrudTableService 会自动调用 syncFromRecord()
 * //   → 动态建表 + 创建 Model + 注册到 Registry
 *
 * // 通配 API: GET /crud/notice  GET /crud/my_table
 * ```
 */
class CrudRegistry {
  /** tableName → CrudService */
  private services = new Map<string, CrudService<any>>()
  /** 代码级注册的表名（不受 CrudTable 状态影响，始终可用） */
  private staticTables = new Set<string>()

  // ============ 代码级注册 ============

  /**
   * 注册一个已有的 ORM Model（代码级，始终可用）
   */
  register<S extends SchemaDefinition>(model: Model<S, any>) {
    const name = model.tableName
    if (this.services.has(name)) {
      console.warn(`⚠️  CrudRegistry: 表 "${name}" 已注册，将被覆盖`)
    }
    this.services.set(name, new CrudService(model))
    this.staticTables.add(name)
  }

  /**
   * 批量注册
   */
  registerMany(models: Model<any, any>[]) {
    for (const m of models) {
      this.register(m)
    }
  }

  // ============ 数据库驱动同步 ============

  /**
   * 从 CrudTable 记录同步：解析 columns JSON → 创建 Model → 注册
   */
  async syncFromRecord(record: Row<typeof CrudTable>) {
    if (record.status !== 1) {
      // 非启用状态 → 移除（但不移除代码级注册的）
      if (!this.staticTables.has(record.tableName)) {
        this.services.delete(record.tableName)
      }
      return
    }

    // 如果是代码级注册的，跳过（代码优先）
    if (this.staticTables.has(record.tableName)) {
      return
    }

    try {
      const model = await createModelFromRecord(record)
      this.services.set(record.tableName, new CrudService(model))
    } catch (e) {
      console.error(`❌ CrudRegistry: 同步表 "${record.tableName}" 失败:`, e)
    }
  }

  /**
   * 从注册中心移除数据库驱动的表
   */
  removeDbDriven(tableName: string) {
    if (this.staticTables.has(tableName)) return // 不移除代码级注册
    this.services.delete(tableName)
  }

  // ============ 查询接口 ============

  /**
   * 获取指定表的 CrudService
   */
  get(tableName: string): CrudService<any> | undefined {
    return this.services.get(tableName)
  }

  /**
   * 判断表是否可用
   */
  has(tableName: string): boolean {
    return this.services.has(tableName)
  }

  /**
   * 取消注册
   */
  unregister(tableName: string): boolean {
    this.staticTables.delete(tableName)
    return this.services.delete(tableName)
  }

  /**
   * 获取所有可用的表名
   */
  list(): string[] {
    return Array.from(this.services.keys())
  }

  /**
   * 获取代码级注册的表名
   */
  listStatic(): string[] {
    return Array.from(this.staticTables)
  }

  /**
   * 从数据库初始化：加载所有 status=1 的 CrudTable 记录，动态创建 Model 并注册
   */
  async initFromDb() {
    const enabledRecords = await CrudTable.findMany({ where: `status = 1` })
    let synced = 0
    let skipped = 0

    for (const record of enabledRecords) {
      if (this.staticTables.has(record.tableName)) {
        skipped++
        continue
      }
      try {
        const model = await createModelFromRecord(record)
        this.services.set(record.tableName, new CrudService(model))
        synced++
      } catch (e) {
        console.error(`❌ CrudRegistry: 初始化表 "${record.tableName}" 失败:`, e)
      }
    }

    console.log(
      `✅ CrudRegistry: 初始化完成 — 代码级 ${this.staticTables.size} 个，` +
        `数据库驱动 ${synced} 个，跳过(代码优先) ${skipped} 个`,
    )
  }
}

export const crudRegistry = new CrudRegistry()

// ============ CrudTable 管理服务 ============

/** CrudTable 管理服务（自动同步 CrudRegistry） */
export class CrudTableService extends CrudService<typeof CrudTable.schema> {
  constructor() {
    super(CrudTable)
  }

  /** 根据表名查找 */
  async findByTableName(tableName: string) {
    return await CrudTable.findOne({ where: `tableName = '${tableName}'` })
  }

  /** 创建 CrudTable 记录并同步到注册中心 */
  override async create(data: Insert<typeof CrudTable>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) {
      await crudRegistry.syncFromRecord(result)
    }
    return result
  }

  /** 更新 CrudTable 记录并同步到注册中心 */
  override async update(id: number, data: Update<typeof CrudTable>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) {
      await crudRegistry.syncFromRecord(result)
    }
    return result
  }

  /** 删除 CrudTable 记录并从注册中心移除 */
  override async delete(id: number, ctx?: CrudContext) {
    const record = await this.findById(id, ctx)
    const ok = await super.delete(id, ctx)
    if (ok && record) {
      crudRegistry.removeDbDriven(record.tableName)
    }
    return ok
  }
}

export const crudTableService = new CrudTableService()

