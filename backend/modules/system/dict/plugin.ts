/**
 * 字典插件 - 提供字典数据访问能力
 */

import { Elysia } from 'elysia'
import { dictService } from './service'

/** 字典上下文 */
export interface DictContext {
  /** 获取字典Map */
  getDictMap: (dictType: string) => Map<string, any>
  /** 获取字典列表 */
  getDictList: (dictType: string) => any[]
  /** 获取字典标签 */
  getDictLabel: (dictType: string, value: string) => string | null
}

/**
 * 字典插件
 *
 * @example
 * ```ts
 * app
 *   .use(dictPlugin())
 *   .get("/user", ({ dict }) => {
 *     const sexList = dict.getDictList("sys_user_sex");
 *     const sexLabel = dict.getDictLabel("sys_user_sex", "0");
 *     // ...
 *   })
 * ```
 */
export function dictPlugin() {
  return new Elysia({ name: 'dict-plugin' }).derive({ as: 'global' }, () => {
    const dict: DictContext = {
      getDictMap: (dictType: string) => dictService.getDictMap(dictType),
      getDictList: (dictType: string) => dictService.getDictList(dictType),
      getDictLabel: (dictType: string, value: string) => dictService.getDictLabel(dictType, value),
    }
    return { dict }
  })
}
