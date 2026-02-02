import { Elysia, t } from "elysia";
import { fileService } from "./service";
import { SysFileSchema, fileIdParams } from "./model";
import { R, SuccessResponse, ErrorResponse } from "@/modules/response";
import { authPlugin } from "@/modules/auth";
import { rbacPlugin } from "@/modules/rbac";
import { vipPlugin } from "@/modules/vip";
import { filePlugin } from "./plugin";

/** 文件客户端控制器 */
export const fileController = new Elysia({ prefix: "/file", tags: ["客户端 - 文件"] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(filePlugin())
  /** 上传文件 */
  .post("/upload", async ({ body, userId }) => {
    if (!userId) return R.unauthorized();
    const file = body.file;
    const result = await fileService.uploadLocal(file, userId);
    return R.ok(result, "上传成功");
  }, {
    body: t.Object({
      file: t.File({ description: "上传的文件" }),
    }),
    response: { 200: SuccessResponse(SysFileSchema), 400: ErrorResponse },
    detail: {
      summary: "上传文件",
      description: "上传文件到本地存储",
      security: [{ bearerAuth: [] }],
    },
  })

  /** 下载文件 */
  .get("/download/:id", async ({ params }) => {
    const result = await fileService.getFileContent(params.id);
    if (!result) {
      return new Response("File not found", { status: 404 });
    }

    const { buffer, file } = result;
    return new Response(buffer, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  }, {
    params: fileIdParams,
    detail: {
      summary: "下载文件",
      description: "下载指定ID的文件",
    },
  })

  /** 流式下载文件 */
  .get("/stream/:id", async ({ params }) => {
    const result = await fileService.getFileStream(params.id);
    if (!result) {
      return new Response("File not found", { status: 404 });
    }

    const { stream, file } = result;
    return new Response(stream, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        "Content-Length": String(file.size),
      },
    });
  }, {
    params: fileIdParams,
    detail: {
      summary: "流式下载文件",
      description: "流式下载指定ID的文件（适合大文件）",
    },
  })

  /** 预览文件 */
  .get("/preview/:id", async ({ params }) => {
    const result = await fileService.getFileContent(params.id);
    if (!result) {
      return new Response("File not found", { status: 404 });
    }

    const { buffer, file } = result;
    return new Response(buffer, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
  }, {
    params: fileIdParams,
    detail: {
      summary: "预览文件",
      description: "在浏览器中预览文件",
    },
  });
