import { model } from '@/core/model'
import { buildWhere, type CrudContext, type PageQuery } from '@/core/crud'

const LoginLog = model.login_log

export type LoginAction = 'login' | 'logout' | 'kick'

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return LoginLog.page({
    where: buildWhere(LoginLog.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return LoginLog.findOne({ where: buildWhere(LoginLog.tableName, `id = ${id}`, ctx) })
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(LoginLog.tableName, `id = ${id}`, ctx)
  return w ? (await LoginLog.deleteMany(w)) > 0 : false
}

export async function clear() {
  return await LoginLog.truncate()
}

export async function log(data: {
  userId?: number | null
  username: string
  ip?: string | null
  userAgent?: string | null
  status: 0 | 1
  action: LoginAction
  msg?: string | null
}) {
  const { browser, os } = parseUserAgent(data.userAgent)

  return await LoginLog.create({
    userId: data.userId || null,
    username: data.username,
    ip: data.ip || null,
    location: null,
    browser,
    os,
    status: data.status,
    action: data.action,
    msg: data.msg || null,
    loginTime: new Date(),
  })
}

function parseUserAgent(userAgent?: string | null): { browser: string | null; os: string | null } {
  if (!userAgent) return { browser: null, os: null }

  let browser = null
  let os = null

  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'IE'

  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'MacOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS'

  return { browser, os }
}

/** Schema 代理 */

