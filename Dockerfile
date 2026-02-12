# ============================================================
# Stage 1: 安装后端依赖
# ============================================================
FROM oven/bun:1 AS deps

WORKDIR /app

COPY backend/package.json backend/
COPY backend/pnpm-lock.yaml backend/

WORKDIR /app/backend
RUN bun install

# ============================================================
# Stage 2: 构建后端 bundle
# ============================================================
FROM oven/bun:1 AS build

WORKDIR /app

COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

RUN bun build ./backend/index.ts \
    --outdir ./release \
    --target bun \
    --minify

# ============================================================
# Stage 3: 最终运行镜像
# ============================================================
FROM oven/bun:1-slim AS runtime

WORKDIR /app

# 创建非 root 用户
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --create-home appuser

# 复制后端 bundle
COPY --from=build /app/release/index.js ./

# 创建挂载点目录并设置权限
RUN mkdir -p frontend client uploads data && \
    chown -R appuser:appgroup /app

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["bun", "-e", "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"]

# 环境变量
ENV NODE_ENV=production
ENV SEED_AUTO_RUN=false

# 启动
CMD ["bun", "run", "index.js"]
