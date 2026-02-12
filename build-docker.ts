import { resolve } from 'path'
import { existsSync, rmSync, cpSync, mkdirSync, writeFileSync } from 'fs'

const rootDir = import.meta.dir
const frontendDir = resolve(rootDir, 'frontend')
const frontendDist = resolve(frontendDir, 'dist')
const clientDir = resolve(rootDir, 'client')
const clientDist = resolve(clientDir, 'dist')
const releaseDir = resolve(rootDir, 'release-docker')

const IMAGE_NAME = 'bunstuff'
const IMAGE_TAG = 'latest'
const IMAGE_FULL = `${IMAGE_NAME}:${IMAGE_TAG}`
const IMAGE_FILE = 'bunstuff.tar'

function run(cmd: string[], cwd?: string): void {
  const result = Bun.spawnSync(cmd, {
    cwd: cwd ?? rootDir,
    stdio: ['inherit', 'inherit', 'inherit'],
  })
  if (result.exitCode !== 0) {
    console.error(`❌ Command failed: ${cmd.join(' ')}`)
    process.exit(1)
  }
}

// ===== 0. 清理 release-docker 目录 =====
console.log('🧹 Cleaning release-docker...')
if (existsSync(releaseDir)) {
  rmSync(releaseDir, { recursive: true })
}
mkdirSync(releaseDir, { recursive: true })

// ===== 1. 编译前端 (admin) =====
console.log('\n📦 Building frontend (admin)...')
run(['bun', 'run', 'build'], frontendDir)
console.log('✅ Frontend build completed')

// ===== 2. 编译客户端 (client) =====
console.log('\n📦 Building client...')
run(['bun', 'run', 'build'], clientDir)
console.log('✅ Client build completed')

// ===== 3. 构建 Docker 镜像 =====
console.log(`\n🐳 Building Docker image: ${IMAGE_FULL}...`)
run(['docker', 'build', '-t', IMAGE_FULL, '.'])
console.log('✅ Docker image built')

// ===== 4. 导出 Docker 镜像为 tar =====
console.log('\n💾 Saving Docker image...')
run(['docker', 'save', '-o', resolve(releaseDir, IMAGE_FILE), IMAGE_FULL])
console.log(`✅ Image saved: ${IMAGE_FILE}`)

// ===== 5. 复制前端产物 =====
console.log('\n📂 Copying frontend assets...')
cpSync(frontendDist, resolve(releaseDir, 'frontend'), { recursive: true })
cpSync(clientDist, resolve(releaseDir, 'client'), { recursive: true })
console.log('✅ Frontend & client copied')

// ===== 6. 创建数据目录 =====
mkdirSync(resolve(releaseDir, 'data'), { recursive: true })
mkdirSync(resolve(releaseDir, 'uploads'), { recursive: true })

// ===== 7. 复制 docker-compose.yml =====
cpSync(resolve(rootDir, 'docker-compose.yml'), resolve(releaseDir, 'docker-compose.yml'))
console.log('✅ docker-compose.yml copied')

// ===== 8. 生成部署说明 =====
const readme = `# Bunstuff Docker 部署

## 快速部署

\`\`\`bash
# 1. 导入 Docker 镜像
docker load -i ${IMAGE_FILE}

# 2. 启动服务
docker compose up -d

# 3. 查看日志
docker compose logs -f

# 4. 停止服务
docker compose down
\`\`\`

## 目录结构

\`\`\`
release-docker/
├── ${IMAGE_FILE}        # Docker 镜像包
├── docker-compose.yml   # 编排配置
├── frontend/            # 管理端静态资源 (挂载到容器)
├── client/              # 客户端静态资源 (挂载到容器)
├── data/                # SQLite 数据库 (持久化)
└── uploads/             # 上传文件 (持久化)
\`\`\`

## 更新前端

直接替换 \`frontend/\` 或 \`client/\` 目录下的文件，然后重启容器：

\`\`\`bash
docker compose restart
\`\`\`

## 更新后端

重新导入镜像并重启：

\`\`\`bash
docker load -i ${IMAGE_FILE}
docker compose up -d
\`\`\`
`
writeFileSync(resolve(releaseDir, 'README.md'), readme)
console.log('✅ README.md generated')

// ===== 完成 =====
console.log(`\n🎉 Docker release output: ${releaseDir}`)
console.log('   📦 Image:   ' + IMAGE_FILE)
console.log('   📄 Compose: docker-compose.yml')
console.log('   🌐 Frontend: frontend/')
console.log('   🖥️  Client:  client/')
console.log('   💾 Data:    data/')
console.log('   📁 Uploads: uploads/')
