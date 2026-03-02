/**
 * 限流规则管理控制器（管理端）
 * 从 modules/system/rate-limit/api_rule_admin.ts 迁移
 */

import { Elysia } from 'elysia'
import * as rateLimitService from '@/services/rate-limit'
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

export default new Elysia({ tags: ['管理 - 限流规则'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  // GET / - 列表
  .get(
    '/',
    async (ctx) => {
      const result = await rateLimitService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(rateLimitService.getRuleSchema(), '限流规则列表') },
      detail: {
        summary: '获取限流规则列表',
        description: '分页获取限流规则列表\n\n🔐 **所需权限**: `rateLimit:admin:rule:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:rule:list'] } },
      },
    },
  )

  // GET /stats - 统计信息
  .get(
    '/stats',
    async () => {
      const stats = rateLimitService.getStats()
      return R.ok(stats)
    },
    {
      detail: {
        summary: '获取限流统计',
        description: '获取限流计数器统计信息\n\n🔐 **所需权限**: `rateLimit:admin:rule:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:rule:list'] } },
      },
    },
  )

  // GET /:id - 详情
  .get(
    '/:id',
    async (ctx) => {
      const data = await rateLimitService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('限流规则')
      return R.ok(data)
    },
    {
      params: idParams({ label: '限流规则ID' }),
      response: {
        200: SuccessResponse(rateLimitService.getRuleSchema(), '限流规则详情'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取限流规则详情',
        description: '根据ID获取限流规则详情\n\n🔐 **所需权限**: `rateLimit:admin:rule:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:rule:read'] } },
      },
    },
  )

  // POST / - 创建
  .post(
    '/',
    async (ctx) => {
      const existing = await rateLimitService.findByCode(ctx.body.code)
      if (existing) return R.badRequest('规则编码已存在')
      const data = await rateLimitService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: rateLimitService.getRuleSchema({
        exclude: ['id'],
        required: ['name', 'code', 'mode', 'pathPattern'],
      }),
      response: {
        200: SuccessResponse(rateLimitService.getRuleSchema(), '新创建的限流规则'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建限流规则',
        description: '创建新限流规则\n\n🔐 **所需权限**: `rateLimit:admin:rule:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:rule:create'] } },
        operLog: { title: '限流规则', type: 'create' },
      },
    },
  )

  // PUT /:id - 更新
  .put(
    '/:id',
    async (ctx) => {
      const existing = await rateLimitService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('限流规则')
      if (ctx.body.code && ctx.body.code !== existing.code) {
        const codeExists = await rateLimitService.findByCode(ctx.body.code)
        if (codeExists) return R.badRequest('规则编码已存在')
      }
      const data = await rateLimitService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '限流规则ID' }),
      body: rateLimitService.getRuleSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(rateLimitService.getRuleSchema(), '更新后的限流规则'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新限流规则',
        description: '更新限流规则信息\n\n🔐 **所需权限**: `rateLimit:admin:rule:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:rule:update'] } },
        operLog: { title: '限流规则', type: 'update' },
      },
    },
  )

  // DELETE /:id - 删除
  .delete(
    '/:id',
    async (ctx) => {
      const existing = await rateLimitService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('限流规则')
      await rateLimitService.remove(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '限流规则ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除限流规则',
        description: '删除限流规则\n\n🔐 **所需权限**: `rateLimit:admin:rule:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:rule:delete'] } },
        operLog: { title: '限流规则', type: 'delete' },
      },
    },
  )

  // POST /reload - 重载缓存
  .post(
    '/reload',
    async () => {
      await rateLimitService.rateLimitCache.reloadRules()
      return R.success('缓存已重载')
    },
    {
      response: { 200: MessageResponse },
      detail: {
        summary: '重载限流规则缓存',
        description:
          '从数据库重新加载限流规则到内存\n\n🔐 **所需权限**: `rateLimit:admin:rule:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:rule:update'] } },
      },
    },
  )
