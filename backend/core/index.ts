import { Elysia } from 'elysia'

// 确保 model 在 API 路由之前完成初始化
import '@/core/model'

// 使用编译时生成的静态路由注册表（替代运行时 Glob）
import { apiRoutes } from '../_generated/routes.generated'

/** 根据文件路径生成 API prefix，例如：
 *  admin\auth\index.ts → api/admin/auth
 *  _\auth\index.ts     → api/auth
 *  _\auth\login.ts     → api/auth/login
 */
export function fileToPrefix(file: string): string {
  const parts = file
    .replace(/\\/g, '/')
    .replace(/\.ts$/, '')
    .split('/')
    .filter((seg) => seg !== '_')

  if (parts.at(-1) === 'index') parts.pop()

  return `api/${parts.join('/')}`
}

// 使用编译时生成的静态导入注册所有 controller
const controllers = apiRoutes.map(({ prefix, module }) => ({
  controller: new Elysia({ prefix }).use(module),
}))

/** 创建 API 路由 */
export const createApi = () => {
  const app = new Elysia({})

  for (const { controller } of controllers) {
    app.use(controller)
  }

  return app
}
