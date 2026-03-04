# 本地部署

不使用 Docker，直接在服务器上运行 Bunstuff。

## 📋 环境要求

| 依赖    | 版本         | 说明             |
| ------- | ------------ | ---------------- |
| Bun     | ≥ 1.0        | 运行时           |
| Node.js | ≥ 18（可选） | 仅编译前端时需要 |

## 🚀 构建步骤

### 1. 安装依赖

```bash
# 后端依赖
cd backend && bun install

# 前端依赖（管理端）
cd frontend && bun install

# 前端依赖（客户端）
cd client && bun install
```

### 2. 一键构建

```bash
bun run build.ts
```

该脚本依次执行：

1. 清理 `release/` 目录
2. 编译管理端前端 → `release/frontend/`
3. 编译客户端前端 → `release/client/`
4. 运行代码生成器
5. 编译后端 → `release/index.js`（单文件 bundle）

### 3. 部署

将 `release/` 目录上传至服务器：

```
release/
├── index.js         # 后端可执行文件
├── frontend/        # 管理端静态资源
└── client/          # 客户端静态资源
```

### 4. 运行

```bash
cd release

# 创建必要目录
mkdir -p data uploads

# 设置环境变量
export NODE_ENV=production
export SEED_AUTO_RUN=true

# 启动
bun run index.js
```

## ⚙️ 进程管理

### 使用 systemd（推荐）

创建 `/etc/systemd/system/bunstuff.service`：

```ini
[Unit]
Description=Bunstuff Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/bunstuff
ExecStart=/usr/local/bin/bun run index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=SEED_AUTO_RUN=false

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable bunstuff
sudo systemctl start bunstuff
sudo systemctl status bunstuff
```

### 使用 PM2

```bash
pm2 start "bun run index.js" --name bunstuff
pm2 save
pm2 startup
```

## 🌐 反向代理

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件大小限制
    client_max_body_size 50M;
}
```

::: tip HTTPS
生产环境建议使用 Nginx + Let's Encrypt 配置 HTTPS。
:::
