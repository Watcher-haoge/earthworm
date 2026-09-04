# Earthworm 本地部署指南（Windows · 无 Docker · 免登录）

本项目已改造为**纯 Node.js 本地自部署**形态：

- **数据库**：SQLite（better-sqlite3），单文件存于 `.volumes/earthworm.db`，无需 PostgreSQL/Docker
- **缓存/排行榜**：内存实现，无需 Redis
- **登录**：已移除 Logto 登录墙，所有请求自动视为本地用户 `local-user`
- **会员/权限**：课程包访问守卫全部放行，会员专属课程同样可学
- **已内置数据**：星荣零基础学英语（55 课 / 8865 句）

## 一、启动 / 停止

双击仓库根目录：

- `start-earthworm.bat` — 启动（Web: <http://localhost:3000>，API: <http://localhost:3001>）
- `stop-earthworm.bat` — 停止

前置条件：Node.js ≥ 20（本机 v22 已验证），依赖已安装（`node_modules` 就位）、前后端已构建（`apps/api/dist`、`apps/client/.output`）。

### 从零重建（换机器/重置后）

```powershell
pnpm install                 # 安装依赖
pnpm db:init                 # 建 SQLite 表（读 apps/api/.env 的 SQLITE_PATH）
pnpm -F @earthworm/xingrong-courses upload   # 可选：灌入内置 55 课（会清空课程数据！）
pnpm build:server && pnpm build:client       # 构建前后端
.\start-earthworm.bat
```

## 二、课程导入（import-cli）

工具位置：`packages/xingrong-courses/src/import-cli.ts`。**只追加、不清库**，随时可用，不影响学习记录。在仓库根目录或 `packages/xingrong-courses` 下运行：

```powershell
# 查看现有课程包（拿 packId）
pnpm -F @earthworm/xingrong-courses cli pack:list

# 新建自己的课程包（默认 private，--public 则公开显示）
pnpm -F @earthworm/xingrong-courses cli pack:create --title "我的课程包" --description "说明" --public
# 可选：--cover <图片路径或URL> 自动复制到前端 /covers/；--order N 指定排序

# 导入课程（三选一）
pnpm -F @earthworm/xingrong-courses cli course:add --pack <packId> --file D:\资料\lesson1.json --title "第一课"
pnpm -F @earthworm/xingrong-courses cli course:add --pack <packId> --file D:\资料\json目录\
pnpm -F @earthworm/xingrong-courses cli course:add --pack <packId> --pdf D:\资料\教材.pdf

# 删除（必须带 --yes）
pnpm -F @earthworm/xingrong-courses cli course:delete <courseId> --yes
pnpm -F @earthworm/xingrong-courses cli pack:delete <packId> --yes
```

### 数据格式

**JSON**（单课一个文件，数组）：

```json
[
  { "chinese": "我", "english": "I", "soundmark": "/aɪ/" },
  { "chinese": "喜欢", "english": "like", "soundmark": "/laɪk/" }
]
```

`soundmark` 可省略。**PDF**：需为「中文 英文 K.K.音标」三列版式（星荣教材格式），批量 PDF 按文件名数字排序自动命名为"第一课/第二课…"，纯数字文件名的 JSON 同理；其他文件名则用文件名做课名。导入后**无需重启**，刷新页面即见（API 实时读 SQLite）。

### 教材 PDF → JSON（可选）

```powershell
# 把 PDF 放进 packages/xingrong-courses/data/pdf/ 后：
pnpm -F @earthworm/xingrong-courses pdf:parse   # 交互式解析到 data/courses/
```

## 三、日常维护

- **备份**：复制 `.volumes/earthworm.db`（连同 `-wal`/`-shm`）即为全量备份
- **学习数据**：进度、掌握记录都在 SQLite 里，导入/删除课程不影响
- **换端口/路径**：改 `apps/api/.env`（`SQLITE_PATH`、`PORT`）与 `apps/client/.output` 的运行时配置
- **旧脚本注意**：`seed.ts`（`pnpm -F @earthworm/xingrong-courses upload`）会**清空全部课程重灌**，仅限初始化空库使用；日常导入一律用 import-cli

## 四、改造内容清单（相对上游）

| 位置                                          | 改动                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `packages/db`                                 | PostgreSQL+Drizzle/pg → SQLite+better-sqlite3；`init-local.ts` 幂等建表                        |
| `apps/api`                                    | 移除 Redis/Logto 依赖；AuthGuard 无条件放行为 `local-user`；课程包访问守卫放行；排行榜内存实现 |
| `apps/client/services/auth.ts`                | 免登录：`isAuthenticated()` 恒真，本地用户资料                                                 |
| 根目录                                        | `start-earthworm.bat` / `stop-earthworm.bat` 一键启停                                          |
| `packages/xingrong-courses/src/import-cli.ts` | **新增** 安全导入 CLI（pack:list / pack:create / course:add / course:delete / pack:delete）    |
