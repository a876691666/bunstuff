/**
 * 限流保护测试脚本 - 模拟并发请求测试限流与IP自动封禁
 *
 * 使用方式: bun run backend/scripts/test-rate-limit.ts
 *
 * 前置条件: 后端服务已启动 (bun run backend/index.ts)
 *
 * 测试场景（基于默认 seed 数据）:
 *   1. 登录接口限流: 10次/300秒, 触发5次后自动封禁IP
 *   2. 注册接口限流: 5次/3600秒, 触发3次后自动封禁IP
 *   3. 管理端并发限流: 最大20并发
 *   4. IP封禁后全部请求拒绝
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000'

// ─── 工具函数 ─────────────────────────────────────────────

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
}

function log(msg: string) {
  console.log(msg)
}
function info(msg: string) {
  log(`${colors.blue}ℹ${colors.reset} ${msg}`)
}
function ok(msg: string) {
  log(`${colors.green}✓${colors.reset} ${msg}`)
}
function warn(msg: string) {
  log(`${colors.yellow}⚠${colors.reset} ${msg}`)
}
function fail(msg: string) {
  log(`${colors.red}✗${colors.reset} ${msg}`)
}
function title(msg: string) {
  log(`\n${colors.bold}${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`)
}

interface ReqResult {
  status: number
  code?: number
  message?: string
  ms: number
}

async function req(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<ReqResult> {
  const start = performance.now()
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const ms = Math.round(performance.now() - start)
    let json: any = {}
    try {
      json = await res.json()
    } catch {}
    return { status: res.status, code: json?.code, message: json?.message, ms }
  } catch (err) {
    const ms = Math.round(performance.now() - start)
    return { status: 0, message: (err as Error).message, ms }
  }
}

function summarize(results: ReqResult[], label: string) {
  const total = results.length
  const passed = results.filter((r) => r.status === 200).length
  const limited = results.filter((r) => r.status === 429).length
  const blocked = results.filter((r) => r.status === 403).length
  const other = total - passed - limited - blocked
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / total)

  log(
    `  ${colors.dim}${label}${colors.reset}: ` +
      `共${total}次 | ` +
      `${colors.green}通过${passed}${colors.reset} | ` +
      `${colors.yellow}限流${limited}${colors.reset} | ` +
      `${colors.red}封禁${blocked}${colors.reset}` +
      (other > 0 ? ` | 其他${other}` : '') +
      ` | 平均${avgMs}ms`,
  )
  return { total, passed, limited, blocked }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── 测试 1: 登录接口时间窗口限流 ───────────────────────

async function testLoginRateLimit() {
  title('测试1: 登录接口限流 (10次/300秒, 封禁阈值5)')
  info('连续发送15次POST /api/auth/login, 前10次应通过, 第11次起被限流')

  const results: ReqResult[] = []
  for (let i = 1; i <= 15; i++) {
    const r = await req('POST', '/api/auth/login', {
      username: 'test_rate_limit',
      password: 'wrong_password',
    })
    results.push(r)

    const statusIcon =
      r.status === 200 || (r.status === 400 && r.code !== 429)
        ? `${colors.green}${r.status}${colors.reset}`
        : r.status === 429
          ? `${colors.yellow}${r.status}${colors.reset}`
          : r.status === 403
            ? `${colors.red}${r.status}${colors.reset}`
            : `${colors.dim}${r.status}${colors.reset}`

    log(`  [${String(i).padStart(2)}] ${statusIcon} ${r.ms}ms ${colors.dim}${r.message || ''}${colors.reset}`)
  }

  const s = summarize(results, '登录限流')

  // 验证: 至少有部分被限流
  if (s.limited > 0) {
    ok('登录限流生效 ✓')
  } else {
    fail('登录限流未触发 (可能规则未加载)')
  }

  return results
}

// ─── 测试 2: 注册接口时间窗口限流 ───────────────────────

async function testRegisterRateLimit() {
  title('测试2: 注册接口限流 (5次/3600秒, 封禁阈值3)')
  info('连续发送10次POST /api/auth/register, 前5次应通过, 第6次起被限流')

  const results: ReqResult[] = []
  for (let i = 1; i <= 10; i++) {
    const r = await req('POST', '/api/auth/register', {
      username: `ratelimit_test_${Date.now()}_${i}`,
      password: 'Test123456',
    })
    results.push(r)

    const statusIcon =
      r.status === 429
        ? `${colors.yellow}${r.status}${colors.reset}`
        : r.status === 403
          ? `${colors.red}${r.status}${colors.reset}`
          : `${colors.green}${r.status}${colors.reset}`

    log(`  [${String(i).padStart(2)}] ${statusIcon} ${r.ms}ms ${colors.dim}${r.message || ''}${colors.reset}`)
  }

  const s = summarize(results, '注册限流')

  if (s.limited > 0) {
    ok('注册限流生效 ✓')
  } else {
    fail('注册限流未触发')
  }

  return results
}

// ─── 测试 3: 管理端并发限流 ─────────────────────────────

async function testAdminConcurrent() {
  title('测试3: 管理端并发限流 (最大20并发)')
  info('同时发送30个GET /api/admin/rate-limit-rule, 应有部分被限流')

  // 并发发送30个请求
  const promises = Array.from({ length: 30 }, (_, i) =>
    req('GET', '/api/admin/rate-limit-rule'),
  )

  const results = await Promise.all(promises)

  results.forEach((r, i) => {
    const statusIcon =
      r.status === 429
        ? `${colors.yellow}${r.status}${colors.reset}`
        : r.status === 401
          ? `${colors.dim}401${colors.reset}`
          : `${colors.green}${r.status}${colors.reset}`

    log(`  [${String(i + 1).padStart(2)}] ${statusIcon} ${r.ms}ms`)
  })

  const s = summarize(results, '并发限流')

  if (s.limited > 0) {
    ok('管理端并发限流生效 ✓')
  } else {
    warn('并发限流未触发 (30并发可能未超过阈值20, 因请求完成快速释放)')
  }
}

// ─── 测试 4: IP封禁验证 ────────────────────────────────

async function testIpBlacklist(loginResults: ReqResult[]) {
  title('测试4: IP自动封禁验证')

  const limited = loginResults.filter((r) => r.status === 429).length
  if (limited < 5) {
    info(`登录限流仅触发${limited}次, 未达到封禁阈值5次, 继续补充请求...`)
    // 补充请求直到触发足够封禁
    for (let i = 0; i < 10; i++) {
      await req('POST', '/api/auth/login', {
        username: 'blacklist_test',
        password: 'wrong',
      })
    }
    await sleep(100) // 等待异步封禁完成
  } else {
    await sleep(100)
  }

  info('检测IP是否已被封禁 (发送任意请求检查403状态)')
  const r = await req('GET', '/api/health')

  if (r.status === 403) {
    ok(`IP已被自动封禁 ✓ (status=${r.status}, message=${r.message})`)
  } else {
    warn(`IP未被封禁 (status=${r.status}) - 可能封禁阈值未达到或异步封禁未完成`)
  }
}

// ─── 测试 5: 全局限流压力测试 ──────────────────────────

async function testGlobalRateLimit() {
  title('测试5: 全局限流压力测试 (200次/60秒)')
  info('快速发送50次GET /api/health, 检查全局限流')

  const batchSize = 10
  const batches = 5
  const allResults: ReqResult[] = []

  for (let batch = 0; batch < batches; batch++) {
    const promises = Array.from({ length: batchSize }, () => req('GET', '/api/health'))
    const results = await Promise.all(promises)
    allResults.push(...results)
  }

  const s = summarize(allResults, '全局限流')

  if (s.passed > 0) {
    ok(`全局限流正常 (50次请求中${s.passed}次通过, 未超过200上限)`)
  }
  if (s.blocked > 0) {
    warn(`有${s.blocked}次被IP封禁拦截 (可能由之前测试触发)`)
  }
}

// ─── 主流程 ─────────────────────────────────────────────

async function main() {
  log(`${colors.bold}`)
  log('╔═══════════════════════════════════════════════════╗')
  log('║         限流保护 (Rate Limiting) 测试脚本         ║')
  log('╚═══════════════════════════════════════════════════╝')
  log(`${colors.reset}`)
  info(`目标服务: ${BASE_URL}`)

  // 先检查服务是否可用
  const health = await req('GET', '/api/health')
  if (health.status === 0) {
    fail(`无法连接到 ${BASE_URL}, 请先启动后端服务`)
    process.exit(1)
  }
  ok(`服务连接正常 (status=${health.status}, ${health.ms}ms)`)

  // 按顺序执行测试
  const loginResults = await testLoginRateLimit()
  // await testRegisterRateLimit()
  // await testAdminConcurrent()
  // await testGlobalRateLimit()
  // await testIpBlacklist(loginResults)

  title('测试完成')
  info('如果IP已被自动封禁, 重启后端服务或通过管理端解封后可恢复')
}

main().catch((err) => {
  fail(`测试异常: ${err.message}`)
  process.exit(1)
})
