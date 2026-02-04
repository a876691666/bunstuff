import { where } from '@pkg/ssql'
import SeedLog from '@/models/seed-log'
import type { SeedLogInsert } from '@/models/seed-log'

/** Seed 定义 */
export interface SeedDefinition {
  /** Seed 唯一名称 */
  name: string
  /** Seed 描述 */
  description?: string
  /** Seed 执行函数 */
  run: () => Promise<void>
}

/** Seed 服务 */
export class SeedService {
  private seeds: Map<string, SeedDefinition> = new Map()

  /** 注册 Seed */
  register(seed: SeedDefinition) {
    this.seeds.set(seed.name, seed)
  }

  /** 批量注册 Seeds */
  registerMany(seeds: SeedDefinition[]) {
    for (const seed of seeds) {
      this.register(seed)
    }
  }

  /** 检查 Seed 是否已执行 */
  async isExecuted(name: string): Promise<boolean> {
    const log = await SeedLog.findOne({ where: `name = "${name}" && status = 1` })
    return !!log
  }

  /** 获取所有 Seed 日志 */
  async getLogs() {
    return await SeedLog.findMany({
      orderBy: [{ column: 'executedAt', order: 'DESC' }],
    })
  }

  /** 执行单个 Seed */
  async runSeed(name: string, force = false): Promise<{ success: boolean; message: string }> {
    const seed = this.seeds.get(name)
    if (!seed) {
      return { success: false, message: `Seed "${name}" 不存在` }
    }

    // 检查是否已成功执行
    if (!force && (await this.isExecuted(name))) {
      return { success: false, message: `Seed "${name}" 已执行过` }
    }

    const now = new Date().toISOString()

    // 删除之前的失败记录（避免唯一约束冲突）
    const failedLog = await SeedLog.findOne({ where: `name = "${name}" && status = 0` })
    if (failedLog) {
      await SeedLog.delete(failedLog.id)
    }

    try {
      await seed.run()

      // 记录成功日志
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

      // 记录失败日志
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

  /** 执行所有未执行的 Seeds */
  async runAll(
    force = false,
  ): Promise<{ total: number; success: number; failed: number; results: any[] }> {
    const results: any[] = []
    let success = 0
    let failed = 0

    for (const [name, seed] of this.seeds) {
      if (!force && (await this.isExecuted(name))) {
        results.push({ name, skipped: true, message: '已执行过' })
        continue
      }

      const result = await this.runSeed(name, force)
      results.push({ name, ...result })

      if (result.success) {
        success++
      } else {
        failed++
      }
    }

    return {
      total: this.seeds.size,
      success,
      failed,
      results,
    }
  }

  /** 获取所有注册的 Seeds */
  getRegisteredSeeds(): SeedDefinition[] {
    return Array.from(this.seeds.values())
  }

  /** 重置 Seed（删除执行记录） */
  async resetSeed(name: string): Promise<boolean> {
    const log = await SeedLog.findOne({ where: where().eq('name', name) })
    if (log) {
      await SeedLog.delete(log.id)
      return true
    }
    return false
  }

  /** 初始化自动执行所有未执行的 Seeds */
  async autoRun(): Promise<void> {
    console.log('[Seed] 开始自动执行 Seeds...')
    const result = await this.runAll(false)
    console.log(
      `[Seed] 执行完成: 总计 ${result.total}, 成功 ${result.success}, 失败 ${result.failed}`,
    )
    for (const r of result.results) {
      if (r.skipped) {
        console.log(`  - ${r.name}: 跳过（已执行）`)
      } else if (r.success) {
        console.log(`  - ${r.name}: ✓ 成功`)
      } else {
        console.log(`  - ${r.name}: ✗ 失败 - ${r.message}`)
      }
    }
  }
}

export const seedService = new SeedService()
