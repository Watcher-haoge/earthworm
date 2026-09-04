import { defineNuxtPlugin } from "nuxt/app";

import { setupAuth } from "~/services/auth";

// 本地自部署模式：不再初始化 Logto SDK，仅保留 setupAuth 调用点
export default defineNuxtPlugin((nuxtApp) => {
  setupAuth();
});
