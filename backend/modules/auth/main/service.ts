/**
 * 认证服务
 */

import { where } from '@pkg/ssql'
import User from '@/models/users'
import type { UserInsert } from '@/models/users'
import { sessionStore, type Session } from './session'

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
    roleId: number
  }
}

/** 注册结果 */
export interface RegisterResult {
  success: boolean
  message: string
  userId?: number
}

/** 认证服务 */
export class AuthService {
  /** 密码哈希 */
  async hashPassword(password: string): Promise<string> {
    // 使用 Bun 内置的密码哈希
    return await Bun.password.hash(password)
  }

  /** 验证密码 */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await Bun.password.verify(password, hash)
  }

  /** 用户登录 */
  async login(
    username: string,
    password: string,
    options?: { ip?: string; userAgent?: string },
  ): Promise<LoginResult> {
    // 查找用户
    const user = await User.findOne({ where: where().eq('username', username) })
    if (!user) {
      return { success: false, message: '用户名或密码错误' }
    }

    // 检查用户状态
    if (user.status !== 1) {
      return { success: false, message: '用户已被禁用' }
    }

    // 验证密码
    const valid = await this.verifyPassword(password, user.password)
    if (!valid) {
      return { success: false, message: '用户名或密码错误' }
    }

    // 创建会话
    const session = await sessionStore.create({
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      ip: options?.ip,
      userAgent: options?.userAgent,
    })

    return {
      success: true,
      message: '登录成功',
      token: session.token,
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
  async register(data: {
    username: string
    password: string
    nickname?: string
    email?: string
    phone?: string
    roleId?: number
  }): Promise<RegisterResult> {
    // 检查用户名是否已存在
    const existing = await User.findOne({
      where: where().eq('username', data.username),
    })
    if (existing) {
      return { success: false, message: '用户名已存在' }
    }

    // 检查邮箱是否已存在
    if (data.email) {
      const emailExists = await User.findOne({
        where: where().eq('email', data.email),
      })
      if (emailExists) {
        return { success: false, message: '邮箱已被使用' }
      }
    }

    // 哈希密码
    const hashedPassword = await this.hashPassword(data.password)

    // 创建用户
    const userData: UserInsert = {
      username: data.username,
      password: hashedPassword,
      nickname: data.nickname ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      avatar: null,
      status: 1,
      roleId: data.roleId ?? 1, // 默认角色 ID
    }

    const user = await User.create(userData)

    return {
      success: true,
      message: '注册成功',
      userId: user.id,
    }
  }

  /** 用户登出 */
  async logout(token: string): Promise<boolean> {
    return sessionStore.delete(token)
  }

  /** 验证 token */
  verifyToken(token: string): Session | null {
    return sessionStore.verify(token)
  }

  /** 获取当前用户信息 */
  async getCurrentUser(token: string) {
    const session = sessionStore.verify(token)
    if (!session) return null

    const user = await User.findOne({ where: where().eq('id', session.userId) })
    if (!user) return null

    // 不返回密码
    const { password, ...userWithoutPassword } = user
    return {
      ...userWithoutPassword,
      session: {
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        lastActiveAt: session.lastActiveAt,
      },
    }
  }

  /** 修改密码 */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await User.findOne({ where: where().eq('id', userId) })
    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    // 验证旧密码
    const valid = await this.verifyPassword(oldPassword, user.password)
    if (!valid) {
      return { success: false, message: '原密码错误' }
    }

    // 哈希新密码
    const hashedPassword = await this.hashPassword(newPassword)

    // 更新密码
    await User.update(userId, { password: hashedPassword })

    // 踢掉该用户的所有会话（可选：让用户重新登录）
    // sessionStore.kickUser(userId);

    return { success: true, message: '密码修改成功' }
  }

  /** 刷新 token */
  async refreshToken(token: string): Promise<Session | null> {
    return sessionStore.refresh(token)
  }

  /** 获取用户的所有会话 */
  getUserSessions(userId: number): Session[] {
    return sessionStore.getUserSessions(userId)
  }

  /** 踢用户下线 */
  async kickUser(userId: number): Promise<number> {
    return sessionStore.kickUser(userId)
  }

  /** 踢指定会话下线 */
  async kickSession(token: string): Promise<boolean> {
    return sessionStore.kickSession(token)
  }

  /** 获取在线统计 */
  getOnlineStats() {
    return sessionStore.getStats()
  }

  /** 获取所有会话（管理用） */
  getAllSessions(): Session[] {
    return sessionStore.getAllSessions()
  }
}

export const authService = new AuthService()
