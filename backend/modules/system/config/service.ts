import type { Insert, Update } from '@/packages/orm'
import SysConfig from '@/models/sys-config'
import { CrudService, type CrudContext } from '@/modules/crud-service'

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
export class ConfigService extends CrudService<typeof SysConfig.schema> {
  constructor() {
    super(SysConfig)
  }

  /** 根据键名获取参数配置 */
  async findByKey(key: string) {
    return await this.model.findOne({ where: `key = '${key}'` })
  }

  /** 创建参数配置 */
  override async create(data: Insert<typeof SysConfig>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await configCache.reload()
    return result
  }

  /** 更新参数配置 */
  override async update(id: number, data: Update<typeof SysConfig>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) await configCache.reload()
    return result
  }

  /** 删除参数配置 */
  override async delete(id: number, ctx?: CrudContext) {
    const ok = await super.delete(id, ctx)
    if (ok) await configCache.reload()
    return ok
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
