/**
 * 认证服务
 */

import type { Insert } from '@/packages/orm'
import { model } from '@/core/model'
import * as session from './session'

const User = model.users

/** 登录结果 */
export interface LoginResult {
  success: boolean
  message: string
  token?: string
  user?: {
    id: number
    username: string
    nickname: string | null
    email: string | null
    avatar: string | null
    roleId: string
  }
}

/** 注册结果 */
export interface RegisterResult {
  success: boolean
  message: string
  userId?: number
}

/** 密码哈希 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password)
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
    return { success: false, message: '用户名或密码错误' }
  }

  // 检查用户状态
  if (user.status !== 1) {
    return { success: false, message: '用户已被禁用' }
  }

  // 验证密码
  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return { success: false, message: '用户名或密码错误' }
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
    success: true,
    message: '登录成功',
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
}): Promise<RegisterResult> {
  // 检查用户名是否已存在
  const existing = await User.findOne({
    where: `username = '${data.username}'`,
  })
  if (existing) {
    return { success: false, message: '用户名已存在' }
  }

  // 检查邮箱是否已存在
  if (data.email) {
    const emailExists = await User.findOne({
      where: `email = '${data.email}'`,
    })
    if (emailExists) {
      return { success: false, message: '邮箱已被使用' }
    }
  }

  // 哈希密码
  const hashedPassword = await hashPassword(data.password)

  // 创建用户
  const userData: Insert<typeof User> = {
    username: data.username,
    password: hashedPassword,
    nickname: data.nickname ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    avatar: null,
    status: 1,
    roleId: data.roleId ?? 'user', // 默认角色
  }

  const user = await User.create(userData)

  return {
    success: true,
    message: '注册成功',
    userId: user.id,
  }
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
): Promise<{ success: boolean; message: string }> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) {
    return { success: false, message: '用户不存在' }
  }

  // 验证旧密码
  const valid = await verifyPassword(oldPassword, user.password)
  if (!valid) {
    return { success: false, message: '原密码错误' }
  }

  // 哈希新密码
  const hashedPassword = await hashPassword(newPassword)

  // 更新密码
  await User.update(userId, { password: hashedPassword })

  // 踢掉该用户的所有会话（可选：让用户重新登录）
  // session.kickUser(userId);

  return { success: true, message: '密码修改成功' }
}
