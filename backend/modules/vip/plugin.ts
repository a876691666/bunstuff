/**
 * VIP 插件 - VIP 等级和资源限制校验中间件
 *
 * 默认不启用，通过路由配置 vip.scope 来启用 VIP 检查
 */

import { Elysia } from "elysia";
import { vipService } from "./service";

/** VIP Scope 配置 */
export interface VipScope {
  /** 需要的 VIP 等级代码（精确匹配或更高等级） */
  vipTier?: string;
  /** 是否需要任意有效 VIP */
  required?: boolean;
}

// 扩展 Elysia 的 DocumentDecoration 类型，支持 vip.scope 配置
declare module "elysia" {
  interface DocumentDecoration {
    /** VIP 配置 */
    vip?: {
      scope?: VipScope;
    };
  }
}

/** VIP 上下文 */
export interface VipContext {
  /** 用户 VIP 等级 ID */
  vipTierId: number | null;
  /** VIP 等级代码 */
  vipTierCode: string | null;
  /** VIP 绑定状态 */
  bindingStatus: number;
  /** 是否是有效 VIP */
  isValidVip: boolean;
  /** 检查是否可以使用指定资源 */
  canUseResource: (resourceKey: string, amount?: number) => Promise<boolean>;
  /** 增加资源使用量 */
  incrementResource: (resourceKey: string, amount?: number) => Promise<void>;
  /** 减少资源使用量 */
  decrementResource: (resourceKey: string, amount?: number) => Promise<void>;
  /** 获取资源使用情况 */
  getResourceUsage: (resourceKey: string) => Promise<{
    currentUsage: number;
    limitValue: number;
    available: number;
    canUse: boolean;
  }>;
}

/**
 * VIP 插件
 *
 * 在路由中使用 `vip.scope` 配置来启用 VIP 检查
 *
 * @example
 * ```ts
 * app
 *   .use(authPlugin())
 *   .use(vipPlugin())
 *   // 需要专业版 VIP
 *   .get("/pro-feature", ({ vip }) => {
 *     // vip 包含 VIP 上下文
 *   }, {
 *     detail: { vip: { scope: { vipTier: "pro" } } }
 *   })
 *   // 需要任意有效 VIP
 *   .get("/vip-feature", () => {...}, {
 *     detail: { vip: { scope: { required: true } } }
 *   })
 *   // 在业务中手动检查资源限制
 *   .post("/scene", async ({ vip }) => {
 *     if (!await vip.canUseResource("scene:create")) {
 *       return { error: "资源已达上限" };
 *     }
 *     // 业务逻辑...
 *     await vip.incrementResource("scene:create");
 *   }, {
 *     detail: { vip: { scope: { required: true } } }
 *   })
 * ```
 */
export function vipPlugin() {
  const app = new Elysia({ name: "vip-plugin" });
  const routerHooksMap = new Map<string, any>();

  app
    .on("start", () => {
      // @ts-ignore
      app.getGlobalRoutes().forEach((route) => {
        routerHooksMap.set(`${route.method}:::${route.path}`, route.hooks || {});
      });
    })
    .derive({ as: "global" }, async ({ request, route, ...ctx }) => {
      // 从 derive 中获取 userId (由 authPlugin 注入)
      const userId = (ctx as any).userId as number | null;

      // 默认 VIP 上下文
      const defaultVipContext: VipContext = {
        vipTierId: null,
        vipTierCode: null,
        bindingStatus: 0,
        isValidVip: false,
        canUseResource: async () => false,
        incrementResource: async () => {},
        decrementResource: async () => {},
        getResourceUsage: async () => ({
          currentUsage: 0,
          limitValue: 0,
          available: 0,
          canUse: false,
        }),
      };

      // 未登录，返回默认上下文
      if (!userId) {
        return { vip: defaultVipContext };
      }

      // 获取用户 VIP 信息
      const userVip = await vipService.getUserVip(userId);

      // 没有 VIP 或未确认绑定
      if (!userVip || userVip.bindingStatus !== 1) {
        return { vip: defaultVipContext };
      }

      // 检查是否过期
      if (userVip.expireTime && new Date(userVip.expireTime) < new Date()) {
        return { vip: defaultVipContext };
      }

      // 构建 VIP 上下文
      const vipContext: VipContext = {
        vipTierId: userVip.vipTierId,
        vipTierCode: userVip.vipTier?.code ?? null,
        bindingStatus: userVip.bindingStatus,
        isValidVip: true,
        canUseResource: async (resourceKey: string, amount: number = 1) => {
          const result = await vipService.checkResourceUsage(userId, resourceKey, amount);
          return result.canUse;
        },
        incrementResource: async (resourceKey: string, amount: number = 1) => {
          await vipService.incrementResourceUsage(userId, resourceKey, amount);
        },
        decrementResource: async (resourceKey: string, amount: number = 1) => {
          await vipService.decrementResourceUsage(userId, resourceKey, amount);
        },
        getResourceUsage: async (resourceKey: string) => {
          return await vipService.checkResourceUsage(userId, resourceKey);
        },
      };

      return { vip: vipContext };
    })
    .onBeforeHandle({ as: "global" }, async ({ set, request, route, ...ctx }) => {
      // 从 derive 中获取 userId 和 vip (由 authPlugin 和 derive 注入)
      const userId = (ctx as any).userId as number | null;
      const vip = (ctx as any).vip as VipContext;

      // 获取路由配置
      const hooks = routerHooksMap.get(`${request.method}:::${route}`) || {};
      const routeConfig = hooks?.detail?.vip || {};
      const vipScope = routeConfig?.scope as VipScope | undefined;

      // 没有配置 vip，跳过检查
      if (!vipScope) {
        return;
      }

      // 未登录时无法检查 VIP
      if (!userId) {
        set.status = 401;
        return {
          code: 401,
          message: "未登录",
        };
      }

      // 需要任意有效 VIP
      if (vipScope.required && !vip.isValidVip) {
        set.status = 403;
        return {
          code: 403,
          message: "需要有效的 VIP",
        };
      }

      // 检查 VIP 等级代码
      if (vipScope.vipTier) {
        const requiredTier = await vipService.findTierByCode(vipScope.vipTier);
        if (!requiredTier) {
          set.status = 500;
          return {
            code: 500,
            message: "VIP 等级配置错误",
          };
        }

        if (!vip.isValidVip || vip.vipTierCode !== vipScope.vipTier) {
          set.status = 403;
          return {
            code: 403,
            message: `需要 ${requiredTier.name} VIP`,
            required: vipScope.vipTier,
            current: vip.vipTierCode,
          };
        }
      }
    });

  return app;
}

export default vipPlugin;
