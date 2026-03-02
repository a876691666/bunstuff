/**
 * 参数配置客户端控制器
 * 从 modules/system/config/api_client.ts 迁移
 */

import { Elysia, t } from 'elysia'
import * as configService from '@/services/sys-config'
import { R, SuccessResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { configPlugin } from '@/plugins/config'

export default new Elysia({ tags: ['客户端 - 参数配置'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(configPlugin())

  /** 根据键名获取参数值 */
  .get(
    '/key/:key',
    async ({ params }) => {
      const value = configService.getConfigValue(params.key)
      return R.ok({ key: params.key, value })
    },
    {
      params: t.Object({ key: t.String({ description: '参数键名' }) }),
      response: {
        200: SuccessResponse(
          t.Object({
            key: t.String({ description: '参数键名' }),
            value: t.Nullable(t.String({ description: '参数值' })),
          }),
        ),
      },
      detail: {
        summary: '根据键名获取参数值',
        description: '从缓存获取指定键名的参数值',
      },
    },
  )

  /** 批量获取多个参数值 */
  .post(
    '/batch',
    async ({ body }) => {
      const result: Record<string, string | null> = {}
      for (const key of body.keys) {
        result[key] = configService.getConfigValue(key)
      }
      return R.ok(result)
    },
    {
      body: t.Object({
        keys: t.Array(t.String({ description: '参数键名列表' })),
      }),
      response: { 200: SuccessResponse(t.Record(t.String(), t.Nullable(t.String()))) },
      detail: {
        summary: '批量获取参数值',
        description: '批量获取多个参数的值（从缓存读取）',
      },
    },
  )
