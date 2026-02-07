import type { Insert, Update } from '@/packages/orm'
import SysConfig from '@/models/sys-config'

/** 参数配置缓存 */
class ConfigCache {
  private cache = new Map<string, any>()
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
    const allConfigs = await SysConfig.findMany()
    for (const config of allConfigs) {
      this.cache.set(config.key, config)
    }
  }

  /** 获取配置值 */
  getValue(key: string): string | null {
    return this.cache.get(key)?.value || null
  }

  /** 获取配置对象 */
  getConfig(key: string): any | null {
    return this.cache.get(key) || null
  }

  /** 获取所有配置 */
  getAll(): Map<string, any> {
    return new Map(this.cache)
  }
}

export const configCache = new ConfigCache()

/** 参数配置服务 */
export class ConfigService {
  /** 获取参数配置列表 */
  async findAll(query?: { page?: number; pageSize?: number; filter?: string }) {
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const offset = (page - 1) * pageSize

    const data = await SysConfig.findMany({ where: query?.filter, limit: pageSize, offset })
    const total = await SysConfig.count(query?.filter)

    return { data, total, page, pageSize }
  }

  /** 根据ID获取参数配置 */
  async findById(id: number) {
    return await SysConfig.findOne({ where: `id = ${id}` })
  }

  /** 根据键名获取参数配置 */
  async findByKey(key: string) {
    return await SysConfig.findOne({ where: `key = '${key}'` })
  }

  /** 创建参数配置 */
  async create(data: Insert<typeof SysConfig>) {
    const result = await SysConfig.create(data)
    await configCache.reload()
    return result
  }

  /** 更新参数配置 */
  async update(id: number, data: Update<typeof SysConfig>) {
    const result = await SysConfig.update(id, data)
    await configCache.reload()
    return result
  }

  /** 删除参数配置 */
  async delete(id: number) {
    const result = await SysConfig.delete(id)
    await configCache.reload()
    return result
  }

  // ============ 缓存相关 ============

  /** 初始化配置缓存 */
  async initCache() {
    await configCache.init()
  }

  /** 获取配置值 (供插件使用) */
  getConfigValue(key: string): string | null {
    return configCache.getValue(key)
  }

  /** 获取配置值，带默认值 */
  getConfigValueOrDefault(key: string, defaultValue: string): string {
    return configCache.getValue(key) || defaultValue
  }

  /** 获取配置对象 */
  getConfig(key: string) {
    return configCache.getConfig(key)
  }
}

export const configService = new ConfigService()
