import { Elysia, t } from 'elysia'
import { fileService } from './service'
import { idParams } from '@/packages/route-model'
import { R, SuccessResponse, ErrorResponse } from '@/modules/response'
import { authPlugin } from '@/modules/auth'
import { rbacPlugin } from '@/modules/rbac'
import { vipPlugin } from '@/modules/vip'
import { filePlugin } from './plugin'
import SysFile from '@/models/sys-file'

/** 文件客户端控制器 */
export const fileController = new Elysia({ prefix: '/file', tags: ['客户端 - 文件'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(filePlugin())
  /** 上传文件 */
  .post(
    '/upload',
    async ({ body, userId }) => {
      if (!userId) return R.unauthorized()
      const file = body.file
      const result = await fileService.uploadLocal(file, userId)
      return R.ok(result, '上传成功')
    },
    {
      body: t.Object({
        file: t.File({ description: '上传的文件' }),
      }),
      response: { 200: SuccessResponse(SysFile.getSchema()), 400: ErrorResponse },
      detail: {
        summary: '上传文件',
        description: '上传文件到本地存储',
        security: [{ bearerAuth: [] }],
      },
    },
  )
