# 部署指南

Bunstuff 支持本地部署和 Docker 容器部署两种方式。

## 🎯 部署方式对比

| 方式 | 适用场景 | 依赖 |
|------|---------|------|
| [本地部署](./local.md) | 开发 / 测试 / 小规模生产 | Bun 运行时 |
| [Docker 部署](./docker.md) | 生产环境 / CI/CD | Docker |

## 📦 构建产物

### 本地部署产物

```
release/
├── backend.js       # 后端编译产物（单文件）
├── frontend/        # 管理端静态资源
└── client/          # 客户端静态资源
```

### Docker 部署产物

```
release-docker/
├── bunstuff.tar         # Docker 镜像包
├── docker-compose.yml   # 编排配置
├── frontend/            # 管理端静态资源
├── client/              # 客户端静态资源
├── data/                # 数据库目录
└── uploads/             # 上传文件目录
```

## ⚙️ 环境变量

参见 [环境变量配置](./env.md)。
