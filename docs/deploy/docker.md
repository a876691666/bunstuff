# Docker 部署

## 前提条件

- Docker 20.10+
- Docker Compose 2.0+ (可选)

## 构建 Docker 镜像

### 方式一：使用构建脚本

```bash
# 在项目根目录执行
bun run build-docker.ts
```

脚本会自动：
1. 编译前端（frontend + client）
2. 构建 Docker 镜像
3. 导出镜像 tar 文件
4. 复制静态资源到 `release-docker/`
5. 生成部署 README

### 方式二：手动构建

```bash
# 先编译前端
cd frontend && bun run build && cd ..
cd client && bun run build && cd ..

# 构建 Docker 镜像
docker build -t bunstuff .
```

## Dockerfile 解析

三阶段构建，最终镜像体积最小：

```dockerfile
# 阶段 1: 安装依赖
FROM oven/bun:1 AS deps
COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile --production

# 阶段 2: 编译
FROM oven/bun:1 AS build
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
RUN bun build ./index.ts --outfile=index.js --target=bun

# 阶段 3: 运行
FROM oven/bun:1-slim AS runtime
COPY --from=build /app/index.js .
USER bun
EXPOSE 3000
CMD ["bun", "run", "index.js"]
```

## Docker Compose 部署

### docker-compose.yml

```yaml
services:
  app:
    image: bunstuff:latest
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app/frontend:ro    # 管理端静态文件
      - ./client:/app/client:ro        # 客户端静态文件
      - ./data:/app/data               # SQLite 数据库
      - ./uploads:/app/uploads         # 上传文件
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

### 启动

```bash
# 前台运行（查看日志）
docker compose up

# 后台运行
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

## 发布包部署

使用 `build-docker.ts` 生成的发布包（`release-docker/`）：

```
release-docker/
├── docker-compose.yml       # Compose 配置
├── README.md                # 部署说明
├── frontend/                # 管理端静态文件
│   └── index.html + assets/
├── client/                  # 客户端静态文件
│   └── index.html + assets/
├── data/                    # 数据库目录（空）
└── uploads/                 # 上传目录（空）
```

部署步骤：

```bash
# 1. 将发布包上传到服务器

# 2. 导入 Docker 镜像
docker load -i bunstuff.tar

# 3. 启动
cd release-docker
docker compose up -d
```

## 卷挂载说明

| 卷路径 | 容器路径 | 模式 | 说明 |
|--------|---------|------|------|
| `./frontend` | `/app/frontend` | 只读 | 管理端 SPA |
| `./client` | `/app/client` | 只读 | 客户端 SPA |
| `./data` | `/app/data` | 读写 | SQLite 数据库 |
| `./uploads` | `/app/uploads` | 读写 | 上传文件 |

## 反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name admin.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE 支持
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }

    # 文件上传大小
    client_max_body_size 100m;
}
```
