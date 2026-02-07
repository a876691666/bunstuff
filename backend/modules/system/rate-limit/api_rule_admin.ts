import { Elysia } from 'elysia'
import { rateLimitRuleService, rateLimitCache, rateLimitCounter } from './service'
import { idParams, query } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/modules/response'
import { authPlugin } from '@/modules/auth'
import { rbacPlugin } from '@/modules/rbac'
import { vipPlugin } from '@/modules/vip'
import { operLogPlugin } from '../oper-log/plugin'
import RateLimitRule from '@/models/rate-limit-rule'

export const rateLimitRuleAdminController = new Elysia({
  prefix: '/rate-limit-rule',
  tags: ['管理 - 限流规则'],
})
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  // GET / - 列表
  .get(
    '/',
    async ({ query }) => {
      const result = await rateLimitRuleService.findAll(query)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(RateLimitRule.getSchema(), '限流规则列表') },
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
      const stats = rateLimitRuleService.getStats()
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
    async ({ params }) => {
      const data = await rateLimitRuleService.findById(params.id)
      if (!data) return R.notFound('限流规则')
      return R.ok(data)
    },
    {
      params: idParams({ label: '限流规则ID' }),
      response: {
        200: SuccessResponse(RateLimitRule.getSchema(), '限流规则详情'),
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
    async ({ body }) => {
      const existing = await rateLimitRuleService.findByCode(body.code)
      if (existing) return R.badRequest('规则编码已存在')
      const data = await rateLimitRuleService.create(body)
      return R.ok(data, '创建成功')
    },
    {
      body: RateLimitRule.getSchema({
        exclude: ['id'],
        required: ['name', 'code', 'mode', 'pathPattern'],
      }),
      response: {
        200: SuccessResponse(RateLimitRule.getSchema(), '新创建的限流规则'),
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
    async ({ params, body }) => {
      const existing = await rateLimitRuleService.findById(params.id)
      if (!existing) return R.notFound('限流规则')
      if (body.code && body.code !== existing.code) {
        const codeExists = await rateLimitRuleService.findByCode(body.code)
        if (codeExists) return R.badRequest('规则编码已存在')
      }
      const data = await rateLimitRuleService.update(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '限流规则ID' }),
      body: RateLimitRule.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(RateLimitRule.getSchema(), '更新后的限流规则'),
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
    async ({ params }) => {
      const existing = await rateLimitRuleService.findById(params.id)
      if (!existing) return R.notFound('限流规则')
      await rateLimitRuleService.delete(params.id)
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
      await rateLimitCache.reloadRules()
      return R.success('缓存已重载')
    },
    {
      response: { 200: MessageResponse },
      detail: {
        summary: '重载限流规则缓存',
        description: '从数据库重新加载限流规则到内存\n\n🔐 **所需权限**: `rateLimit:admin:rule:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:rule:update'] } },
      },
    },
  )
