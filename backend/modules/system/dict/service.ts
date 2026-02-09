import type { Insert, Update } from '@/packages/orm'
import DictType from '@/models/dict-type'
import DictData from '@/models/dict-data'
import { CrudService, type CrudContext } from '@/modules/crud-service'

/** 字典缓存 */
class DictCache {
  private cache = new Map<string, Map<string, any>>()
  private initialized = false

  /** 初始化缓存 */
  async init() {
    if (this.initialized) return
    await this.reload()
    this.initialized = true
  }

  /** 重新加载缓存 */
  async reload() {
    this.cache.clear()
    const allData = await DictData.findMany({ where: `status = 1` })
    for (const item of allData) {
      if (!this.cache.has(item.dictType)) {
        this.cache.set(item.dictType, new Map())
      }
      this.cache.get(item.dictType)!.set(item.value, item)
    }
  }

  /** 获取字典Map */
  getMap(dictType: string): Map<string, any> {
    return this.cache.get(dictType) || new Map()
  }

  /** 获取字典列表 */
  getList(dictType: string): any[] {
    const map = this.cache.get(dictType)
    return map ? Array.from(map.values()).sort((a, b) => a.sort - b.sort) : []
  }

  /** 获取字典值对应的标签 */
  getLabel(dictType: string, value: string): string | null {
    return this.cache.get(dictType)?.get(value)?.label || null
  }
}

export const dictCache = new DictCache()

/** 字典服务 */
export class DictService {
  private typeCrud = new CrudService(DictType)
  private dataCrud = new CrudService(DictData)

  // ============ 字典类型 ============

  /** 获取字典类型列表 */
  async findAllTypes(query?: { page?: number; pageSize?: number; filter?: string }, ctx?: CrudContext) {
    return this.typeCrud.findAll(query, ctx)
  }

  /** 根据ID获取字典类型 */
  async findTypeById(id: number, ctx?: CrudContext) {
    return this.typeCrud.findById(id, ctx)
  }

  /** 根据类型获取字典类型 */
  async findTypeByType(type: string) {
    return await DictType.findOne({ where: `type = '${type}'` })
  }

  /** 创建字典类型 */
  async createType(data: Insert<typeof DictType>, ctx?: CrudContext) {
    return this.typeCrud.create(data, ctx)
  }

  /** 更新字典类型 */
  async updateType(id: number, data: Update<typeof DictType>, ctx?: CrudContext) {
    const result = await this.typeCrud.update(id, data, ctx)
    await dictCache.reload()
    return result
  }

  /** 删除字典类型 */
  async deleteType(id: number, ctx?: CrudContext) {
    const type = await this.findTypeById(id, ctx)
    if (type) {
      // 删除关联的字典数据
      await this.dataCrud.deleteMany(`dictType = '${type.type}'`, ctx)
    }
    const result = await this.typeCrud.delete(id, ctx)
    await dictCache.reload()
    return result
  }

  // ============ 字典数据 ============

  /** 获取字典数据列表 */
  async findAllData(query?: { page?: number; pageSize?: number; filter?: string }, ctx?: CrudContext) {
    return this.dataCrud.findAll(query, ctx)
  }

  /** 根据ID获取字典数据 */
  async findDataById(id: number, ctx?: CrudContext) {
    return this.dataCrud.findById(id, ctx)
  }

  /** 根据字典类型获取数据列表 */
  async findDataByType(dictType: string) {
    return await DictData.findMany({
      where: `dictType = '${dictType}' && status = 1`,
      orderBy: [{ column: 'sort', order: 'ASC' }],
    })
  }

  /** 创建字典数据 */
  async createData(data: Insert<typeof DictData>, ctx?: CrudContext) {
    const result = await this.dataCrud.create(data, ctx)
    await dictCache.reload()
    return result
  }

  /** 更新字典数据 */
  async updateData(id: number, data: Update<typeof DictData>, ctx?: CrudContext) {
    const result = await this.dataCrud.update(id, data, ctx)
    await dictCache.reload()
    return result
  }

  /** 删除字典数据 */
  async deleteData(id: number, ctx?: CrudContext) {
    const result = await this.dataCrud.delete(id, ctx)
    await dictCache.reload()
    return result
  }

  // ============ 缓存相关 ============

  /** 初始化字典缓存 */
  async initCache() {
    await dictCache.init()
  }

  /** 获取字典Map (供插件使用) */
  getDictMap(dictType: string) {
    return dictCache.getMap(dictType)
  }

  /** 获取字典列表 (供插件使用) */
  getDictList(dictType: string) {
    return dictCache.getList(dictType)
  }

  /** 获取字典标签 */
  getDictLabel(dictType: string, value: string) {
    return dictCache.getLabel(dictType, value)
  }
}

export const dictService = new DictService()
