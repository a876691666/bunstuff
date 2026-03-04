import { model } from '@/core/model'

const SeedLog = model.seed_log

/** Seed 定义 */
export interface SeedDefinition {
  /** Seed 唯一名称 */
  name: string
  /** Seed 描述 */
  description?: string
  /** 依赖的 Seed 名称列表（会先执行依赖） */
  dependencies?: string[]
  /** Seed 执行函数 */
  run: () => Promise<void>
}

// 内部状态
const seeds: Map<string, SeedDefinition> = new Map()

export function register(seed: SeedDefinition) {
  seeds.set(seed.name, seed)
}

export function registerMany(seedList: SeedDefinition[]) {
  for (const seed of seedList) {
    register(seed)
  }
}

export async function isExecuted(name: string): Promise<boolean> {
  const log = await SeedLog.findOne({ where: `name = '${name}' && status = 1` })
  return !!log
}

export async function getLogs() {
  return await SeedLog.findMany({
    orderBy: [{ column: 'executedAt', order: 'DESC' }],
  })
}

export async function runSeed(
  name: string,
  force = false,
): Promise<{ success: boolean; message: string }> {
  const seed = seeds.get(name)
  if (!seed) {
    return { success: false, message: `Seed "${name}" 不存在` }
  }

  if (!force && (await isExecuted(name))) {
    return { success: false, message: `Seed "${name}" 已执行过` }
  }

  const now = new Date().toISOString()

  const failedLog = await SeedLog.findOne({ where: `name = '${name}' && status = 0` })
  if (failedLog) {
    await SeedLog.delete(failedLog.id)
  }

  try {
    await seed.run()

    await SeedLog.create({
      name: seed.name,
      description: seed.description || null,
      executedAt: now,
      status: 1,
      errorMessage: null,
    })

    return { success: true, message: `Seed "${name}" 执行成功` }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    await SeedLog.create({
      name: seed.name,
      description: seed.description || null,
      executedAt: now,
      status: 0,
      errorMessage,
    })

    return { success: false, message: `Seed "${name}" 执行失败: ${errorMessage}` }
  }
}

export async function runAll(
  force = false,
): Promise<{ total: number; success: number; failed: number; skipped: number; results: any[] }> {
  const results: any[] = []
  let success = 0
  let failed = 0
  let skipped = 0

  for (const [name, seed] of seeds) {
    if (!force && (await isExecuted(name))) {
      results.push({ name, skipped: true, message: '已执行过' })
      skipped++
      continue
    }

    const result = await runSeed(name, force)
    results.push({ name, ...result })

    if (result.success) {
      success++
    } else {
      failed++
    }
  }

  return { total: seeds.size, success, failed, skipped, results }
}

export function getRegisteredSeeds(): SeedDefinition[] {
  return Array.from(seeds.values())
}

export async function resetSeed(name: string): Promise<boolean> {
  const log = await SeedLog.findOne({ where: `name = '${name}'` })
  if (log) {
    await SeedLog.delete(log.id)
    return true
  }
  return false
}

export async function autoRun() {
  return await runAll(false)
}
