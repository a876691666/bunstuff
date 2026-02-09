import { Elysia, t } from 'elysia'
import { ipBlacklistService, rateLimitCache } from './service'
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
import IpBlacklist from '@/models/ip-blacklist'

export const ipBlacklistAdminController = new Elysia({
  prefix: '/ip-blacklist',
  tags: ['管理 - IP黑名单'],
})
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  // GET / - 列表
  .get(
    '/',
    async (ctx) => {
      const result = await ipBlacklistService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(IpBlacklist.getSchema(), 'IP黑名单列表') },
      detail: {
        summary: '获取IP黑名单列表',
        description: '分页获取IP黑名单\n\n🔐 **所需权限**: `rateLimit:admin:blacklist:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:blacklist:list'] } },
      },
    },
  )

  // GET /:id - 详情
  .get(
    '/:id',
    async (ctx) => {
      const data = await ipBlacklistService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('黑名单记录')
      return R.ok(data)
    },
    {
      params: idParams({ label: 'IP黑名单ID' }),
      response: {
        200: SuccessResponse(IpBlacklist.getSchema(), 'IP黑名单详情'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取黑名单详情',
        description: '根据ID获取IP黑名单详情\n\n🔐 **所需权限**: `rateLimit:admin:blacklist:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:blacklist:read'] } },
      },
    },
  )

  // POST / - 手动添加黑名单
  .post(
    '/',
    async (ctx) => {
      const existing = await ipBlacklistService.findByIp(ctx.body.ip)
      if (existing) return R.badRequest('该IP已在黑名单中')
      const data = await ipBlacklistService.create({
        ...ctx.body,
        source: 'manual',
        triggerCount: 0,
      }, ctx)
      return R.ok(data, '添加成功')
    },
    {
      body: IpBlacklist.getSchema({
        exclude: ['id', 'source', 'ruleId', 'triggerCount'],
        required: ['ip'],
      }),
      response: {
        200: SuccessResponse(IpBlacklist.getSchema(), '新增的黑名单记录'),
        400: ErrorResponse,
      },
      detail: {
        summary: '添加IP黑名单',
        description: '手动添加IP到黑名单\n\n🔐 **所需权限**: `rateLimit:admin:blacklist:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:blacklist:create'] } },
        operLog: { title: 'IP黑名单', type: 'create' },
      },
    },
  )

  // PUT /:id - 更新黑名单
  .put(
    '/:id',
    async (ctx) => {
      const existing = await ipBlacklistService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('黑名单记录')
      const data = await ipBlacklistService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: 'IP黑名单ID' }),
      body: IpBlacklist.getSchema({
        exclude: ['id', 'source', 'ruleId', 'triggerCount'],
        partial: true,
      }),
      response: {
        200: SuccessResponse(IpBlacklist.getSchema(), '更新后的黑名单记录'),
        404: ErrorResponse,
      },
      detail: {
        summary: '更新黑名单记录',
        description: '更新IP黑名单信息\n\n🔐 **所需权限**: `rateLimit:admin:blacklist:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:blacklist:update'] } },
        operLog: { title: 'IP黑名单', type: 'update' },
      },
    },
  )

  // DELETE /:id - 删除
  .delete(
    '/:id',
    async (ctx) => {
      const existing = await ipBlacklistService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('黑名单记录')
      await ipBlacklistService.delete(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: 'IP黑名单ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除黑名单记录',
        description: '永久删除IP黑名单记录\n\n🔐 **所需权限**: `rateLimit:admin:blacklist:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:blacklist:delete'] } },
        operLog: { title: 'IP黑名单', type: 'delete' },
      },
    },
  )

  // POST /:id/unblock - 解封
  .post(
    '/:id/unblock',
    async ({ params }) => {
      const result = await ipBlacklistService.unblock(params.id)
      if (!result) return R.notFound('黑名单记录')
      return R.success('解封成功')
    },
    {
      params: idParams({ label: 'IP黑名单ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '解封IP',
        description: '解除IP封禁\n\n🔐 **所需权限**: `rateLimit:admin:blacklist:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:blacklist:update'] } },
        operLog: { title: 'IP黑名单', type: 'update' },
      },
    },
  )

  // POST /reload - 重载黑名单缓存
  .post(
    '/reload',
    async () => {
      await rateLimitCache.reloadBlacklist()
      return R.success('黑名单缓存已重载')
    },
    {
      response: { 200: MessageResponse },
      detail: {
        summary: '重载黑名单缓存',
        description: '从数据库重新加载黑名单到内存\n\n🔐 **所需权限**: `rateLimit:admin:blacklist:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['rateLimit:admin:blacklist:update'] } },
      },
    },
  )
