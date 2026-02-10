import { resolve } from 'path'
import { existsSync, rmSync, cpSync, mkdirSync } from 'fs'

const rootDir = import.meta.dir
const frontendDir = resolve(rootDir, 'frontend')
const frontendDist = resolve(frontendDir, 'dist')
const releaseDir = resolve(rootDir, 'release')
const releaseFrontendDir = resolve(releaseDir, 'frontend')

// ===== 0. 清理 release 目录 =====
if (existsSync(releaseDir)) {
  rmSync(releaseDir, { recursive: true })
}
mkdirSync(releaseDir, { recursive: true })

// ===== 1. 编译前端 =====
console.log('📦 Building frontend...')
const frontendBuild = Bun.spawnSync(['bun', 'run', 'build'], {
  cwd: frontendDir,
  stdio: ['inherit', 'inherit', 'inherit'],
})
if (frontendBuild.exitCode !== 0) {
  console.error('❌ Frontend build failed')
  process.exit(1)
}
console.log('✅ Frontend build completed')

// ===== 2. 复制前端产物到 release/frontend =====
mkdirSync(releaseFrontendDir, { recursive: true })
cpSync(frontendDist, releaseFrontendDir, { recursive: true })
console.log('✅ Frontend dist copied to release/frontend')

// ===== 3. 编译后端 =====
console.log('📦 Building backend...')
await Bun.build({
  entrypoints: ['./backend/index.ts'],
  outdir: resolve(releaseDir),
  minify: true,
  target: 'bun',
  compile: true,
})
console.log('✅ Backend build completed')
console.log(`\n🎉 Release output: ${releaseDir}`)
