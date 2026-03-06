import { Elysia, t } from 'elysia'
import * as fileService from '@/services/file'
import { idParams } from '@/packages/route-model'
import { R, SuccessResponse, ErrorResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { filePlugin } from '@/plugins/file'
import { model } from '@/core/model'

export default new Elysia()
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
      response: { 200: SuccessResponse(model.sys_file.getSchema()), 400: ErrorResponse },
      detail: {
        summary: '上传文件',
        description: '上传文件到本地存储',
        security: [{ bearerAuth: [] }],
      },
    },
  )
