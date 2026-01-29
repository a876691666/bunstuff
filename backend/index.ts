import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createApi } from "./modules";
import { rbacService } from "./modules/rbac/service";
import { openapi } from '@elysiajs/openapi'

// 从环境变量或命令行参数读取配置
const SEED_AUTO_RUN = process.env.SEED_AUTO_RUN === "true" || Bun.argv.includes("--seed");

// 初始化 RBAC 缓存
await rbacService.init();
console.log("✅ RBAC cache initialized");

// 创建 API 实例，传入 seed 配置
const api = createApi({
  seed: {
    autoRun: SEED_AUTO_RUN || true,
  },
});

const app = new Elysia()
  .use(cors())
  .use(openapi({
    documentation: {
      info: {
        title: "RBAC Admin API",
        version: "1.0.0",
        description: "基于 RBAC 的后台管理系统 API",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT 认证令牌",
          },
        },
      },
      tags: [
        { name: "认证", description: "用户认证相关接口" },
        { name: "用户管理", description: "用户 CRUD 操作" },
        { name: "角色管理", description: "角色 CRUD 操作" },
        { name: "权限管理", description: "权限 CRUD 操作" },
        { name: "菜单管理", description: "菜单 CRUD 操作" },
        { name: "数据权限", description: "数据过滤规则管理" },
        { name: "角色权限", description: "角色权限关联管理" },
        { name: "角色菜单", description: "角色菜单关联管理" },
        { name: "RBAC", description: "权限查询相关接口" },
        { name: "Seed管理", description: "数据初始化管理" },
      ],
    },
  }))
  .get("/", () => "Hello from Elysia!")
  .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(api)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);