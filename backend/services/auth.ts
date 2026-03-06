import type { Insert } from '@/packages/orm'
import { model } from '@/core/model'
import * as session from './session'

const User = model.users

/** 登录结果 */
export interface LoginResult {
  token: string
  user: {
    id: number
    username: string
    nickname: string | null
    email: string | null
    avatar: string | null
    roleId: string
  }
}

/** 验证密码 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash)
}

/** 用户登录 */
export async function login(
  username: string,
  password: string,
  options?: { ip?: string; userAgent?: string },
): Promise<LoginResult> {
  // 查找用户
  const user = await User.findOne({ where: `username = '${username}'` })
  if (!user) {
    throw new Error('用户名或密码错误')
  }

  // 检查用户状态
  if (user.status !== 1) {
    throw new Error('用户已被禁用')
  }

  // 验证密码
  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    throw new Error('用户名或密码错误')
  }

  // 创建会话
  const sess = await session.create({
    userId: user.id,
    username: user.username,
    roleId: user.roleId,
    ip: options?.ip,
    userAgent: options?.userAgent,
  })

  return {
    token: sess.token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      roleId: user.roleId,
    },
  }
}

/** 用户注册 */
export async function register(data: {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  roleId?: string
}): Promise<{ userId: number }> {
  // 检查用户名是否已存在
  const existing = await User.findOne({
    where: `username = '${data.username}'`,
  })
  if (existing) {
    throw new Error('用户名已存在')
  }

  // 检查邮箱是否已存在
  if (data.email) {
    const emailExists = await User.findOne({
      where: `email = '${data.email}'`,
    })
    if (emailExists) {
      throw new Error('邮箱已被使用')
    }
  }

  // 创建用户
  const userData: Insert<typeof User> = {
    username: data.username,
    password: data.password, // 注意：这里应该在 User 模型层进行哈希处理
    nickname: data.nickname ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    avatar: null,
    status: 1,
    roleId: data.roleId ?? 'user', // 默认角色
  }

  const user = await User.create(userData)

  return { userId: user.id }
}

/** 获取当前用户信息 */
export async function getCurrentUser(token: string) {
  const sess = session.verify(token)
  if (!sess) return null

  const user = await User.findOne({ where: `id = ${sess.userId}` })
  if (!user) return null

  // 不返回密码
  const { password, ...userWithoutPassword } = user
  return {
    ...userWithoutPassword,
    session: {
      createdAt: sess.createdAt,
      expiresAt: sess.expiresAt,
      lastActiveAt: sess.lastActiveAt,
    },
  }
}

/** 修改密码 */
export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) {
    throw new Error('用户不存在')
  }

  // 验证旧密码
  const valid = await verifyPassword(oldPassword, user.password)
  if (!valid) {
    throw new Error('原密码错误')
  }

  // 更新密码
  await User.update(userId, { password: newPassword })

  // 踢掉该用户的所有会话（可选：让用户重新登录）
  // session.kickUser(userId);
}

/** 更新个人资料 */
export async function updateProfile(
  userId: number,
  data: { nickname?: string; email?: string | null; phone?: string | null; avatar?: string | null },
) {
  if (data.email) {
    const emailExists = await User.findOne({
      where: `email = '${data.email}' && id != ${userId}`,
    })
    if (emailExists) throw new Error('邮箱已被使用')
  }

  await User.update(userId, data)
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) throw new Error('用户不存在')

  const { password, ...rest } = user
  return rest
}
