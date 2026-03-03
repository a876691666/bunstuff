import { Glob } from 'bun'
import { resolve, relative } from 'path'
import { mkdir } from 'fs/promises'

const BACKEND_DIR = resolve(import.meta.dir, '..')
const TEMP_DIR = resolve(BACKEND_DIR, 'temp')

// 匹配 rbac: { scope: { permissions: ["xxx:yyy", "aaa:bbb"] } } 格式的正则
const RBAC_SCOPE_REGEX = /rbac:\s*\{\s*scope:\s*\{\s*permissions:\s*\[([\s\S]*?)\]\s*\}\s*\}/g
// 匹配字符串内容的正则
const STRING_REGEX = /["'`]([^"'`]+)["'`]/g

interface ScopeInfo {
  scope: string
  files: Set<string>
}

async function collectScopes(): Promise<Map<string, ScopeInfo>> {
  const scopeMap = new Map<string, ScopeInfo>()
  const glob = new Glob('**/*.ts')

  // 扫描所有 TypeScript 文件
  for await (const filePath of glob.scan({ cwd: BACKEND_DIR, absolute: true })) {
    // 跳过 node_modules 和 scripts 目录
    if (filePath.includes('node_modules') || filePath.includes('scripts')) {
      continue
    }

    try {
      const file = Bun.file(filePath)
      const content = await file.text()

      // 查找所有 rbac: { scope: { permissions: [...] } } 模式
      let match
      while ((match = RBAC_SCOPE_REGEX.exec(content)) !== null) {
        const permissionsContent = match[1]

        // 提取字符串值
        let stringMatch
        while ((stringMatch = STRING_REGEX.exec(permissionsContent!)) !== null) {
          const scope = stringMatch[1]!
          const relativePath = relative(BACKEND_DIR, filePath)

          if (scopeMap.has(scope)) {
            scopeMap.get(scope)!.files.add(relativePath)
          } else {
            scopeMap.set(scope, {
              scope,
              files: new Set([relativePath]),
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
    }
  }

  return scopeMap
}

function formatOutput(scopeMap: Map<string, ScopeInfo>): void {
  const scopes = Array.from(scopeMap.values()).sort((a, b) => a.scope.localeCompare(b.scope))

  console.log('='.repeat(60))
  console.log('📋 Scope Permissions 收集报告')
  console.log('='.repeat(60))
  console.log()
  console.log(`共发现 ${scopes.length} 个不同的 scope permissions:\n`)

  // 按前缀分组
  const grouped = new Map<string, ScopeInfo[]>()
  for (const info of scopes) {
    const prefix = info.scope.split(':')[0] || 'other'
    if (!grouped.has(prefix)) {
      grouped.set(prefix, [])
    }
    grouped.get(prefix)!.push(info)
  }

  // 输出分组结果
  for (const [prefix, items] of Array.from(grouped.entries()).sort()) {
    console.log(`📁 ${prefix} (${items.length} 个)`)
    for (const item of items) {
      console.log(`   ├─ ${item.scope}`)
      for (const file of Array.from(item.files).sort()) {
        console.log(`   │   └─ ${file}`)
      }
    }
    console.log()
  }

  // 输出简洁列表
  console.log('-'.repeat(60))
  console.log('📝 所有 Scopes 列表（去重）:')
  console.log('-'.repeat(60))
  const allScopes = scopes.map((s) => s.scope)
  console.log(JSON.stringify(allScopes, null, 2))

  // 输出按前缀分组的对象格式
  console.log()
  console.log('-'.repeat(60))
  console.log('📦 按模块分组:')
  console.log('-'.repeat(60))
  const groupedScopes: Record<string, string[]> = {}
  for (const [prefix, items] of grouped) {
    groupedScopes[prefix] = items.map((i) => i.scope)
  }
  console.log(JSON.stringify(groupedScopes, null, 2))
}

// 保存结果到文件
async function saveToFile(scopeMap: Map<string, ScopeInfo>): Promise<void> {
  // 确保 temp 目录存在
  await mkdir(TEMP_DIR, { recursive: true })

  const scopes = Array.from(scopeMap.values()).sort((a, b) => a.scope.localeCompare(b.scope))

  // 按前缀分组
  const grouped = new Map<string, ScopeInfo[]>()
  for (const info of scopes) {
    const prefix = info.scope.split(':')[0] || 'other'
    if (!grouped.has(prefix)) {
      grouped.set(prefix, [])
    }
    grouped.get(prefix)!.push(info)
  }

  // 准备输出数据
  const allScopes = scopes.map((s) => s.scope)
  const groupedScopes: Record<string, string[]> = {}
  for (const [prefix, items] of grouped) {
    groupedScopes[prefix] = items.map((i) => i.scope)
  }

  // 详细信息（包含文件来源）
  const detailedInfo = scopes.map((s) => ({
    scope: s.scope,
    files: Array.from(s.files).sort(),
  }))

  // 写入文件
  const outputPath = resolve(TEMP_DIR, 'scopes.json')
  const output = {
    total: scopes.length,
    generatedAt: new Date().toISOString(),
    scopes: allScopes,
    grouped: groupedScopes,
    detailed: detailedInfo,
  }

  await Bun.write(outputPath, JSON.stringify(output, null, 2))
  console.log(`\n✅ 结果已保存到: ${relative(BACKEND_DIR, outputPath)}`)
}

// 主函数
async function main() {
  console.log('🔍 开始扫描 backend 目录下的 TypeScript 文件...\n')

  const scopeMap = await collectScopes()

  if (scopeMap.size === 0) {
    console.log('⚠️  未找到任何 scope permissions')
    return
  }

  formatOutput(scopeMap)
  await saveToFile(scopeMap)
}

main().catch(console.error)
