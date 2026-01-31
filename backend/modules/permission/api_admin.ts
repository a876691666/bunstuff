import { Elysia } from "elysia";
import { permissionService } from "./service";
import {
	createPermissionBody,
	updatePermissionBody,
	permissionIdParams,
	permissionQueryParams,
	PermissionSchema,
} from "./model";
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from "../response";

/** 权限管理控制器（管理端） */
export const permissionAdminController = new Elysia({ prefix: "/permission", tags: ["管理 - 权限"] })
	/** 获取权限列表 */
	.get("/", async ({ query }) => {
		const result = await permissionService.findAll(query);
		return R.page(result);
	}, {
		query: permissionQueryParams,
		response: {
			200: PagedResponse(PermissionSchema, "权限列表分页数据"),
		},
		detail: {
			summary: "获取权限列表",
			description: "分页获取权限列表，支持按名称、编码、资源筛选\n\n🔐 **所需权限**: `permission:list`",
			security: [{ bearerAuth: [] }],
			scope: { permissions: ["permission:list"] },
		},
	})

	/** 根据ID获取权限 */
	.get("/:id", async ({ params }) => {
		const data = await permissionService.findById(params.id);
		if (!data) return R.notFound("权限");
		return R.ok(data);
	}, {
		params: permissionIdParams,
		response: {
			200: SuccessResponse(PermissionSchema, "权限详情数据"),
			404: ErrorResponse,
		},
		detail: {
			summary: "获取权限详情",
			description: "根据权限ID获取权限详细信息\n\n🔐 **所需权限**: `permission:read`",
			security: [{ bearerAuth: [] }],
			scope: { permissions: ["permission:read"] },
		},
	})

	/** 创建权限 */
	.post("/", async ({ body }) => {
		// 检查编码是否已存在
		const existing = await permissionService.findByCode(body.code);
		if (existing) return R.badRequest("权限编码已存在");
		const data = await permissionService.create(body);
		return R.ok(data, "创建成功");
	}, {
		body: createPermissionBody,
		response: {
			200: SuccessResponse(PermissionSchema, "新创建的权限信息"),
			400: ErrorResponse,
		},
		detail: {
			summary: "创建权限",
			description: "创建新权限，权限编码必须唯一，格式建议：资源:操作，如 user:create\n\n🔐 **所需权限**: `permission:create`",
			security: [{ bearerAuth: [] }],
			scope: { permissions: ["permission:create"] },
		},
	})

	/** 更新权限 */
	.put("/:id", async ({ params, body }) => {
		const existing = await permissionService.findById(params.id);
		if (!existing) return R.notFound("权限");
		// 如果更新编码，检查是否重复
		if (body.code && body.code !== existing.code) {
			const codeExists = await permissionService.findByCode(body.code);
			if (codeExists) return R.badRequest("权限编码已存在");
		}
		const data = await permissionService.update(params.id, body);
		return R.ok(data, "更新成功");
	}, {
		params: permissionIdParams,
		body: updatePermissionBody,
		response: {
			200: SuccessResponse(PermissionSchema, "更新后的权限信息"),
			400: ErrorResponse,
			404: ErrorResponse,
		},
		detail: {
			summary: "更新权限",
			description: "更新指定权限的信息，支持部分更新\n\n🔐 **所需权限**: `permission:update`",
			security: [{ bearerAuth: [] }],
			scope: { permissions: ["permission:update"] },
		},
	})

	/** 删除权限 */
	.delete("/:id", async ({ params }) => {
		const existing = await permissionService.findById(params.id);
		if (!existing) return R.notFound("权限");
		await permissionService.delete(params.id);
		return R.success("删除成功");
	}, {
		params: permissionIdParams,
		response: {
			200: MessageResponse,
			404: ErrorResponse,
		},
		detail: {
			summary: "删除权限",
			description: "删除指定权限，此操作不可恢复\n\n🔐 **所需权限**: `permission:delete`",
			security: [{ bearerAuth: [] }],
			scope: { permissions: ["permission:delete"] },
		},
	});

export default permissionAdminController;
