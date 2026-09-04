import fs from "node:fs";
import path from "node:path";

import { eq, sql } from "drizzle-orm";
import pdf from "pdf-parse";

import { db } from "@earthworm/db";
import {
  coursePack as coursePackSchema,
  course as courseSchema,
  statement as statementSchema,
} from "@earthworm/schema";
import { parse as parsePdfText } from "./parsePDF/parser";

// ---------------------------------------------------------------------------
// 本地课程导入 CLI（无 Docker、免登录本地部署专用）
//
// 用法（仓库根目录运行，或用 pnpm -F @earthworm/xingrong-courses import ...）:
//   tsx src/import-cli.ts pack:list
//   tsx src/import-cli.ts pack:create --title "我的课程包" [--description "..."] [--cover <url|本地图片>] [--public] [--order N]
//   tsx src/import-cli.ts course:add --pack <packId> (--file <json文件|目录> | --pdf <pdf文件|目录>) [--title "..."] [--video "..."]
//   tsx src/import-cli.ts course:delete <courseId> --yes
//   tsx src/import-cli.ts pack:delete <packId> --yes
//
// 安全约定：默认只追加数据，绝不清空已有课程/学习记录。
// 旧脚本 seed.ts 会清空整库重灌，仅供初始化空库时使用。
// ---------------------------------------------------------------------------

const LOCAL_USER_ID = "local-user";
// tsx 运行时 __dirname 是 packages/xingrong-courses/src，仓库根在上三级
const ROOT = path.resolve(__dirname, "../../..");

type Args = Record<string, string | boolean>;

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function fail(msg: string): never {
  console.error(`[import-cli] 错误: ${msg}`);
  process.exit(1);
}

const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
function toChineseLesson(n: number): string {
  if (n <= 10) return `第${CN[n]}课`;
  if (n < 20) return `第十${CN[n - 10]}课`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `第${CN[tens]}十${ones ? CN[ones] : ""}课`;
}

function resolveCover(cover?: string): string {
  if (!cover) return "";
  if (/^https?:\/\//.test(cover)) return cover;
  const abs = path.resolve(cover);
  if (!fs.existsSync(abs)) fail(`封面文件不存在: ${abs}`);
  const name = path.basename(abs);
  for (const dir of [
    path.join(ROOT, "apps/client/public/covers"),
    path.join(ROOT, "apps/client/.output/public/covers"),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(abs, path.join(dir, name));
  }
  return `/covers/${name}`;
}

function listJsonFiles(target: string): string[] {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) fail(`路径不存在: ${abs}`);
  const files = fs.statSync(abs).isDirectory()
    ? fs
        .readdirSync(abs)
        .filter((f) => f.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((f) => path.join(abs, f))
    : [abs];
  if (!files.length) fail(`目录里没有 .json 文件: ${abs}`);
  return files;
}

function listPdfFiles(target: string): string[] {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) fail(`路径不存在: ${abs}`);
  const files = fs.statSync(abs).isDirectory()
    ? fs
        .readdirSync(abs)
        .filter((f) => f.endsWith(".pdf"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((f) => path.join(abs, f))
    : [abs];
  if (!files.length) fail(`目录里没有 .pdf 文件: ${abs}`);
  return files;
}

type RawStatement = { chinese: string; english: string; soundmark?: string };

function statementsFromJson(file: string): RawStatement[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as RawStatement[];
  if (!Array.isArray(raw) || !raw.length) fail(`JSON 格式无效(需要非空数组): ${file}`);
  return raw
    .filter((s) => s && typeof s.chinese === "string" && typeof s.english === "string")
    .map((s) => ({ chinese: s.chinese, english: s.english, soundmark: s.soundmark ?? "" }));
}

async function statementsFromPdf(file: string): Promise<RawStatement[]> {
  const dataBuffer = fs.readFileSync(file);
  const data = await pdf(dataBuffer);
  const result = parsePdfText(data.text) as RawStatement[];
  if (!result.length) fail(`PDF 解析结果为空(需为"中文 英文 音标"版式): ${file}`);
  return result;
}

async function ensurePack(packId?: string): Promise<{ id: string; title: string }> {
  if (!packId) fail("缺少 --pack <packId>，先用 pack:list 查看课程包 id");
  const pack = await db.query.coursePack.findFirst({ where: eq(coursePackSchema.id, packId) });
  if (!pack) fail(`课程包不存在: ${packId}，用 pack:list 查看`);
  return pack;
}

async function nextCourseOrder(packId: string): Promise<number> {
  const row = await db
    .select({ maxOrder: sql<number>`coalesce(max(${courseSchema.order}), 0)` })
    .from(courseSchema)
    .where(eq(courseSchema.coursePackId, packId));
  return Number(row[0]?.maxOrder ?? 0) + 1;
}

async function insertStatements(courseId: string, list: RawStatement[]) {
  for (let i = 0; i < list.length; i++) {
    await db.insert(statementSchema).values({
      order: i + 1,
      chinese: list[i].chinese,
      english: list[i].english,
      soundmark: list[i].soundmark || "",
      courseId,
    });
  }
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  switch (command) {
    case "pack:list": {
      const packs = await db.query.coursePack.findMany({
        orderBy: (p, { asc }) => [asc(p.order)],
      });
      for (const p of packs) {
        const courses = await db.query.course.findMany({
          where: eq(courseSchema.coursePackId, p.id),
        });
        console.log(
          `[${p.id}] order=${p.order} ${p.title} — ${courses.length} 课 (${p.shareLevel})`,
        );
      }
      if (!packs.length) console.log("（还没有课程包）");
      break;
    }

    case "pack:create": {
      const title = String(args.title ?? "");
      if (!title) fail('缺少 --title "课程包名称"');
      const maxOrderRow = await db
        .select({ maxOrder: sql<number>`coalesce(max(${coursePackSchema.order}), 0)` })
        .from(coursePackSchema);
      const order = args.order ? Number(args.order) : Number(maxOrderRow[0]?.maxOrder ?? 0) + 1;
      const [pack] = await db
        .insert(coursePackSchema)
        .values({
          order,
          title,
          description: String(args.description ?? ""),
          isFree: true,
          cover: resolveCover(args.cover as string | undefined),
          creatorId: LOCAL_USER_ID,
          shareLevel: args.public ? "public" : "private",
        })
        .returning();
      console.log(`课程包已创建: [${pack.id}] ${pack.title}`);
      console.log(
        `后续导入: tsx src/import-cli.ts course:add --pack ${pack.id} --file <json或目录>`,
      );
      break;
    }

    case "course:add": {
      const pack = await ensurePack(args.pack as string | undefined);
      const title = args.title ? String(args.title) : undefined;
      const video = args.video ? String(args.video) : "";

      let sources: { name: string; load: () => Promise<RawStatement[]> }[] = [];
      if (args.file) {
        sources = listJsonFiles(String(args.file)).map((f) => ({
          name: path.parse(f).name,
          load: () => Promise.resolve(statementsFromJson(f)),
        }));
      } else if (args.pdf) {
        sources = listPdfFiles(String(args.pdf)).map((f) => ({
          name: path.parse(f).name,
          load: () => statementsFromPdf(f),
        }));
      } else {
        fail("缺少数据来源: --file <json文件|目录> 或 --pdf <pdf文件|目录>");
      }

      let order = await nextCourseOrder(pack.id);
      for (const source of sources) {
        const statements = await source.load();
        const autoTitle =
          sources.length > 1
            ? /^\d+$/.test(source.name)
              ? toChineseLesson(Number(source.name))
              : source.name
            : title ??
              (/^\d+$/.test(source.name) ? toChineseLesson(Number(source.name)) : source.name);
        const [course] = await db
          .insert(courseSchema)
          .values({ coursePackId: pack.id, order, title: autoTitle, video })
          .returning({ id: courseSchema.id, title: courseSchema.title });
        await insertStatements(course.id, statements);
        console.log(
          `已导入: ${pack.title} / ${autoTitle}（${statements.length} 句, order=${order}, id=${course.id}）`,
        );
        order++;
      }
      break;
    }

    case "course:delete": {
      const courseId = rest.find((r) => !r.startsWith("--"));
      if (!courseId) fail("用法: course:delete <courseId> --yes");
      if (!args.yes) fail("删除不可恢复，确认请加 --yes");
      const course = await db.query.course.findFirst({ where: eq(courseSchema.id, courseId) });
      if (!course) fail(`课程不存在: ${courseId}`);
      await db.delete(statementSchema).where(eq(statementSchema.courseId, courseId));
      await db.delete(courseSchema).where(eq(courseSchema.id, courseId));
      console.log(`已删除课程及其语句: ${course.title} (${courseId})`);
      break;
    }

    case "pack:delete": {
      const packId = rest.find((r) => !r.startsWith("--"));
      if (!packId) fail("用法: pack:delete <packId> --yes");
      if (!args.yes) fail("删除不可恢复，确认请加 --yes");
      const pack = await ensurePack(packId);
      const courses = await db.query.course.findMany({
        where: eq(courseSchema.coursePackId, pack.id),
      });
      for (const c of courses) {
        await db.delete(statementSchema).where(eq(statementSchema.courseId, c.id));
        await db.delete(courseSchema).where(eq(courseSchema.id, c.id));
      }
      await db.delete(coursePackSchema).where(eq(coursePackSchema.id, pack.id));
      console.log(`已删除课程包及其中 ${courses.length} 课: ${pack.title}`);
      break;
    }

    default:
      fail(
        "未知命令。可用: pack:list | pack:create | course:add | course:delete | pack:delete（详见 LOCAL-DEPLOY.md）",
      );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
