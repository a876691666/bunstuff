import type { SeedDefinition } from "@/modules/seed/main/service";

// 通知已读记录表无需初始化数据
export const noticeReadSeed: SeedDefinition = {
  name: "notice-read-init",
  description: "通知已读记录表初始化（无数据）",
  async run() {
    // 通知已读记录表不需要初始化数据
  },
};
