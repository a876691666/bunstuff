# Docker 部署

使用 Docker 容器化部署 Bunstuff 应用。

## 🚀 快速部署

### 一键构建

```bash
bun run docker:build
```

该命令执行 `build-docker.ts`，依次完成：

1. 编译管理端前端（Vite build）
2. 编译客户端前端（Vite build）
3. 构建 Docker 镜像（多阶段构建）
4. 导出镜像为 `bunstuff.tar`
5. 复制前端产物和配置到 `release-docker/`

### 部署到服务器

将 `release-docker/` 目录上传至服务器，然后执行：

```bash
# 导入镜像
docker load -i bunstuff.tar

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

## 🐳 Dockerfile 说明

采用三阶段构建，最小化镜像体积：

| 阶段      | 基础镜像          | 作用                     |
| --------- | ----------------- | ------------------------ |
| `deps`    | `oven/bun:1`      | 安装后端依赖             |
| `build`   | `oven/bun:1`      | 编译后端为单文件 bundle  |
| `runtime` | `oven/bun:1-slim` | 最终运行（非 root 用户） |

### 安全特性

- 使用非 root 用户 `appuser` 运行
- 健康检查：每 30s 请求 `/api/health`
- 仅暴露 3000 端口

## 📝 docker-compose.yml

```yaml
services:
  app:
    image: bunstuff:latest
    container_name: bunstuff
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - ./frontend:/app/frontend:ro # 管理端（只读）
      - ./client:/app/client:ro # 客户端（只读）
      - ./data:/app/data # 数据库（持久化）
      - ./uploads:/app/uploads # 上传文件（持久化）
    environment:
      - NODE_ENV=production
      - SEED_AUTO_RUN=true
```

### 挂载卷说明

| 卷           | 容器路径        | 模式 | 说明                     |
| ------------ | --------------- | ---- | ------------------------ |
| `./frontend` | `/app/frontend` | 只读 | 管理端静态资源，可热更新 |
| `./client`   | `/app/client`   | 只读 | 客户端静态资源，可热更新 |
| `./data`     | `/app/data`     | 读写 | SQLite 数据库            |
| `./uploads`  | `/app/uploads`  | 读写 | 用户上传文件             |

## 🔄 更新策略

### 更新前端

直接替换宿主机上的 `frontend/` 或 `client/` 静态文件，无需重启容器（浏览器刷新即可）。

### 更新后端

```bash
# 重新构建镜像
docker load -i bunstuff.tar
# 重启容器
docker compose up -d
```

::: warning 数据安全
更新后端时 `data/` 和 `uploads/` 目录通过卷挂载持久化，不会丢失数据。
:::
