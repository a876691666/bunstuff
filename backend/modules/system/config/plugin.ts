/**
 * 配置插件 - 提供参数配置访问能力
 */

import { Elysia } from 'elysia'
import { configService } from './service'

/** 配置上下文 */
export interface ConfigContext {
  /** 获取配置值 */
  getConfigValue: (key: string) => string | null
  /** 获取配置值，带默认值 */
  getConfigValueOrDefault: (key: string, defaultValue: string) => string
}

/**
 * 配置插件
 *
 * @example
 * ```ts
 * app
 *   .use(configPlugin())
 *   .get("/user", ({ config }) => {
 *     const siteName = config.getConfigValue("sys.name");
 *     const uploadPath = config.getConfigValueOrDefault("sys.file.uploadPath", "./uploads");
 *     // ...
 *   })
 * ```
 */
export function configPlugin() {
  return new Elysia({ name: 'config-plugin' }).derive({ as: 'global' }, () => {
    const config: ConfigContext = {
      getConfigValue: (key: string) => configService.getConfigValue(key),
      getConfigValueOrDefault: (key: string, defaultValue: string) =>
        configService.getConfigValueOrDefault(key, defaultValue),
    }
    return { config }
  })
}
