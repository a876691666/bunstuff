/**
 * Seed 模块统一导出
 */
import { Elysia, t } from 'elysia'
import { seedService } from './main/service'
import { registerSeeds } from './main/register'
import { R, SuccessResponse, MessageResponse, ErrorResponse } from '@/modules/response'

/** Seed 模块配置 */
export interface SeedModuleOptions {
  /** 是否在初始化时自动执行所有未执行的 Seeds，默认 false */
  autoRun?: boolean
}

/**
 * 独立的 Seed 执行函数，在服务启动前同步调用
 * 确保 seed 数据就绪后再加载缓存和启动服务
 */
export async function runSeeds(options: SeedModuleOptions = {}) {
  // 注册所有 Seeds
  registerSeeds()

  if (options.autoRun) {
    try {
      await seedService.autoRun()
      console.log('✅ Seeds executed')
    } catch (err) {
      console.error('[Seed] 自动执行失败:', err)
    }
  }
}

/** 创建 Seed 模块控制器（仅挂载 API 路由，不再自动执行 seed） */
export const createSeedController = (_options: SeedModuleOptions = {}) => {
  return (
    new Elysia({ prefix: '/seed', tags: ['管理 - Seed'] })
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
            description:
              '获取所有Seed的执行日志记录，包括成功和失败的记录\n\n🔐 **所需权限**: `seed:admin:logs`',
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
        async ({ params, query }) => {
          const result = await seedService.runSeed(params.name, query.force)
          return result.success ? R.success(result.message) : R.fail(result.message!)
        },
        {
          params: t.Object({
            name: t.String({ description: 'Seed名称' }),
          }),
          query: t.Object({
            force: t.Optional(
              t.Boolean({ description: '是否强制执行（忽略已执行状态），默认false' }),
            ),
          }),
          response: {
            200: MessageResponse,
          },
          detail: {
            summary: '执行单个Seed',
            description:
              '执行指定名称的Seed，可通过force参数强制重新执行\n\n🔐 **所需权限**: `seed:admin:run`',
            security: [{ bearerAuth: [] }],
            rbac: { scope: { permissions: ['seed:admin:run'] } },
          },
        },
      )

      /** 执行所有 Seeds */
      .post(
        '/run-all',
        async ({ query }) => {
          const result = await seedService.runAll(query.force)
          return R.ok(result, '执行完成')
        },
        {
          query: t.Object({
            force: t.Optional(
              t.Boolean({ description: '是否强制执行（忽略已执行状态），默认false' }),
            ),
          }),
          response: {
            200: SuccessResponse(
              t.Object({
                total: t.Number({ description: '总数' }),
                success: t.Number({ description: '成功数' }),
                failed: t.Number({ description: '失败数' }),
                skipped: t.Number({ description: '跳过数' }),
                results: t.Array(
                  t.Object({
                    name: t.String({ description: 'Seed名称' }),
                    success: t.Boolean({ description: '是否成功' }),
                    message: t.String({ description: '执行消息' }),
                  }),
                ),
              }),
              '批量执行结果统计',
            ),
          },
          detail: {
            summary: '执行所有Seeds',
            description:
              '执行所有未执行过的Seeds，可通过force参数强制重新执行所有\n\n🔐 **所需权限**: `seed:admin:run-all`',
            security: [{ bearerAuth: [] }],
            rbac: { scope: { permissions: ['seed:admin:run-all'] } },
          },
        },
      )

      /** 重置 Seed */
      .delete(
        '/reset/:name',
        async ({ params }) => {
          const success = await seedService.resetSeed(params.name)
          if (success) {
            return R.success('重置成功')
          }
          return R.notFound('Seed记录')
        },
        {
          params: t.Object({
            name: t.String({ description: 'Seed名称' }),
          }),
          response: {
            200: MessageResponse,
            404: ErrorResponse,
          },
          detail: {
            summary: '重置Seed',
            description:
              '删除指定Seed的执行记录，使其可以重新执行\n\n🔐 **所需权限**: `seed:admin:reset`',
            security: [{ bearerAuth: [] }],
            rbac: { scope: { permissions: ['seed:admin:reset'] } },
          },
        },
      )
  )
}

// 服务导出
export { seedService, SeedService } from './main/service'
export type { SeedDefinition } from './main/service'

// 注册导出
export { registerSeeds } from './main/register'
