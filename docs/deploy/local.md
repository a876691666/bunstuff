# 本地构建

## 构建流程

使用 `build.ts` 脚本进行本地构建：

```bash
bun run build.ts
```

### 构建步骤

1. **编译前端** — `cd frontend && bun run build` + `cd client && bun run build`
2. **复制静态文件** — 前端构建产物复制到 `release/frontend/` 和 `release/client/`
3. **编译后端** — `Bun.build` 将后端打包为单文件 `release/index.js`
4. **复制资源** — 上传文件等复制到 `release/`

## 构建产物

```
release/
├── index.js           # 后端单文件（Bun.build 产物）
├── frontend/          # 管理端静态文件
│   ├── index.html
│   └── assets/
├── client/            # 客户端静态文件
│   ├── index.html
│   └── assets/
└── uploads/           # 上传文件
```

## 服务器部署

### 环境要求

- Bun >= 1.0
- 服务器可以是 Linux / macOS / Windows

### 步骤

```bash
# 1. 将 release/ 上传到服务器

# 2. 安装 Bun（如未安装）
curl -fsSL https://bun.sh/install | bash

# 3. 运行
cd release
bun run index.js
```

### 守护进程

推荐使用 `systemd` 或 `pm2` 管理进程：

#### systemd

```ini
# /etc/systemd/system/bunstuff.service
[Unit]
Description=Bunstuff Application
After=network.target

[Service]
Type=simple
User=www
WorkingDirectory=/opt/bunstuff
ExecStart=/usr/local/bin/bun run index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable bunstuff
sudo systemctl start bunstuff
sudo systemctl status bunstuff
```

#### PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start "bun run index.js" --name bunstuff

# 保存
pm2 save
pm2 startup
```
