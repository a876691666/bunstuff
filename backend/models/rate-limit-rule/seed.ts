import type { SeedDefinition } from '@/modules/seed'
import RateLimitRule from './index'

/** 默认限流规则数据 */
const defaultRules = [
  {
    name: '全局默认限流',
    code: 'global_default',
    mode: 'time_window',
    pathPattern: '/api/**',
    method: '*',
    dimension: 'ip',
    windowSeconds: 60,
    maxRequests: 200,
    maxConcurrent: 50,
    blacklistThreshold: 0,
    responseCode: 429,
    responseMessage: '请求过于频繁，请稍后再试',
    priority: 1000,
    status: 1,
    remark: '全局默认限流规则',
  },
  {
    name: '登录接口限流',
    code: 'login_rate_limit',
    mode: 'time_window',
    pathPattern: '/api/auth/login',
    method: 'POST',
    dimension: 'ip',
    windowSeconds: 300,
    maxRequests: 10,
    maxConcurrent: 3,
    blacklistThreshold: 5,
    responseCode: 429,
    responseMessage: '登录尝试过于频繁，请5分钟后再试',
    priority: 10,
    status: 1,
    remark: '防止暴力破解',
  },
  {
    name: '注册接口限流',
    code: 'register_rate_limit',
    mode: 'time_window',
    pathPattern: '/api/auth/register',
    method: 'POST',
    dimension: 'ip',
    windowSeconds: 3600,
    maxRequests: 5,
    maxConcurrent: 2,
    blacklistThreshold: 3,
    responseCode: 429,
    responseMessage: '注册过于频繁，请稍后再试',
    priority: 10,
    status: 1,
    remark: '防止恶意注册',
  },
  {
    name: '管理端API并发限流',
    code: 'admin_concurrent',
    mode: 'concurrent',
    pathPattern: '/api/admin/**',
    method: '*',
    dimension: 'ip',
    windowSeconds: 0,
    maxRequests: 0,
    maxConcurrent: 20,
    blacklistThreshold: 0,
    responseCode: 429,
    responseMessage: '并发请求过多，请稍后再试',
    priority: 100,
    status: 1,
    remark: '管理端并发限制',
  },
]

/** 限流规则 Seed */
export const rateLimitRuleSeed: SeedDefinition = {
  name: 'rate-limit-rule-default',
  description: '初始化默认限流规则',
  async run() {
    for (const rule of defaultRules) {
      await RateLimitRule.create(rule)
    }
    console.log(`✅ 已创建 ${defaultRules.length} 条默认限流规则`)
  },
}

export default rateLimitRuleSeed
