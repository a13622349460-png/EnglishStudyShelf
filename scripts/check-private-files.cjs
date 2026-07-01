const { execFileSync } = require("node:child_process");

const forbiddenExact = new Set([
  "task_plan.md",
  "progress.md",
  "findings.md",
  "USER_WORKLOG.md",
  ".env"
]);

const forbiddenPrefixes = [
  "data/",
  "node_modules/",
  "apps/api/dist/",
  "apps/web/dist/",
  "dist/"
];

const forbiddenExtensions = [
  /\.pdf$/i,
  /\.sqlite$/i,
  /\.sqlite3$/i,
  /\.db$/i,
  /\.log$/i,
  /\.tsbuildinfo$/i
];

function git(args) {
  const output = execFileSync("git", args, { encoding: "utf8" }).trim();
  return output ? output.split(/\r?\n/) : [];
}

function normalize(path) {
  return path.replaceAll("\\", "/");
}

const tracked = git(["ls-files"]).map(normalize);
const blocked = tracked.filter((path) => {
  if (forbiddenExact.has(path)) {
    return true;
  }

  if (forbiddenPrefixes.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix))) {
    return true;
  }

  return forbiddenExtensions.some((pattern) => pattern.test(path));
});

if (blocked.length) {
  console.error("Private/local files are tracked by Git and must not be published:");
  console.error("以下私密或本地文件正在被 Git 追踪，不能上传：");
  for (const path of blocked) {
    console.error(`- ${path}`);
  }
  console.error("");
  console.error("Fix: remove them from Git tracking while keeping local copies, for example:");
  console.error("修复：只取消 Git 追踪，保留本地文件，例如：");
  console.error("git rm --cached <file>");
  process.exit(1);
}

console.log("Private file guard passed / 私密文件检查通过");
