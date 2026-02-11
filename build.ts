import { resolve } from 'path'
import { existsSync, rmSync, cpSync, mkdirSync } from 'fs'

const rootDir = import.meta.dir
const frontendDir = resolve(rootDir, 'frontend')
const frontendDist = resolve(frontendDir, 'dist')
const clientDir = resolve(rootDir, 'client')
const clientDist = resolve(clientDir, 'dist')
const releaseDir = resolve(rootDir, 'release')
const releaseFrontendDir = resolve(releaseDir, 'frontend')
const releaseClientDir = resolve(releaseDir, 'client')

// ===== 0. 清理 release 目录 =====
if (existsSync(releaseDir)) {
  rmSync(releaseDir, { recursive: true })
}
mkdirSync(releaseDir, { recursive: true })

// ===== 1. 编译前端 (admin) =====
console.log('📦 Building frontend (admin)...')
const frontendBuild = Bun.spawnSync(['bun', 'run', 'build'], {
  cwd: frontendDir,
  stdio: ['inherit', 'inherit', 'inherit'],
})
if (frontendBuild.exitCode !== 0) {
  console.error('❌ Frontend build failed')
  process.exit(1)
}
console.log('✅ Frontend build completed')

// ===== 2. 编译客户端 (client) =====
console.log('📦 Building client...')
const clientBuild = Bun.spawnSync(['bun', 'run', 'build'], {
  cwd: clientDir,
  stdio: ['inherit', 'inherit', 'inherit'],
})
if (clientBuild.exitCode !== 0) {
  console.error('❌ Client build failed')
  process.exit(1)
}
console.log('✅ Client build completed')

// ===== 3. 复制前端产物到 release =====
mkdirSync(releaseFrontendDir, { recursive: true })
cpSync(frontendDist, releaseFrontendDir, { recursive: true })
console.log('✅ Frontend dist copied to release/frontend')

mkdirSync(releaseClientDir, { recursive: true })
cpSync(clientDist, releaseClientDir, { recursive: true })
console.log('✅ Client dist copied to release/client')

// ===== 4. 编译后端 =====
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
