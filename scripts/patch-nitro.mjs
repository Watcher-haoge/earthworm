// 修复 nitro 2.9.6 在 Node >= 22.13 下的 ESM 求值顺序 bug：
// "ReferenceError: Cannot access 'handlers' before initialization"
// 幂等：已打过补丁的文件会原样跳过。重新 `nuxt build` 后需再次运行本脚本。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, "../apps/client/.output/server/chunks/runtime.mjs");

if (!fs.existsSync(file)) {
  console.error(`[patch-nitro] not found: ${file}`);
  process.exit(1);
}

let s = fs.readFileSync(file, "utf-8");

const callBefore =
  "const nitroApp$1 = createNitroApp$1();\nconst useNitroApp$1 = () => nitroApp$1;";
const callAfter = "let nitroApp$1;\nconst useNitroApp$1 = () => nitroApp$1;";
const handlersEnd = "];\n\nfunction createNitroApp()";
const handlersEndPatched = "];\n\nnitroApp$1 = createNitroApp$1();\n\nfunction createNitroApp()";

const already = s.includes("let nitroApp$1;") && s.includes(handlersEndPatched);

if (already) {
  console.log("[patch-nitro] already patched, skip.");
} else {
  if (!s.includes(callBefore) || !s.includes(handlersEnd)) {
    console.error("[patch-nitro] unexpected file layout, patch aborted.");
    process.exit(1);
  }
  s = s.replace(callBefore, callAfter, 1).replace(handlersEnd, handlersEndPatched, 1);
  fs.writeFileSync(file, s);
  console.log("[patch-nitro] patched runtime.mjs");
}
