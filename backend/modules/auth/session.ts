/**
 * 会话管理 - 内存中管理登录 token
 */

import { randomBytes } from "crypto";

/** 会话信息 */
export interface Session {
  /** 会话 ID (token) */
  token: string;
  /** 用户 ID */
  userId: number;
  /** 用户名 */
  username: string;
  /** 角色 ID */
  roleId: number;
  /** 创建时间 */
  createdAt: Date;
  /** 过期时间 */
  expiresAt: Date;
  /** 最后活跃时间 */
  lastActiveAt: Date;
  /** IP 地址 */
  ip?: string;
  /** User-Agent */
  userAgent?: string;
}

/** 会话存储 */
class SessionStore {
  /** token -> Session */
  private sessions = new Map<string, Session>();
  /** userId -> Set<token> (一个用户可以有多个会话) */
  private userSessions = new Map<number, Set<string>>();
  /** 默认会话有效期 (毫秒) - 24小时 */
  private defaultTTL = 24 * 60 * 60 * 1000;
  /** 清理定时器 */
  private cleanupTimer: Timer | null = null;

  constructor() {
    // 每分钟清理过期会话
    this.cleanupTimer = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /** 生成 token */
  generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  /** 创建会话 */
  create(data: {
    userId: number;
    username: string;
    roleId: number;
    ip?: string;
    userAgent?: string;
    ttl?: number;
  }): Session {
    const token = this.generateToken();
    const now = new Date();
    const ttl = data.ttl ?? this.defaultTTL;

    const session: Session = {
      token,
      userId: data.userId,
      username: data.username,
      roleId: data.roleId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      lastActiveAt: now,
      ip: data.ip,
      userAgent: data.userAgent,
    };

    // 存储会话
    this.sessions.set(token, session);

    // 关联用户
    let userTokens = this.userSessions.get(data.userId);
    if (!userTokens) {
      userTokens = new Set();
      this.userSessions.set(data.userId, userTokens);
    }
    userTokens.add(token);

    return session;
  }

  /** 获取会话 */
  get(token: string): Session | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;

    // 检查是否过期
    if (session.expiresAt < new Date()) {
      this.delete(token);
      return undefined;
    }

    // 更新最后活跃时间
    session.lastActiveAt = new Date();
    return session;
  }

  /** 验证 token 并返回会话 */
  verify(token: string): Session | null {
    const session = this.get(token);
    return session ?? null;
  }

  /** 删除会话 */
  delete(token: string): boolean {
    const session = this.sessions.get(token);
    if (!session) return false;

    // 从用户会话列表中移除
    const userTokens = this.userSessions.get(session.userId);
    if (userTokens) {
      userTokens.delete(token);
      if (userTokens.size === 0) {
        this.userSessions.delete(session.userId);
      }
    }

    // 删除会话
    this.sessions.delete(token);
    return true;
  }

  /** 获取用户的所有会话 */
  getUserSessions(userId: number): Session[] {
    const tokens = this.userSessions.get(userId);
    if (!tokens) return [];

    const sessions: Session[] = [];
    for (const token of tokens) {
      const session = this.sessions.get(token);
      if (session && session.expiresAt >= new Date()) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  /** 踢用户下线（删除该用户的所有会话） */
  kickUser(userId: number): number {
    const tokens = this.userSessions.get(userId);
    if (!tokens) return 0;

    const count = tokens.size;
    for (const token of tokens) {
      this.sessions.delete(token);
    }
    this.userSessions.delete(userId);

    return count;
  }

  /** 踢指定会话下线 */
  kickSession(token: string): boolean {
    return this.delete(token);
  }

  /** 续期会话 */
  refresh(token: string, ttl?: number): Session | null {
    const session = this.get(token);
    if (!session) return null;

    const newTTL = ttl ?? this.defaultTTL;
    session.expiresAt = new Date(Date.now() + newTTL);
    session.lastActiveAt = new Date();

    return session;
  }

  /** 获取所有在线用户数 */
  getOnlineUserCount(): number {
    return this.userSessions.size;
  }

  /** 获取所有会话数 */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /** 获取所有会话（管理用） */
  getAllSessions(): Session[] {
    const now = new Date();
    return Array.from(this.sessions.values()).filter(
      (s) => s.expiresAt >= now
    );
  }

  /** 清理过期会话 */
  cleanup(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [token, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.delete(token);
        cleaned++;
      }
    }

    return cleaned;
  }

  /** 销毁存储 */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.sessions.clear();
    this.userSessions.clear();
  }
}

/** 全局会话存储实例 */
export const sessionStore = new SessionStore();
