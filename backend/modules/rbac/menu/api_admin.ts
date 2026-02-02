import { Elysia, t } from "elysia";
import { menuService } from "./service";
import {
	createMenuBody,
	updateMenuBody,
	menuIdParams,
	menuQueryParams,
	MenuSchema,
	MenuTreeSchema,
} from "./model";
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from "@/modules/response";
import { authPlugin } from "@/modules/auth";
import { rbacPlugin } from "@/modules/rbac";
import { vipPlugin } from "@/modules/vip";

/** 菜单管理控制器（管理端） */
export const menuAdminController = new Elysia({ prefix: "/menu", tags: ["管理 - 菜单"] })
	.use(authPlugin())
	.use(rbacPlugin())
	.use(vipPlugin())
	/** 获取菜单列表 */
	.get("/", async ({ query }) => {
		const result = await menuService.findAll(query);
		return R.page(result);
	}, {
		query: menuQueryParams,
		response: {
			200: PagedResponse(MenuSchema, "菜单列表分页数据"),
		},
		detail: {
			summary: "获取菜单列表",
			description: "分页获取菜单列表，支持按名称、状态、类型筛选\n\n🔐 **所需权限**: `menu:list`",
			security: [{ bearerAuth: [] }],
			rbac: { scope: { permissions: ["menu:list"] } },
		},
	})

	/** 获取菜单树 */
	.get("/tree", async () => {
		const data = await menuService.getTree();
		return R.ok(data);
	}, {
		response: {
			200: SuccessResponse(t.Array(MenuTreeSchema), "菜单树形结构数据"),
		},
		detail: {
			summary: "获取菜单树",
			description: "获取菜单的树形结构，包含父子层级关系\n\n🔐 **所需权限**: `menu:tree`",
			security: [{ bearerAuth: [] }],
			rbac: { scope: { permissions: ["menu:tree"] } },
		},
	})

	/** 根据ID获取菜单 */
	.get("/:id", async ({ params }) => {
		const data = await menuService.findById(params.id);
		if (!data) return R.notFound("菜单");
		return R.ok(data);
	}, {
		params: menuIdParams,
		response: {
			200: SuccessResponse(MenuSchema, "菜单详情数据"),
			404: ErrorResponse,
		},
		detail: {
			summary: "获取菜单详情",
			description: "根据菜单ID获取菜单详细信息\n\n🔐 **所需权限**: `menu:read`",
			security: [{ bearerAuth: [] }],
			rbac: { scope: { permissions: ["menu:read"] } },
		},
	})

	/** 创建菜单 */
	.post("/", async ({ body }) => {
		const data = await menuService.create(body);
		return R.ok(data, "创建成功");
	}, {
		body: createMenuBody,
		response: {
			200: SuccessResponse(MenuSchema, "新创建的菜单信息"),
		},
		detail: {
			summary: "创建菜单",
			description: "创建新菜单，支持目录、菜单、按钮三种类型\n\n🔐 **所需权限**: `menu:create`",
			security: [{ bearerAuth: [] }],
			rbac: { scope: { permissions: ["menu:create"] } },
		},
	})

	/** 更新菜单 */
	.put("/:id", async ({ params, body }) => {
		const existing = await menuService.findById(params.id);
		if (!existing) return R.notFound("菜单");
		const data = await menuService.update(params.id, body);
		return R.ok(data, "更新成功");
	}, {
		params: menuIdParams,
		body: updateMenuBody,
		response: {
			200: SuccessResponse(MenuSchema, "更新后的菜单信息"),
			404: ErrorResponse,
		},
		detail: {
			summary: "更新菜单",
			description: "更新指定菜单的信息，支持部分更新\n\n🔐 **所需权限**: `menu:update`",
			security: [{ bearerAuth: [] }],
			rbac: { scope: { permissions: ["menu:update"] } },
		},
	})

	/** 删除菜单 */
	.delete("/:id", async ({ params }) => {
		const existing = await menuService.findById(params.id);
		if (!existing) return R.notFound("菜单");
		await menuService.delete(params.id);
		return R.success("删除成功");
	}, {
		params: menuIdParams,
		response: {
			200: MessageResponse,
			404: ErrorResponse,
		},
		detail: {
			summary: "删除菜单",
			description: "删除指定菜单，此操作不可恢复\n\n🔐 **所需权限**: `menu:delete`",
			security: [{ bearerAuth: [] }],
			rbac: { scope: { permissions: ["menu:delete"] } },
		},
	});

export default menuAdminController;
