import { randomBytes } from 'crypto'
import { where } from '@pkg/ssql'
import { model, type SessionRow, type SessionInsert, type SessionUpdate } from '@/core/model'

const SessionModel = model.session

/** 会话信息 */
export interface Session {
  /** 数据库 ID */
  id: number
  /** 会话 ID (token) */
  token: string
  /** 用户 ID */
  userId: number
  /** 用户名 */
  username: string
  /** 角色 ID（角色编码） */
  roleId: string
  /** 创建时间 */
  createdAt: Date
  /** 过期时间 */
  expiresAt: Date
  /** 最后活跃时间 */
  lastActiveAt: Date
  /** IP 地址 */
  ip?: string
  /** User-Agent */
  userAgent?: string
}

/** 确保值为 Date 对象 */
function ensureDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

/** 将数据库行转换为 Session 对象 */
function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    token: row.token,
    userId: row.userId,
    username: row.username,
    roleId: row.roleId,
    // 将字符串或 Date 转换为 Date 对象
    createdAt: ensureDate(row.createdAt),
    expiresAt: ensureDate(row.expiresAt),
    lastActiveAt: ensureDate(row.lastActiveAt),
    ip: row.ip ?? undefined,
    userAgent: row.userAgent ?? undefined,
  }
}

// ============ 模块级状态 ============

/** token -> Session */
const sessions = new Map<string, Session>()
/** userId -> Set<token> (一个用户可以有多个会话) */
const userSessions = new Map<number, Set<string>>()
/** 默认会话有效期 (毫秒) - 24小时 */
const DEFAULT_TTL = 24 * 60 * 60 * 1000
/** 清理定时器 */
let cleanupTimer: Timer | null = null
/** 是否已初始化 */
let initialized = false

// 启动定时清理（每分钟）
cleanupTimer = setInterval(() => cleanup(), 60 * 1000)

// ============ 内部工具 ============

/** 生成 token */
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/** 异步更新数据库（不阻塞主流程） */
function updateDatabaseAsync(id: number, data: SessionUpdate): void {
  SessionModel.update(id, data).catch((err) => {
    console.error('更新会话数据库失败:', err)
  })
}

/** 同步删除会话（内部使用，不 await 数据库） */
function deleteSync(token: string): boolean {
  const session = sessions.get(token)
  if (!session) return false

  const userTokens = userSessions.get(session.userId)
  if (userTokens) {
    userTokens.delete(token)
    if (userTokens.size === 0) {
      userSessions.delete(session.userId)
    }
  }

  sessions.delete(token)

  // 异步删除数据库记录
  SessionModel.delete(session.id).catch((err) => {
    console.error('删除会话数据库失败:', err)
  })

  return true
}

/** 清理数据库中的过期会话 */
async function cleanupDatabase(): Promise<number> {
  const now = new Date()
  const expiredRows = await SessionModel.findMany({
    where: where().lt('expiresAt', now.toISOString()),
  })

  for (const row of expiredRows) {
    await SessionModel.delete(row.id).catch((err) => {
      console.error('清理过期会话失败:', err)
    })
  }

  return expiredRows.length
}

// ============ 导出函数 ============

/** 初始化：从数据库加载会话到内存 */
export async function init(): Promise<void> {
  if (initialized) return

  console.log('📦 正在从数据库加载会话数据...')
  const now = new Date()

  // 先清理数据库中的过期会话
  await cleanupDatabase()

  // 加载所有有效会话
  const rows = await SessionModel.findMany({
    where: where().gte('expiresAt', now.toISOString()),
  })

  // 加载到内存
  for (const row of rows) {
    const session = rowToSession(row)
    sessions.set(session.token, session)

    let userTokens = userSessions.get(session.userId)
    if (!userTokens) {
      userTokens = new Set()
      userSessions.set(session.userId, userTokens)
    }
    userTokens.add(session.token)
  }

  initialized = true
  console.log(`✅ 已加载 ${rows.length} 个会话到内存`)
}

/** 创建会话 */
export async function create(data: {
  userId: number
  username: string
  roleId: string
  ip?: string
  userAgent?: string
  ttl?: number
}): Promise<Session> {
  const token = generateToken()
  const now = new Date()
  const ttl = data.ttl ?? DEFAULT_TTL

  const sessionData: SessionInsert = {
    token,
    userId: data.userId,
    username: data.username,
    roleId: data.roleId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + ttl),
    lastActiveAt: now,
    ip: data.ip ?? null,
    userAgent: data.userAgent ?? null,
  }

  // 先写入数据库
  const row = await SessionModel.create(sessionData)
  const session = rowToSession(row)

  // 再存储到内存
  sessions.set(token, session)

  // 关联用户
  let userTokens = userSessions.get(data.userId)
  if (!userTokens) {
    userTokens = new Set()
    userSessions.set(data.userId, userTokens)
  }
  userTokens.add(token)

  return session
}

/** 获取会话 */
export function get(token: string): Session | undefined {
  const session = sessions.get(token)
  if (!session) return undefined

  // 检查是否过期
  if (ensureDate(session.expiresAt) < new Date()) {
    remove(token)
    return undefined
  }

  // 更新最后活跃时间（异步更新数据库，不阻塞）
  const now = new Date()
  session.lastActiveAt = now
  updateDatabaseAsync(session.id, { lastActiveAt: now })

  return session
}

/** 验证 token 并返回会话 */
export function verify(token: string): Session | null {
  return get(token) ?? null
}

/** 删除会话（登出） */
export async function remove(token: string): Promise<boolean> {
  const session = sessions.get(token)
  if (!session) return false

  // 从用户会话列表中移除
  const userTokens = userSessions.get(session.userId)
  if (userTokens) {
    userTokens.delete(token)
    if (userTokens.size === 0) {
      userSessions.delete(session.userId)
    }
  }

  // 从内存中删除
  sessions.delete(token)

  // 从数据库中删除
  await SessionModel.delete(session.id).catch((err) => {
    console.error('删除会话数据库失败:', err)
  })

  return true
}

/** 续期会话 */
export async function refresh(token: string, ttl?: number): Promise<Session | null> {
  const session = get(token)
  if (!session) return null

  const newTTL = ttl ?? DEFAULT_TTL
  const now = new Date()
  session.expiresAt = new Date(now.getTime() + newTTL)
  session.lastActiveAt = now

  // 更新数据库
  await SessionModel.update(session.id, {
    expiresAt: session.expiresAt,
    lastActiveAt: session.lastActiveAt,
  }).catch((err) => {
    console.error('续期会话数据库失败:', err)
  })

  return session
}

/** 获取用户的所有会话 */
export function getUserSessions(userId: number): Session[] {
  const tokens = userSessions.get(userId)
  if (!tokens) return []

  const result: Session[] = []
  for (const token of tokens) {
    const session = sessions.get(token)
    if (session && ensureDate(session.expiresAt) >= new Date()) {
      result.push(session)
    }
  }
  return result
}

/** 踢用户下线（删除该用户的所有会话） */
export async function kickUser(userId: number): Promise<number> {
  const tokens = userSessions.get(userId)
  if (!tokens) return 0

  const count = tokens.size
  const tokenList = Array.from(tokens)

  for (const token of tokenList) {
    const session = sessions.get(token)
    if (session) {
      await SessionModel.delete(session.id).catch((err) => {
        console.error('删除会话数据库失败:', err)
      })
    }
    sessions.delete(token)
  }
  userSessions.delete(userId)

  return count
}

/** 踢指定会话下线 */
export async function kickSession(token: string): Promise<boolean> {
  return remove(token)
}

/** 获取所有在线用户数 */
export function getOnlineUserCount(): number {
  return userSessions.size || 0
}

/** 获取所有会话数 */
export function getSessionCount(): number {
  return sessions.size || 0
}

/** 获取统计信息 */
export function getStats() {
  const now = new Date()
  const allSessions = Array.from(sessions.values())

  // 计算有效会话数（未过期）
  const validSessions = allSessions.filter((s) => ensureDate(s.expiresAt) >= now)

  // 计算活跃会话（最近30分钟有活动）
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
  const activeSessions = validSessions.filter((s) => ensureDate(s.lastActiveAt) >= thirtyMinutesAgo)

  // 计算活跃用户数（去重）
  const activeUserIds = new Set(activeSessions.map((s) => s.userId))

  // 计算今日新登录数
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayNewSessions = validSessions.filter((s) => ensureDate(s.createdAt) >= todayStart)

  // 计算即将过期的会话（1小时内过期）
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const expiringSessions = validSessions.filter((s) => ensureDate(s.expiresAt) <= oneHourLater)

  return {
    onlineUsers: userSessions.size,
    totalSessions: validSessions.length,
    activeSessions: activeSessions.length,
    activeUsers: activeUserIds.size,
    todayNewSessions: todayNewSessions.length,
    expiringSessions: expiringSessions.length,
  }
}

/** 获取所有会话（管理用） */
export function getAllSessions(): Session[] {
  const now = new Date()
  return Array.from(sessions.values()).filter((s) => ensureDate(s.expiresAt) >= now)
}

/** 清理过期会话 */
export async function cleanup(): Promise<number> {
  const now = new Date()
  let cleaned = 0

  for (const [token, session] of sessions) {
    if (ensureDate(session.expiresAt) < now) {
      deleteSync(token)
      cleaned++
    }
  }

  return cleaned
}

/** 重新加载会话（从数据库同步到内存） */
export async function reload(): Promise<void> {
  sessions.clear()
  userSessions.clear()
  initialized = false
  await init()
}

/** 销毁存储 */
export function destroy(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
  sessions.clear()
  userSessions.clear()
}
