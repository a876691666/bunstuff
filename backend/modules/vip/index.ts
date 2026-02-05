/**
 * VIP 模块统一导出
 */

// 控制器
export { vipAdminController } from './main/api_admin'

// 服务
export { vipService, VipService } from './main/service'
export type { VipBindingCallback } from './main/service'

// 插件
export { vipPlugin } from './main/plugin'
export type { VipScope, VipContext } from './main/plugin'

// 默认导出
export { vipAdminController as default } from './main/api_admin'
