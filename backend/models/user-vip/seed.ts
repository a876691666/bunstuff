import type { SeedDefinition } from "../../modules/seed/service";

/** 用户 VIP 表 Seed（空，无需初始数据） */
export const userVipSeed: SeedDefinition = {
  name: "user-vip-default",
  description: "用户 VIP 表无需初始数据",
  async run() {
    console.log("✅ 用户 VIP 表无需初始数据");
  },
};

export default userVipSeed;
