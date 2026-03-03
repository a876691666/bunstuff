import { Elysia, t } from 'elysia'
import * as seedService from '@/services/seed'
import { R, SuccessResponse, MessageResponse, ErrorResponse } from '@/services/response'

export default new Elysia({ tags: ['管理 - Seed'] })
  /** 获取所有 Seed 日志 */
  .get(
    '/logs',
    async () => {
      const data = await seedService.getLogs()
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              id: t.Number({ description: '日志ID' }),
              name: t.String({ description: 'Seed名称' }),
              status: t.String({ description: '执行状态：success/failed' }),
              message: t.Nullable(t.String({ description: '执行消息' })),
              executedAt: t.String({ description: '执行时间' }),
            }),
          ),
          'Seed执行日志列表',
        ),
      },
      detail: {
        summary: '获取Seed执行日志',
        description: '获取所有Seed的执行日志记录\n\n🔐 **所需权限**: `seed:admin:logs`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['seed:admin:logs'] } },
      },
    },
  )

  /** 获取所有注册的 Seeds */
  .get(
    '/registered',
    () => {
      const seeds = seedService.getRegisteredSeeds()
      const data = seeds.map((s) => ({
        name: s.name,
        description: s.description,
      }))
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              name: t.String({ description: 'Seed名称' }),
              description: t.Optional(t.String({ description: 'Seed描述' })),
            }),
          ),
          '已注册的Seed列表',
        ),
      },
      detail: {
        summary: '获取已注册的Seeds',
        description: '获取所有已注册的Seed列表及其描述\n\n🔐 **所需权限**: `seed:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['seed:admin:list'] } },
      },
    },
  )

  /** 执行单个 Seed */
  .post(
    '/run/:name',
    async (ctx) => {
      const result = await seedService.runSeed(ctx.params.name, ctx.query.force)
      return result.success ? R.success(result.message) : R.fail(result.message!)
    },
    {
      params: t.Object({ name: t.String({ description: 'Seed名称' }) }),
      query: t.Object({
        force: t.Optional(t.Boolean({ description: '是否强制执行（忽略已执行状态），默认false' })),
      }),
      response: { 200: MessageResponse },
      detail: {
        summary: '执行单个Seed',
        description: '执行指定名称的Seed\n\n🔐 **所需权限**: `seed:admin:run`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['seed:admin:run'] } },
      },
    },
  )

  /** 执行所有 Seeds */
  .post(
    '/run-all',
    async (ctx) => {
      const result = await seedService.runAll(ctx.query.force)
      return R.ok(result, '执行完成')
    },
    {
      query: t.Object({
        force: t.Optional(t.Boolean({ description: '是否强制执行（忽略已执行状态），默认false' })),
      }),
      response: {
        200: SuccessResponse(
          t.Object({
            total: t.Number(),
            success: t.Number(),
            failed: t.Number(),
            skipped: t.Number(),
            results: t.Array(
              t.Object({
                name: t.String(),
                success: t.Boolean(),
                message: t.String(),
              }),
            ),
          }),
          '批量执行结果统计',
        ),
      },
      detail: {
        summary: '执行所有Seeds',
        description: '执行所有未执行过的Seeds\n\n🔐 **所需权限**: `seed:admin:run-all`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['seed:admin:run-all'] } },
      },
    },
  )

  /** 重置 Seed */
  .delete(
    '/reset/:name',
    async (ctx) => {
      const success = await seedService.resetSeed(ctx.params.name)
      if (success) return R.success('重置成功')
      return R.notFound('Seed记录')
    },
    {
      params: t.Object({ name: t.String({ description: 'Seed名称' }) }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '重置Seed',
        description: '删除指定Seed的执行记录\n\n🔐 **所需权限**: `seed:admin:reset`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['seed:admin:reset'] } },
      },
    },
  )
