import { existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { runSeeds } from '@/core/seed'
import { serviceInits } from '@/_generated/services.generated'
import { createApi } from '@/core'

// ============ 配置 ============

export const rootPath = Bun.env.BUNSTUFF_DEV ? resolve(process.cwd(), '..') : process.cwd()

export interface BootstrapOptions {
  /** 是否自动执行 Seeds，默认 true */
  autoSeed?: boolean
  /** 监听端口 */
  port?: number
}

// ============ 日志工具 ============

const DIM = '\x1b[2m'
const RESET = '\x1b[0m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const MAGENTA = '\x1b[35m'
const BOLD = '\x1b[1m'

function ms(t: number): string {
  return `${DIM}${t}ms${RESET}`
}

function section(en: string, zh: string) {
  console.log(`\n${CYAN}${BOLD}▸ ${en}${RESET} ${DIM}${zh}${RESET}`)
}

function ok(label: string, detail: string, t?: number) {
  const time = t !== undefined ? ` ${ms(t)}` : ''
  console.log(`  ${GREEN}✓${RESET} ${label} ${DIM}${detail}${RESET}${time}`)
}

function skip(label: string, detail: string) {
  console.log(`  ${DIM}● ${label} ${detail}${RESET}`)
}

function fail(label: string, detail: string) {
  console.log(`  ${RED}✗${RESET} ${label} ${DIM}${detail}${RESET}`)
}

// ============ 初始化流程 ============

/**
 * 应用完整启动流程：
 *   1. 创建必要目录 Ensure directories
 *   2. 执行 Seeds    Database seeding
 *   3. 初始化 Service  Service initialization
 *   4. 构建 API 路由   Mount API routes
 */
export async function bootstrap(options: BootstrapOptions = {}) {
  const { autoSeed = true } = options
  const t0 = Date.now()

  console.log(`\n${BOLD}⚡ Bootstrap${RESET} ${DIM}启动初始化流程${RESET}\n`)

  // ===== 阶段1: 确保目录结构 =====
  ensureDirs()

  // ===== 阶段2: 执行 Seeds =====
  await seedPhase(autoSeed)

  // ===== 阶段3: 初始化所有 Service =====
  await servicePhase()

  // ===== 阶段4: 构建 API 路由 =====
  section('Routes', '挂载路由')
  const t2 = Date.now()
  const api = createApi()
  ok('API', '路由已挂载 routes mounted', Date.now() - t2)

  console.log(`\n${GREEN}${BOLD}✔ Ready${RESET} ${DIM}就绪${RESET} ${ms(Date.now() - t0)}\n`)
  return { api, rootPath }
}

// ============ 地址打印（Vite 风格） ============

export function printServerUrls(hostname: string, port: number) {
  const local = `http://localhost:${port}`
  const network = hostname === '0.0.0.0' || hostname === '::' ? null : `http://${hostname}:${port}`

  console.log(`  ${MAGENTA}${BOLD}BUNSTUFF v1.0.0${RESET}`)
  console.log()
  console.log(`  ${BOLD}➜${RESET}  ${BOLD}Local${RESET} 本地:   ${CYAN}${local}/${RESET}`)
  if (network) {
    console.log(`  ${BOLD}➜${RESET}  ${DIM}Network 网络: ${network}/${RESET}`)
  }
  console.log(`  ${BOLD}➜${RESET}  ${DIM}API 接口:     ${local}/api${RESET}`)
  console.log(`  ${BOLD}➜${RESET}  ${DIM}Admin 管理:   ${local}/_admin${RESET}`)
  console.log(`  ${BOLD}➜${RESET}  ${DIM}Docs 文档:    ${local}/openapi${RESET}`)
  console.log()
}

// ============ 内部步骤 ============

/** 自动创建必要目录 */
function ensureDirs() {
  const dirs = [resolve(rootPath, 'uploads')]
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
      console.log(`  ${DIM}📁 Created 已创建 ${dir}${RESET}`)
    }
  }
}

/** Seeds 阶段 */
async function seedPhase(autoRun: boolean) {
  section('Seeds', '数据播种')
  if (!autoRun) {
    skip('seeds', '跳过 skipped (autoSeed=false)')
    return
  }
  const t1 = Date.now()
  const result = await runSeeds({ autoRun: true })
  if (!result) {
    ok('seeds', '无待执行 nothing to run', Date.now() - t1)
    return
  }
  // 逐条打印结果
  for (const r of result.results) {
    if (r.skipped) {
      skip(r.name, '已执行 executed')
    } else if (r.success) {
      ok(r.name, '成功 done')
    } else {
      fail(r.name, `失败 failed — ${r.message}`)
    }
  }
  const summary = `共 ${result.total} 项 | 成功 ${result.success} | 跳过 ${result.skipped} | 失败 ${result.failed}`
  console.log(`  ${DIM}${summary}${RESET} ${ms(Date.now() - t1)}`)
}

/** Service 初始化阶段 */
async function servicePhase() {
  section('Services', '服务初始化')
  for (const { name, init } of serviceInits) {
    const t = Date.now()
    try {
      await init()
      ok(name, '已就绪 ready', Date.now() - t)
    } catch (err) {
      fail(name, '初始化失败 init failed')
      throw err
    }
  }
}
