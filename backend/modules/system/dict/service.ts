import { where, parse } from '@pkg/ssql'
import DictType from '@/models/dict-type'
import DictData from '@/models/dict-data'
import type { DictTypeInsert, DictTypeUpdate } from '@/models/dict-type'
import type { DictDataInsert, DictDataUpdate } from '@/models/dict-data'

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
    const allData = await DictData.findMany({ where: where().eq('status', 1) })
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
  // ============ 字典类型 ============

  /** 获取字典类型列表 */
  async findAllTypes(query?: {
    page?: number
    pageSize?: number
    filter?: string
  }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    // 解析 ssql 过滤条件
    const whereClause = query?.filter ? where().expr(parse(query.filter)) : where()

    const data = await DictType.findMany({ where: whereClause, limit: pageSize, offset })
    const total = await DictType.count(whereClause)

    return { data, total, page, pageSize }
  }

  /** 根据ID获取字典类型 */
  async findTypeById(id: number) {
    return await DictType.findOne({ where: where().eq('id', id) })
  }

  /** 根据类型获取字典类型 */
  async findTypeByType(type: string) {
    return await DictType.findOne({ where: where().eq('type', type) })
  }

  /** 创建字典类型 */
  async createType(data: DictTypeInsert) {
    const result = await DictType.create(data)
    return result
  }

  /** 更新字典类型 */
  async updateType(id: number, data: DictTypeUpdate) {
    const result = await DictType.update(id, data)
    await dictCache.reload()
    return result
  }

  /** 删除字典类型 */
  async deleteType(id: number) {
    const type = await this.findTypeById(id)
    if (type) {
      // 删除关联的字典数据
      await DictData.deleteMany(where().eq('dictType', type.type))
    }
    const result = await DictType.delete(id)
    await dictCache.reload()
    return result
  }

  // ============ 字典数据 ============

  /** 获取字典数据列表 */
  async findAllData(query?: {
    page?: number
    pageSize?: number
    filter?: string
  }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    // 解析 ssql 过滤条件
    const whereClause = query?.filter ? where().expr(parse(query.filter)) : where()

    const data = await DictData.findMany({
      where: whereClause,
      limit: pageSize,
      offset,
    })
    const total = await DictData.count(whereClause)

    return { data, total, page, pageSize }
  }

  /** 根据ID获取字典数据 */
  async findDataById(id: number) {
    return await DictData.findOne({ where: where().eq('id', id) })
  }

  /** 根据字典类型获取数据列表 */
  async findDataByType(dictType: string) {
    return await DictData.findMany({
      where: where().eq('dictType', dictType).and().eq('status', 1),
      orderBy: [{ column: 'sort', order: 'ASC' }],
    })
  }

  /** 创建字典数据 */
  async createData(data: DictDataInsert) {
    const result = await DictData.create(data)
    await dictCache.reload()
    return result
  }

  /** 更新字典数据 */
  async updateData(id: number, data: DictDataUpdate) {
    const result = await DictData.update(id, data)
    await dictCache.reload()
    return result
  }

  /** 删除字典数据 */
  async deleteData(id: number) {
    const result = await DictData.delete(id)
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
