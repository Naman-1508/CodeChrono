// ────────────────────────────────────────────────────────────────────────────
// lib/heuristics.ts  —  Pure deterministic commit analysis (NO AI)
// ────────────────────────────────────────────────────────────────────────────

export type ChangeType =
  | "feature"
  | "bugfix"
  | "refactor"
  | "docs"
  | "test"
  | "chore"
  | "breaking";

export type CommitInput = {
  message: string;
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
  changedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
};

export type HeuristicsResult = {
  changeType: ChangeType;
  featureArea: string;
  significance: number; // 1-10
  cleanMessage: string;
};

// ─── Change Type ─────────────────────────────────────────────────────────────

const CONVENTIONAL_PREFIXES: Array<[RegExp, ChangeType]> = [
  [/^feat(\(.+?\))?!?:/i, "feature"],
  [/^feature(\(.+?\))?!?:/i, "feature"],
  [/^fix(\(.+?\))?!?:/i, "bugfix"],
  [/^bugfix(\(.+?\))?!?:/i, "bugfix"],
  [/^hotfix(\(.+?\))?!?:/i, "bugfix"],
  [/^refactor(\(.+?\))?!?:/i, "refactor"],
  [/^refact(\(.+?\))?!?:/i, "refactor"],
  [/^perf(\(.+?\))?!?:/i, "refactor"],
  [/^performance(\(.+?\))?!?:/i, "refactor"],
  [/^docs?(\(.+?\))?!?:/i, "docs"],
  [/^test(s|ing)?(\(.+?\))?!?:/i, "test"],
  [/^spec(\(.+?\))?!?:/i, "test"],
  [/^chore(\(.+?\))?!?:/i, "chore"],
  [/^build(\(.+?\))?!?:/i, "chore"],
  [/^ci(\(.+?\))?!?:/i, "chore"],
  [/^style(\(.+?\))?!?:/i, "chore"],
  [/^revert(\(.+?\))?!?:/i, "chore"],
];

const CONFIG_EXTENSIONS = new Set([
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".config",
  ".env",
  ".lock",
]);
const DOC_EXTENSIONS = new Set([".md", ".txt", ".rst", ".mdx"]);
const TEST_PATTERNS = [".test.ts", ".test.tsx", ".test.js", ".spec.ts", ".spec.tsx", ".spec.js"];

function detectChangeType(input: CommitInput): ChangeType {
  const msg = input.message;

  // 1. BREAKING CHANGE anywhere in message body
  if (msg.includes("BREAKING CHANGE") || msg.match(/^.+!:/)) {
    return "breaking";
  }

  // 2. Conventional commit prefix
  for (const [pattern, type] of CONVENTIONAL_PREFIXES) {
    if (pattern.test(msg.trim())) return type;
  }

  // 3. File extension heuristics
  const files = input.changedFiles;
  if (files.length === 0) return "chore";

  const allDocs = files.every((f) => DOC_EXTENSIONS.has(getExt(f)));
  if (allDocs) return "docs";

  const allTests = files.every((f) => TEST_PATTERNS.some((p) => f.endsWith(p)));
  if (allTests) return "test";

  const allConfig = files.every((f) => CONFIG_EXTENSIONS.has(getExt(f)));
  if (allConfig) return "chore";

  const totalLines = input.linesAdded + input.linesRemoved;
  const removalRatio = totalLines > 0 ? input.linesRemoved / totalLines : 0;
  if (removalRatio > 0.6) return "refactor";

  if (input.newFiles.length > 0 && input.linesAdded > 50) return "feature";

  return "feature";
}

function getExt(filePath: string): string {
  const parts = filePath.split(".");
  return parts.length > 1 ? "." + parts[parts.length - 1].toLowerCase() : "";
}

// ─── Feature Area ─────────────────────────────────────────────────────────────

const AREA_PATTERNS: Array<[string[], string]> = [
  [["auth", "login", "session", "jwt", "oauth", "token", "password", "credential"], "auth"],
  [["api", "routes", "endpoints", "controllers", "handlers", "rest", "graphql"], "api"],
  [["db", "database", "migrations", "models", "prisma", "drizzle", "schema", "mongo", "postgres", "sql"], "database"],
  [["components", "pages", "views", "ui", "screens", "layout", "modal", "dialog", "button", "form"], "ui"],
  [["test", "spec", "tests", "__tests__", "e2e", "cypress", "playwright", "jest", "vitest"], "testing"],
  [["docs", "documentation", "wiki", "readme", "changelog"], "docs"],
  [["config", "settings", ".env", "environment", "constants"], "config"],
  [["utils", "helpers", "lib", "shared", "common", "hooks"], "utils"],
  [["deploy", "ci", ".github", "docker", "k8s", "kubernetes", "actions", "workflows"], "devops"],
  [["styles", "css", "scss", "theme", "tokens", "design", "tailwind"], "ui"],
];

function detectFeatureArea(changedFiles: string[]): string {
  if (changedFiles.length === 0) return "general";

  const votes: Record<string, number> = {};

  for (const file of changedFiles) {
    const lower = file.toLowerCase();
    let matched = false;
    for (const [keywords, area] of AREA_PATTERNS) {
      if (keywords.some((kw) => lower.includes(kw))) {
        votes[area] = (votes[area] ?? 0) + 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Fallback: top-level directory
      const topDir = lower.split("/")[0];
      votes[topDir] = (votes[topDir] ?? 0) + 1;
    }
  }

  const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  return winner ? winner[0] : "general";
}

// ─── Significance Score ───────────────────────────────────────────────────────

function computeSignificance(input: CommitInput, changeType: ChangeType): number {
  let base = 1;

  const totalLines = input.linesAdded + input.linesRemoved;
  if (totalLines > 500) base += 3;
  else if (totalLines > 100) base += 2;
  else if (totalLines > 20) base += 1;

  if (input.filesChanged > 20) base += 2;
  else if (input.filesChanged > 5) base += 1;

  const newFileCount = input.newFiles.length;
  if (newFileCount > 5) base += 2;
  else if (newFileCount > 0) base += 1;

  if (changeType === "breaking") base = Math.min(base * 1.5, 10);
  else if (changeType === "feature") base = Math.min(base * 1.2, 10);
  else if (changeType === "chore") base = Math.max(base * 0.7, 1);

  return Math.max(1, Math.min(10, Math.round(base)));
}

// ─── Clean Message ────────────────────────────────────────────────────────────

export function cleanCommitMessage(message: string): string {
  // Strip conventional commit prefix: "feat(auth): " → ""
  const stripped = message
    .replace(/^(feat|fix|docs?|style|refactor|refact|perf|performance|test|tests?|spec|chore|build|ci|revert|hotfix|bugfix|feature)(\(.+?\))?!?:\s*/i, "")
    .trim();

  if (!stripped) return message;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function analyzeCommit(input: CommitInput): HeuristicsResult {
  const changeType = detectChangeType(input);
  const featureArea = detectFeatureArea(input.changedFiles);
  const significance = computeSignificance(input, changeType);
  const cleanMessage = cleanCommitMessage(input.message);

  return { changeType, featureArea, significance, cleanMessage };
}

// ─── Chapter Naming ───────────────────────────────────────────────────────────

const CHAPTER_NAME_MAP: Record<string, Record<string, string>> = {
  feature: {
    auth: "Auth System Development",
    api: "API Feature Development",
    database: "Database Schema Evolution",
    ui: "UI Feature Development",
    testing: "Test Suite Expansion",
    docs: "Documentation Growth",
    config: "Configuration Updates",
    utils: "Utility Development",
    devops: "DevOps Pipeline Setup",
    general: "Major Feature Development",
  },
  bugfix: {
    auth: "Auth Bug Fixes",
    api: "API Bug Fixes",
    database: "Database Fixes",
    ui: "UI Bug Fixes",
    testing: "Test Fixes",
    docs: "Doc Corrections",
    config: "Config Fixes",
    utils: "Utility Fixes",
    devops: "Pipeline Fixes",
    general: "Bug Fix Sprint",
  },
  refactor: {
    auth: "Auth Refactoring",
    api: "API Refactoring",
    database: "Database Refactoring",
    ui: "UI Refactoring",
    testing: "Test Refactoring",
    docs: "Doc Restructure",
    config: "Config Cleanup",
    utils: "Utility Refactoring",
    devops: "DevOps Refactoring",
    general: "Codebase Refactoring",
  },
  breaking: {
    general: "Breaking Changes",
  },
  chore: {
    devops: "CI/CD & Infrastructure",
    config: "Configuration Maintenance",
    general: "Maintenance & Chores",
  },
  docs: { general: "Documentation Updates" },
  test: { general: "Testing & Quality" },
};

export function getChapterName(changeType: ChangeType, featureArea: string): string {
  const byType = CHAPTER_NAME_MAP[changeType] ?? {};
  return byType[featureArea] ?? byType["general"] ?? `${featureArea} — ${changeType}`;
}

// ─── Chapter Colors ───────────────────────────────────────────────────────────

export const AREA_COLORS: Record<string, string> = {
  auth: "#7c3aed",
  api: "#0ea5e9",
  database: "#f59e0b",
  ui: "#ec4899",
  testing: "#10b981",
  docs: "#94a3b8",
  config: "#64748b",
  devops: "#ff6b35",
  utils: "#00ffaa",
  general: "#6366f1",
};

export function getAreaColor(area: string): string {
  return AREA_COLORS[area] ?? "#6366f1";
}

export const CHANGE_TYPE_COLORS: Record<string, string> = {
  feature: "#00ffaa",
  bugfix: "#ff6b35",
  refactor: "#7c3aed",
  docs: "#0ea5e9",
  test: "#10b981",
  chore: "#94a3b8",
  breaking: "#ef4444",
};
