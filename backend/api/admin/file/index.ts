import { Elysia, t } from 'elysia'
import * as fileService from '@/services/file'
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
import { filePlugin } from '@/plugins/file'
import { operLogPlugin } from '@/plugins/oper-log'

export default new Elysia()
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(filePlugin())
  .use(operLogPlugin())
  .get(
    '/',
    async (ctx) => {
      const result = await fileService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(fileService.getSchema(), '文件列表') },
      detail: {
        summary: '获取文件列表',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['file:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async (ctx) => {
      const data = await fileService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('文件')
      return R.ok(data)
    },
    {
      params: idParams({ label: '文件ID' }),
      response: { 200: SuccessResponse(fileService.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '获取文件详情',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['file:admin:read'] } },
      },
    },
  )

  .post(
    '/upload',
    async (ctx) => {
      const file = ctx.body.file
      const storageType = ctx.body.storageType || 'local'

      let result
      if (storageType === 's3') {
        result = await fileService.uploadS3(file, ctx.userId!, ctx)
      } else {
        result = await fileService.uploadLocal(file, ctx.userId!, ctx)
      }
      if (!result) return R.forbidden('无权操作')
      return R.ok(result, '上传成功')
    },
    {
      body: t.Object({
        file: t.File({ description: '上传的文件' }),
        storageType: t.Optional(t.String({ description: '存储类型：local/s3', default: 'local' })),
      }),
      response: { 200: SuccessResponse(fileService.getSchema()), 400: ErrorResponse },
      detail: {
        summary: '上传文件',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['file:admin:upload'] } },
        operLog: { title: '文件管理', type: 'create' },
      },
    },
  )

  .delete(
    '/:id',
    async (ctx) => {
      const ok = await fileService.remove(ctx.params.id, ctx)
      if (!ok) return R.forbidden('无权操作该记录')
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '文件ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除文件',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['file:admin:delete'] } },
        operLog: { title: '文件管理', type: 'delete' },
      },
    },
  )
