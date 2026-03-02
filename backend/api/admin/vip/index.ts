/**
 * VIP 管理控制器（管理端）
 * 从 modules/vip/main/api_admin.ts 迁移
 */

import { Elysia, t } from 'elysia'
import * as vipService from '@/services/vip'
import { idParams, query } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { operLogPlugin } from '@/plugins/oper-log'

export default new Elysia({ tags: ['管理 - VIP'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  // ============ VIP 等级管理 ============

  .get(
    '/tier',
    async (ctx) => {
      const result = await vipService.findAllTiers(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(vipService.getTierSchema(), 'VIP 等级列表分页数据') },
      detail: {
        summary: '获取 VIP 等级列表',
        description: '分页获取 VIP 等级列表\n\n🔐 **所需权限**: `vip:admin:tier:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:list'] } },
      },
    },
  )

  .get(
    '/tier/:id',
    async (ctx) => {
      const data = await vipService.findTierById(ctx.params.id, ctx)
      if (!data) return R.notFound('VIP 等级')
      return R.ok(data)
    },
    {
      params: idParams({ label: 'VIP 等级' }),
      response: {
        200: SuccessResponse(vipService.getTierSchema(), 'VIP 等级详情'),
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

  .post(
    '/tier',
    async (ctx) => {
      const existing = await vipService.findTierByCode(ctx.body.code)
      if (existing) return R.badRequest('VIP 等级代码已存在')
      const data = await vipService.createTier(ctx.body, ctx)
      if (!data) return R.forbidden('无权操作')
      return R.ok(data, '创建成功')
    },
    {
      body: vipService.getTierSchema({
        exclude: ['id'],
        partial: true,
        required: ['name', 'code'],
      }),
      response: {
        200: SuccessResponse(vipService.getTierSchema(), '新创建的 VIP 等级'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建 VIP 等级',
        description: '创建新 VIP 等级\n\n🔐 **所需权限**: `vip:admin:tier:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:create'] } },
        operLog: { title: 'VIP等级', type: 'create' },
      },
    },
  )

  .put(
    '/tier/:id',
    async (ctx) => {
      const existing = await vipService.findTierById(ctx.params.id, ctx)
      if (!existing) return R.notFound('VIP 等级')
      if (ctx.body.code && ctx.body.code !== existing.code) {
        const codeExists = await vipService.findTierByCode(ctx.body.code)
        if (codeExists) return R.badRequest('VIP 等级代码已存在')
      }
      const data = await vipService.updateTier(ctx.params.id, ctx.body, ctx)
      if (!data) return R.forbidden('无权操作该记录')
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: 'VIP 等级' }),
      body: vipService.getTierSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(vipService.getTierSchema(), '更新后的 VIP 等级'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新 VIP 等级',
        description: '更新 VIP 等级信息\n\n🔐 **所需权限**: `vip:admin:tier:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:update'] } },
        operLog: { title: 'VIP等级', type: 'update' },
      },
    },
  )

  .delete(
    '/tier/:id',
    async (ctx) => {
      const existing = await vipService.findTierById(ctx.params.id, ctx)
      if (!existing) return R.notFound('VIP 等级')
      try {
        await vipService.deleteTier(ctx.params.id, ctx)
        return R.ok(null, '删除成功')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      params: idParams({ label: 'VIP 等级' }),
      response: { 200: MessageResponse, 400: ErrorResponse, 404: ErrorResponse },
      detail: {
        summary: '删除 VIP 等级',
        description: '删除 VIP 等级\n\n🔐 **所需权限**: `vip:admin:tier:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:tier:delete'] } },
        operLog: { title: 'VIP等级', type: 'delete' },
      },
    },
  )

  // ============ VIP 资源限制管理 ============

  .get(
    '/tier/:id/resource-limits',
    async (ctx) => {
      const data = await vipService.findResourceLimitsByTierId(ctx.params.id, ctx)
      return R.ok(data)
    },
    {
      params: idParams({ label: 'VIP 等级' }),
      response: {
        200: SuccessResponse(t.Array(vipService.getResourceLimitSchema()), '资源限制列表'),
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

  .post(
    '/resource-limit',
    async (ctx) => {
      try {
        const data = await vipService.createResourceLimit(ctx.body, ctx)
        if (!data) return R.forbidden('无权操作')
        return R.ok(data, '创建成功')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: vipService.getResourceLimitSchema({
        exclude: ['id'],
        partial: true,
        required: ['vipTierId', 'resourceKey', 'limitValue'],
      }),
      response: {
        200: SuccessResponse(vipService.getResourceLimitSchema(), '新创建的资源限制'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建资源限制',
        description:
          '为 VIP 等级创建资源限制\n\n🔐 **所需权限**: `vip:admin:resource-limit:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource-limit:create'] } },
        operLog: { title: 'VIP资源限制', type: 'create' },
      },
    },
  )

  .put(
    '/resource-limit/:id',
    async (ctx) => {
      const existing = await vipService.findResourceLimitById(ctx.params.id, ctx)
      if (!existing) return R.notFound('资源限制')
      const data = await vipService.updateResourceLimit(ctx.params.id, ctx.body, ctx)
      if (!data) return R.forbidden('无权操作该记录')
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '资源限制' }),
      body: vipService.getResourceLimitSchema({ exclude: ['id', 'vipTierId'], partial: true }),
      response: {
        200: SuccessResponse(vipService.getResourceLimitSchema(), '更新后的资源限制'),
        404: ErrorResponse,
      },
      detail: {
        summary: '更新资源限制',
        description: '更新资源限制\n\n🔐 **所需权限**: `vip:admin:resource-limit:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource-limit:update'] } },
        operLog: { title: 'VIP资源限制', type: 'update' },
      },
    },
  )

  .delete(
    '/resource-limit/:id',
    async (ctx) => {
      const existing = await vipService.findResourceLimitById(ctx.params.id, ctx)
      if (!existing) return R.notFound('资源限制')
      await vipService.deleteResourceLimit(ctx.params.id, ctx)
      return R.ok(null, '删除成功')
    },
    {
      params: idParams({ label: '资源限制' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除资源限制',
        description: '删除资源限制\n\n🔐 **所需权限**: `vip:admin:resource-limit:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource-limit:delete'] } },
        operLog: { title: 'VIP资源限制', type: 'delete' },
      },
    },
  )

  // ============ 用户 VIP 管理 ============

  .get(
    '/user-vips',
    async (ctx) => {
      const result = await vipService.findAllUserVips(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(vipService.getUserVipSchema(), '用户 VIP 列表分页数据') },
      detail: {
        summary: '获取用户 VIP 列表',
        description: '分页获取用户 VIP 列表\n\n🔐 **所需权限**: `vip:admin:user:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:list'] } },
      },
    },
  )

  .get(
    '/user/:userId',
    async (ctx) => {
      const data = await vipService.getUserVip(ctx.params.userId)
      if (!data) return R.notFound('用户 VIP')
      return R.ok(data)
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户 ID' }) }),
      response: {
        200: SuccessResponse(
          vipService.getUserVipSchema({
            vipTier: t.Optional(vipService.getTierSchema({ exclude: ['createdAt', 'updatedAt'] })),
            resourceLimits: t.Optional(
              t.Array(vipService.getResourceLimitSchema({ exclude: ['createdAt', 'updatedAt'] })),
            ),
          }),
          '用户 VIP 详情',
        ),
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

  .post(
    '/upgrade',
    async (ctx) => {
      try {
        const data = await vipService.upgradeUserVip(ctx.body.userId, ctx.body.vipTierCode, {
          expireTime: ctx.body.expireTime,
        })
        return R.ok(data, 'VIP 升级成功，等待确认绑定')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: t.Object({
        userId: t.Number({ description: '用户 ID' }),
        vipTierCode: t.String({ description: 'VIP 等级代码' }),
        expireTime: t.Optional(
          t.Nullable(t.String({ description: '过期时间，不传则根据 VIP 等级自动计算' })),
        ),
      }),
      response: {
        200: SuccessResponse(vipService.getUserVipSchema(), '用户 VIP 信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '升级用户 VIP（需确认）',
        description:
          '升级用户 VIP 等级，创建待确认的绑定记录\n\n🔐 **所需权限**: `vip:admin:user:upgrade`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:upgrade'] } },
        operLog: { title: '用户VIP', type: 'update' },
      },
    },
  )

  .post(
    '/upgrade-direct',
    async (ctx) => {
      try {
        const data = await vipService.upgradeUserVipDirect(ctx.body.userId, ctx.body.vipTierCode, {
          expireTime: ctx.body.expireTime,
        })
        return R.ok(data, 'VIP 升级成功')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: t.Object({
        userId: t.Number({ description: '用户 ID' }),
        vipTierCode: t.String({ description: 'VIP 等级代码' }),
        expireTime: t.Optional(
          t.Nullable(t.String({ description: '过期时间，不传则根据 VIP 等级自动计算' })),
        ),
      }),
      response: {
        200: SuccessResponse(vipService.getUserVipSchema(), '用户 VIP 信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '直接升级用户 VIP',
        description:
          '直接升级用户 VIP 等级，立即生效\n\n🔐 **所需权限**: `vip:admin:user:upgrade-direct`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:upgrade-direct'] } },
        operLog: { title: '用户VIP', type: 'update' },
      },
    },
  )

  .post(
    '/confirm-binding',
    async (ctx) => {
      try {
        const data = await vipService.confirmVipBinding(ctx.body.userVipId, ctx.body.confirm)
        return R.ok(data, ctx.body.confirm ? '绑定确认成功' : '绑定已取消')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: t.Object({
        userVipId: t.Number({ description: '用户 VIP ID' }),
        confirm: t.Boolean({ description: '是否确认绑定' }),
      }),
      response: {
        200: SuccessResponse(vipService.getUserVipSchema(), '用户 VIP 信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '确认 VIP 绑定',
        description: '确认或取消 VIP 绑定\n\n🔐 **所需权限**: `vip:admin:user:confirm`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:confirm'] } },
        operLog: { title: '用户VIP', type: 'update' },
      },
    },
  )

  .post(
    '/cancel/:userId',
    async (ctx) => {
      try {
        await vipService.cancelUserVip(ctx.params.userId)
        return R.ok(null, 'VIP 已取消')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户 ID' }) }),
      response: { 200: MessageResponse, 400: ErrorResponse },
      detail: {
        summary: '取消用户 VIP',
        description: '取消用户的 VIP，恢复原角色\n\n🔐 **所需权限**: `vip:admin:user:cancel`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:user:cancel'] } },
        operLog: { title: '用户VIP', type: 'delete' },
      },
    },
  )

  // ============ 资源使用管理 ============

  .post(
    '/resource/check',
    async (ctx) => {
      const data = await vipService.checkResourceUsage(
        ctx.body.userId,
        ctx.body.resourceKey,
        ctx.body.amount,
      )
      return R.ok(data)
    },
    {
      body: t.Object({
        userId: t.Number({ description: '用户 ID' }),
        resourceKey: t.String({ description: '资源键' }),
        amount: t.Optional(t.Number({ description: '需要使用的数量，默认1', default: 1 })),
      }),
      response: {
        200: SuccessResponse(
          t.Object({
            resourceKey: t.String(),
            currentUsage: t.Number(),
            limitValue: t.Number(),
            available: t.Number(),
            canUse: t.Boolean(),
          }),
          '资源检查结果',
        ),
      },
      detail: {
        summary: '检查资源使用',
        description: '检查用户是否可以使用某资源\n\n🔐 **所需权限**: `vip:admin:resource:check`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource:check'] } },
      },
    },
  )

  .post(
    '/resource/increment',
    async (ctx) => {
      try {
        const data = await vipService.incrementResourceUsage(
          ctx.body.userId,
          ctx.body.resourceKey,
          ctx.body.amount,
        )
        return R.ok(data, '资源使用已增加')
      } catch (error: any) {
        return R.badRequest(error.message)
      }
    },
    {
      body: t.Object({
        userId: t.Number({ description: '用户 ID' }),
        resourceKey: t.String({ description: '资源键' }),
        amount: t.Optional(t.Number({ description: '增加数量，默认1', default: 1 })),
      }),
      response: {
        200: SuccessResponse(
          t.Object({
            resourceKey: t.String(),
            currentUsage: t.Number(),
            limitValue: t.Number(),
            available: t.Number(),
            canUse: t.Boolean(),
          }),
          '资源使用结果',
        ),
        400: ErrorResponse,
      },
      detail: {
        summary: '增加资源使用',
        description: '增加用户的资源使用量\n\n🔐 **所需权限**: `vip:admin:resource:increment`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource:increment'] } },
        operLog: { title: '资源使用', type: 'update' },
      },
    },
  )

  .get(
    '/resource/usage/:userId',
    async (ctx) => {
      const data = await vipService.getUserResourceUsages(ctx.params.userId)
      return R.ok(data)
    },
    {
      params: t.Object({ userId: t.Numeric({ description: '用户 ID' }) }),
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              resourceKey: t.String(),
              currentUsage: t.Number(),
              limitValue: t.Number(),
              available: t.Number(),
              canUse: t.Boolean(),
            }),
          ),
          '用户资源使用列表',
        ),
      },
      detail: {
        summary: '获取用户资源使用情况',
        description: '获取用户所有资源的使用情况\n\n🔐 **所需权限**: `vip:admin:resource:usage`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['vip:admin:resource:usage'] } },
      },
    },
  )
