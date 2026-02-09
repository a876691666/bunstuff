import { Elysia, t } from 'elysia'
import { fileService } from './service'
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
import { filePlugin } from './plugin'
import { operLogPlugin } from '@/modules/system'
import SysFile from '@/models/sys-file'

/** 文件管理控制器（管理端） */
export const fileAdminController = new Elysia({ prefix: '/file', tags: ['管理 - 文件管理'] })
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
      response: { 200: PagedResponse(SysFile.getSchema(), '文件列表') },
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
      response: { 200: SuccessResponse(SysFile.getSchema()), 404: ErrorResponse },
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
      response: { 200: SuccessResponse(SysFile.getSchema()), 400: ErrorResponse },
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
      const ok = await fileService.delete(ctx.params.id, ctx)
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
