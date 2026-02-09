import LoginLog from '@/models/login-log'
import { CrudService } from '@/modules/crud-service'

/** 登录日志操作类型 */
export type LoginAction = 'login' | 'logout' | 'kick'

/** 登录日志服务 */
export class LoginLogService extends CrudService<typeof LoginLog.schema> {
  constructor() {
    super(LoginLog)
  }

  /** 清空登录日志 */
  async clear() {
    return await this.model.truncate()
  }

  /** 记录登录日志 */
  async log(data: {
    userId?: number | null
    username: string
    ip?: string | null
    userAgent?: string | null
    status: 0 | 1
    action: LoginAction
    msg?: string | null
  }) {
    // 解析 User-Agent
    const { browser, os } = this.parseUserAgent(data.userAgent)

    return await LoginLog.create({
      userId: data.userId || null,
      username: data.username,
      ip: data.ip || null,
      location: null, // 可以后续集成IP地址库
      browser,
      os,
      status: data.status,
      action: data.action,
      msg: data.msg || null,
      loginTime: new Date(),
    })
  }

  /** 解析 User-Agent */
  private parseUserAgent(userAgent?: string | null): { browser: string | null; os: string | null } {
    if (!userAgent) return { browser: null, os: null }

    let browser = null
    let os = null

    // 简单的 User-Agent 解析
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
}

export const loginLogService = new LoginLogService()
