import type { SeedDefinition } from "@/modules/seed/main/service";

// 文件元数据表无需初始化数据
export const sysFileSeed: SeedDefinition = {
  name: "sys-file-init",
  description: "文件元数据表初始化（无数据）",
  async run() {
    // 文件元数据表不需要初始化数据
  },
};
