import { Elysia } from 'elysia'
import { Glob } from 'bun'
import { join } from 'path'

// 确保 model 在动态导入 API 文件之前完成初始化
import '@/core/model'

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

// 使用 glob 自动加载所有 controller
const glob = new Glob('**/*.ts')
const apiFiles: string[] = []
const path = join(import.meta.dir, '../api')
for await (const file of glob.scan({
  cwd: path,
})) {
  apiFiles.push(file)
}

// 动态导入所有 controller
const controllers = await Promise.all(
  apiFiles.map(async (file) => {
    const module = await import(join(path, file)).then((mod) => mod.default || mod)
    return { file, controller: new Elysia({ prefix: fileToPrefix(file) }).use(module) }
  }),
)

// 分类 controller
const clientControllers: any[] = []

for (const { controller } of controllers) {
  if (controller && typeof controller === 'object' && controller.constructor?.name === 'Elysia') {
    clientControllers.push(controller)
  }
}

/** 创建 API 路由 */
export const createApi = () => {
  const app = new Elysia({})

  // 自动注册所有客户端 controller
  for (const controller of clientControllers) {
    app.use(controller)
  }

  return app
}
