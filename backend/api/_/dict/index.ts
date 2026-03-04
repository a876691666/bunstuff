import { Elysia, t } from 'elysia'
import * as dictService from '@/services/dict'
import { R, SuccessResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { dictPlugin } from '@/plugins/dict'

export default new Elysia()
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(dictPlugin())

  /** 根据字典类型获取字典数据 */
  .get(
    '/type/:dictType',
    async ({ params }) => {
      const data = await dictService.findDataByType(params.dictType)
      return R.ok(data)
    },
    {
      params: t.Object({ dictType: t.String({ description: '字典类型' }) }),
      response: { 200: SuccessResponse(t.Array(dictService.getDataSchema())) },
      detail: {
        summary: '根据字典类型获取字典数据',
        description: '获取指定字典类型下的所有启用的字典数据',
      },
    },
  )

  /** 批量获取多个字典类型的数据 */
  .post(
    '/batch',
    async ({ body }) => {
      const result: Record<string, any[]> = {}
      for (const dictType of body.types) {
        result[dictType] = dictService.getDictList(dictType)
      }
      return R.ok(result)
    },
    {
      body: t.Object({
        types: t.Array(t.String({ description: '字典类型列表' })),
      }),
      response: {
        200: SuccessResponse(t.Record(t.String(), t.Array(dictService.getDataSchema()))),
      },
      detail: {
        summary: '批量获取字典数据',
        description: '批量获取多个字典类型的数据（从缓存读取）',
      },
    },
  )
