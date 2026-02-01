/**
 * 会话管理 - 内存中管理登录 token，同时持久化到数据库
 */

import { randomBytes } from "crypto";
import { where } from "@pkg/ssql";
import SessionModel, {
  type SessionRow,
  type SessionInsert,
  type SessionUpdate,
} from "../../models/session";

/** 会话信息 */
export interface Session {
  /** 数据库 ID */
  id: number;
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

/** 确保值为 Date 对象 */
function ensureDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
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
  };
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
  /** 是否已初始化 */
  private initialized = false;

  constructor() {
    // 每分钟清理过期会话
    this.cleanupTimer = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /** 初始化：从数据库加载会话到内存 */
  async init(): Promise<void> {
    if (this.initialized) return;

    console.log("📦 正在从数据库加载会话数据...");
    const now = new Date();

    // 先清理数据库中的过期会话
    await this.cleanupDatabase();

    // 加载所有有效会话
    const rows = await SessionModel.findMany({
      where: where().gte("expiresAt", now.toISOString()),
    });

    // 加载到内存
    for (const row of rows) {
      const session = rowToSession(row);
      this.sessions.set(session.token, session);

      let userTokens = this.userSessions.get(session.userId);
      if (!userTokens) {
        userTokens = new Set();
        this.userSessions.set(session.userId, userTokens);
      }
      userTokens.add(session.token);
    }

    this.initialized = true;
    console.log(`✅ 已加载 ${rows.length} 个会话到内存`);
  }

  /** 生成 token */
  generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  /** 创建会话 */
  async create(data: {
    userId: number;
    username: string;
    roleId: number;
    ip?: string;
    userAgent?: string;
    ttl?: number;
  }): Promise<Session> {
    const token = this.generateToken();
    const now = new Date();
    const ttl = data.ttl ?? this.defaultTTL;

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
    };

    // 先写入数据库
    const row = await SessionModel.create(sessionData);
    const session = rowToSession(row);

    // 再存储到内存
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
    if (ensureDate(session.expiresAt) < new Date()) {
      this.delete(token);
      return undefined;
    }

    // 更新最后活跃时间（异步更新数据库，不阻塞）
    const now = new Date();
    session.lastActiveAt = now;
    this.updateDatabaseAsync(session.id, { lastActiveAt: now });

    return session;
  }

  /** 异步更新数据库（不阻塞主流程） */
  private updateDatabaseAsync(id: number, data: SessionUpdate): void {
    SessionModel.update(id, data).catch((err) => {
      console.error("更新会话数据库失败:", err);
    });
  }

  /** 验证 token 并返回会话 */
  verify(token: string): Session | null {
    const session = this.get(token);
    return session ?? null;
  }

  /** 删除会话 */
  async delete(token: string): Promise<boolean> {
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

    // 从内存中删除
    this.sessions.delete(token);

    // 从数据库中删除
    await SessionModel.delete(session.id).catch((err) => {
      console.error("删除会话数据库失败:", err);
    });

    return true;
  }

  /** 同步删除会话（内部使用） */
  private deleteSync(token: string): boolean {
    const session = this.sessions.get(token);
    if (!session) return false;

    const userTokens = this.userSessions.get(session.userId);
    if (userTokens) {
      userTokens.delete(token);
      if (userTokens.size === 0) {
        this.userSessions.delete(session.userId);
      }
    }

    this.sessions.delete(token);

    // 异步删除数据库记录
    SessionModel.delete(session.id).catch((err) => {
      console.error("删除会话数据库失败:", err);
    });

    return true;
  }

  /** 获取用户的所有会话 */
  getUserSessions(userId: number): Session[] {
    const tokens = this.userSessions.get(userId);
    if (!tokens) return [];

    const sessions: Session[] = [];
    for (const token of tokens) {
      const session = this.sessions.get(token);
      if (session && ensureDate(session.expiresAt) >= new Date()) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  /** 踢用户下线（删除该用户的所有会话） */
  async kickUser(userId: number): Promise<number> {
    const tokens = this.userSessions.get(userId);
    if (!tokens) return 0;

    const count = tokens.size;
    const tokenList = Array.from(tokens);

    for (const token of tokenList) {
      const session = this.sessions.get(token);
      if (session) {
        await SessionModel.delete(session.id).catch((err) => {
          console.error("删除会话数据库失败:", err);
        });
      }
      this.sessions.delete(token);
    }
    this.userSessions.delete(userId);

    return count;
  }

  /** 踢指定会话下线 */
  async kickSession(token: string): Promise<boolean> {
    return this.delete(token);
  }

  /** 续期会话 */
  async refresh(token: string, ttl?: number): Promise<Session | null> {
    const session = this.get(token);
    if (!session) return null;

    const newTTL = ttl ?? this.defaultTTL;
    const now = new Date();
    session.expiresAt = new Date(now.getTime() + newTTL);
    session.lastActiveAt = now;

    // 更新数据库
    await SessionModel.update(session.id, {
      expiresAt: session.expiresAt,
      lastActiveAt: session.lastActiveAt,
    }).catch((err) => {
      console.error("续期会话数据库失败:", err);
    });

    return session;
  }

  /** 获取所有在线用户数 */
  getOnlineUserCount(): number {
    return this.userSessions.size || 0;
  }

  /** 获取所有会话数 */
  getSessionCount(): number {
    return this.sessions.size || 0;
  }

  /** 获取统计信息 */
  getStats() {
    const now = new Date();
    const sessions = Array.from(this.sessions.values());

    // 计算有效会话数（未过期）
    const validSessions = sessions.filter((s) => ensureDate(s.expiresAt) >= now);

    // 计算活跃会话（最近30分钟有活动）
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const activeSessions = validSessions.filter(
      (s) => ensureDate(s.lastActiveAt) >= thirtyMinutesAgo
    );

    // 计算活跃用户数（去重）
    const activeUserIds = new Set(activeSessions.map((s) => s.userId));

    // 计算今日新登录数
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayNewSessions = validSessions.filter(
      (s) => ensureDate(s.createdAt) >= todayStart
    );

    // 计算即将过期的会话（1小时内过期）
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const expiringSessions = validSessions.filter(
      (s) => ensureDate(s.expiresAt) <= oneHourLater
    );

    return {
      onlineUsers: this.userSessions.size,
      totalSessions: validSessions.length,
      activeSessions: activeSessions.length,
      activeUsers: activeUserIds.size,
      todayNewSessions: todayNewSessions.length,
      expiringSessions: expiringSessions.length,
    };
  }

  /** 获取所有会话（管理用） */
  getAllSessions(): Session[] {
    const now = new Date();
    return Array.from(this.sessions.values()).filter((s) => ensureDate(s.expiresAt) >= now);
  }

  /** 清理数据库中的过期会话 */
  private async cleanupDatabase(): Promise<number> {
    const now = new Date();
    // 查找所有过期的会话
    const expiredRows = await SessionModel.findMany({
      where: where().lt("expiresAt", now.toISOString()),
    });

    // 删除过期会话
    for (const row of expiredRows) {
      await SessionModel.delete(row.id).catch((err) => {
        console.error("清理过期会话失败:", err);
      });
    }

    return expiredRows.length;
  }

  /** 清理过期会话 */
  async cleanup(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [token, session] of this.sessions) {
      if (ensureDate(session.expiresAt) < now) {
        this.deleteSync(token);
        cleaned++;
      }
    }

    return cleaned;
  }

  /** 重新加载会话（从数据库同步到内存） */
  async reload(): Promise<void> {
    // 清空内存
    this.sessions.clear();
    this.userSessions.clear();
    this.initialized = false;

    // 重新加载
    await this.init();
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
