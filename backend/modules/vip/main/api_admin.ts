import { Elysia, t } from 'elysia'
import { vipService } from './service'
import {
  VipTierSchema,
  VipResourceLimitSchema,
  UserVipSchema,
  UserVipDetailSchema,
  ResourceCheckResultSchema,
  vipTierIdParams,
  vipTierQueryParams,
  createVipTierBody,
  updateVipTierBody,
  vipResourceLimitIdParams,
  createVipResourceLimitBody,
  updateVipResourceLimitBody,
  userVipIdParams,
  userVipQueryParams,
  userIdParams,
  upgradeUserVipBody,
  confirmVipBindingBody,
  incrementResourceBody,
  checkResourceBody,
} from './model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/modules/response'
import { authPlugin } from '@/modules/auth'
import { rbacPlugin } from '@/modules/rbac'
import { vipPlugin } from './plugin'

/** VIP 管理控制器（管理端） */
export const vipAdminController = new Elysia({ prefix: '/vip', tags: ['管理 - VIP'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  // ============ VIP 等级管理 ============

  /** 获取 VIP 等级列表 */
  .get(
    '/tier',
    async ({ query }) => {
      const result = await vipService.findAllTiers(query)
      return R.page(result)
    },
    {
      query: vipTierQueryParams,
      response: {
        200: PagedResponse(VipTierSchema, 'VIP 等级列表分页数据'),
      },
      detail: {
        summary: '获取 VIP 等级列表',
        description: '分页获取 VIP 等级列表\n\n🔐 **所需权限**: `vip:admin:tier:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:list'] } },
      },
    },
  )

  /** 根据 ID 获取 VIP 等级 */
  .get(
    '/tier/:id',
    async ({ params }) => {
      const data = await vipService.findTierById(params.id)
      if (!data) return R.notFound('VIP 等级')
      return R.ok(data)
    },
    {
      params: vipTierIdParams,
      response: {
        200: SuccessResponse(VipTierSchema, 'VIP 等级详情'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取 VIP 等级详情',
        description: '根据 ID 获取 VIP 等级详情\n\n🔐 **所需权限**: `vip:admin:tier:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:read'] } },
      },
    },
  )

  /** 创建 VIP 等级 */
  .post(
    '/tier',
    async ({ body }) => {
      const existing = await vipService.findTierByCode(body.code)
      if (existing) return R.badRequest('VIP 等级代码已存在')
      const data = await vipService.createTier(body)
      return R.ok(data, '创建成功')
    },
    {
      body: createVipTierBody,
      response: {
        200: SuccessResponse(VipTierSchema, '新创建的 VIP 等级'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建 VIP 等级',
        description: '创建新 VIP 等级\n\n🔐 **所需权限**: `vip:admin:tier:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:create'] } },
      },
    },
  )

  /** 更新 VIP 等级 */
  .put(
    '/tier/:id',
    async ({ params, body }) => {
      const existing = await vipService.findTierById(params.id)
      if (!existing) return R.notFound('VIP 等级')
      if (body.code && body.code !== existing.code) {
        const codeExists = await vipService.findTierByCode(body.code)
        if (codeExists) return R.badRequest('VIP 等级代码已存在')
      }
      const data = await vipService.updateTier(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: vipTierIdParams,
      body: updateVipTierBody,
      response: {
        200: SuccessResponse(VipTierSchema, '更新后的 VIP 等级'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新 VIP 等级',
        description: '更新 VIP 等级信息\n\n🔐 **所需权限**: `vip:admin:tier:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:update'] } },
      },
    },
  )

  /** 删除 VIP 等级 */
  .delete(
    '/tier/:id',
    async ({ params }) => {
      const existing = await vipService.findTierById(params.id)
      if (!existing) return R.notFound('VIP 等级')
      try {
        await vipService.deleteTier(params.id)
        return R.ok(null, '删除成功')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      params: vipTierIdParams,
      response: {
        200: MessageResponse,
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '删除 VIP 等级',
        description: '删除 VIP 等级\n\n🔐 **所需权限**: `vip:admin:tier:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:delete'] } },
      },
    },
  )

  // ============ VIP 资源限制管理 ============

  /** 获取 VIP 等级的资源限制 */
  .get(
    '/tier/:id/resource-limits',
    async ({ params }) => {
      const data = await vipService.findResourceLimitsByTierId(params.id)
      return R.ok(data)
    },
    {
      params: vipTierIdParams,
      response: {
        200: SuccessResponse(t.Array(VipResourceLimitSchema), '资源限制列表'),
      },
      detail: {
        summary: '获取 VIP 等级资源限制',
        description:
          '获取指定 VIP 等级的所有资源限制\n\n🔐 **所需权限**: `vip:admin:resource-limit:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource-limit:list'] } },
      },
    },
  )

  /** 创建资源限制 */
  .post(
    '/resource-limit',
    async ({ body }) => {
      try {
        const data = await vipService.createResourceLimit(body)
        return R.ok(data, '创建成功')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: createVipResourceLimitBody,
      response: {
        200: SuccessResponse(VipResourceLimitSchema, '新创建的资源限制'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建资源限制',
        description: '为 VIP 等级创建资源限制\n\n🔐 **所需权限**: `vip:admin:resource-limit:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource-limit:create'] } },
      },
    },
  )

  /** 更新资源限制 */
  .put(
    '/resource-limit/:id',
    async ({ params, body }) => {
      const existing = await vipService.findResourceLimitById(params.id)
      if (!existing) return R.notFound('资源限制')
      const data = await vipService.updateResourceLimit(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: vipResourceLimitIdParams,
      body: updateVipResourceLimitBody,
      response: {
        200: SuccessResponse(VipResourceLimitSchema, '更新后的资源限制'),
        404: ErrorResponse,
      },
      detail: {
        summary: '更新资源限制',
        description: '更新资源限制\n\n🔐 **所需权限**: `vip:admin:resource-limit:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource-limit:update'] } },
      },
    },
  )

  /** 删除资源限制 */
  .delete(
    '/resource-limit/:id',
    async ({ params }) => {
      const existing = await vipService.findResourceLimitById(params.id)
      if (!existing) return R.notFound('资源限制')
      await vipService.deleteResourceLimit(params.id)
      return R.ok(null, '删除成功')
    },
    {
      params: vipResourceLimitIdParams,
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '删除资源限制',
        description: '删除资源限制\n\n🔐 **所需权限**: `vip:admin:resource-limit:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource-limit:delete'] } },
      },
    },
  )

  // ============ 用户 VIP 管理 ============

  /** 获取用户 VIP 列表 */
  .get(
    '/user-vips',
    async ({ query }) => {
      const result = await vipService.findAllUserVips(query)
      return R.page(result)
    },
    {
      query: userVipQueryParams,
      response: {
        200: PagedResponse(UserVipSchema, '用户 VIP 列表分页数据'),
      },
      detail: {
        summary: '获取用户 VIP 列表',
        description: '分页获取用户 VIP 列表\n\n🔐 **所需权限**: `vip:admin:user:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:list'] } },
      },
    },
  )

  /** 获取用户 VIP 信息 */
  .get(
    '/user/:userId',
    async ({ params }) => {
      const data = await vipService.getUserVip(params.userId)
      if (!data) return R.notFound('用户 VIP')
      return R.ok(data)
    },
    {
      params: userIdParams,
      response: {
        200: SuccessResponse(UserVipDetailSchema, '用户 VIP 详情'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取用户 VIP 信息',
        description: '获取指定用户的 VIP 信息\n\n🔐 **所需权限**: `vip:admin:user:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:read'] } },
      },
    },
  )

  /** 升级用户 VIP */
  .post(
    '/upgrade',
    async ({ body }) => {
      try {
        const data = await vipService.upgradeUserVip(body.userId, body.vipTierCode, {
          expireTime: body.expireTime,
        })
        return R.ok(data, 'VIP 升级成功，等待确认绑定')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: upgradeUserVipBody,
      response: {
        200: SuccessResponse(UserVipSchema, '用户 VIP 信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '升级用户 VIP（需确认）',
        description:
          '升级用户 VIP 等级，创建待确认的绑定记录，需要调用确认接口完成绑定\n\n🔐 **所需权限**: `vip:admin:user:upgrade`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:upgrade'] } },
      },
    },
  )

  /** 直接升级用户 VIP */
  .post(
    '/upgrade-direct',
    async ({ body }) => {
      try {
        const data = await vipService.upgradeUserVipDirect(body.userId, body.vipTierCode, {
          expireTime: body.expireTime,
        })
        return R.ok(data, 'VIP 升级成功')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: upgradeUserVipBody,
      response: {
        200: SuccessResponse(UserVipSchema, '用户 VIP 信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '直接升级用户 VIP',
        description:
          '直接升级用户 VIP 等级，立即生效，无需确认\n\n🔐 **所需权限**: `vip:admin:user:upgrade-direct`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:upgrade-direct'] } },
      },
    },
  )

  /** 确认 VIP 绑定 */
  .post(
    '/confirm-binding',
    async ({ body }) => {
      try {
        const data = await vipService.confirmVipBinding(body.userVipId, body.confirm)
        return R.ok(data, body.confirm ? '绑定确认成功' : '绑定已取消')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: confirmVipBindingBody,
      response: {
        200: SuccessResponse(UserVipSchema, '用户 VIP 信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '确认 VIP 绑定',
        description:
          '确认或取消 VIP 绑定，确认后将更新用户角色\n\n🔐 **所需权限**: `vip:admin:user:confirm`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:confirm'] } },
      },
    },
  )

  /** 取消用户 VIP */
  .post(
    '/cancel/:userId',
    async ({ params }) => {
      try {
        await vipService.cancelUserVip(params.userId)
        return R.ok(null, 'VIP 已取消')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      params: userIdParams,
      response: {
        200: MessageResponse,
        400: ErrorResponse,
      },
      detail: {
        summary: '取消用户 VIP',
        description: '取消用户的 VIP，恢复原角色\n\n🔐 **所需权限**: `vip:admin:user:cancel`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:cancel'] } },
      },
    },
  )

  // ============ 资源使用管理 ============

  /** 检查资源使用 */
  .post(
    '/resource/check',
    async ({ body }) => {
      const data = await vipService.checkResourceUsage(body.userId, body.resourceKey, body.amount)
      return R.ok(data)
    },
    {
      body: checkResourceBody,
      response: {
        200: SuccessResponse(ResourceCheckResultSchema, '资源检查结果'),
      },
      detail: {
        summary: '检查资源使用',
        description: '检查用户是否可以使用某资源\n\n🔐 **所需权限**: `vip:admin:resource:check`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource:check'] } },
      },
    },
  )

  /** 增加资源使用 */
  .post(
    '/resource/increment',
    async ({ body }) => {
      try {
        const data = await vipService.incrementResourceUsage(
          body.userId,
          body.resourceKey,
          body.amount,
        )
        return R.ok(data, '资源使用已增加')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: incrementResourceBody,
      response: {
        200: SuccessResponse(ResourceCheckResultSchema, '资源使用结果'),
        400: ErrorResponse,
      },
      detail: {
        summary: '增加资源使用',
        description: '增加用户的资源使用量\n\n🔐 **所需权限**: `vip:admin:resource:increment`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource:increment'] } },
      },
    },
  )

  /** 获取用户资源使用情况 */
  .get(
    '/resource/usage/:userId',
    async ({ params }) => {
      const data = await vipService.getUserResourceUsages(params.userId)
      return R.ok(data)
    },
    {
      params: userIdParams,
      response: {
        200: SuccessResponse(t.Array(ResourceCheckResultSchema), '用户资源使用列表'),
      },
      detail: {
        summary: '获取用户资源使用情况',
        description: '获取用户所有资源的使用情况\n\n🔐 **所需权限**: `vip:admin:resource:usage`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource:usage'] } },
      },
    },
  )

export default vipAdminController
