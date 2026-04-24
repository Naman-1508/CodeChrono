import { analyzeCommit, cleanCommitMessage } from "../lib/heuristics";

// ─── Change Type Tests ────────────────────────────────────────────────────────

describe("analyzeCommit — changeType", () => {
  test('feat: prefix → "feature"', () => {
    const r = analyzeCommit({ message: "feat: add login page", linesAdded: 100, linesRemoved: 10, filesChanged: 5, changedFiles: ["auth/login.tsx"], newFiles: ["auth/login.tsx"], deletedFiles: [] });
    expect(r.changeType).toBe("feature");
  });

  test('fix: prefix → "bugfix"', () => {
    const r = analyzeCommit({ message: "fix: resolve null pointer in auth", linesAdded: 5, linesRemoved: 3, filesChanged: 1, changedFiles: ["auth/middleware.ts"], newFiles: [], deletedFiles: [] });
    expect(r.changeType).toBe("bugfix");
  });

  test('refactor: prefix → "refactor"', () => {
    const r = analyzeCommit({ message: "refactor: extract utility functions", linesAdded: 30, linesRemoved: 80, filesChanged: 3, changedFiles: ["lib/utils.ts"], newFiles: [], deletedFiles: [] });
    expect(r.changeType).toBe("refactor");
  });

  test('docs: prefix with .md files → "docs"', () => {
    const r = analyzeCommit({ message: "docs: update README", linesAdded: 20, linesRemoved: 5, filesChanged: 1, changedFiles: ["README.md"], newFiles: [], deletedFiles: [] });
    expect(r.changeType).toBe("docs");
  });

  test('chore: prefix → "chore"', () => {
    const r = analyzeCommit({ message: "chore: update dependencies", linesAdded: 0, linesRemoved: 0, filesChanged: 1, changedFiles: ["package-lock.json"], newFiles: [], deletedFiles: [] });
    expect(r.changeType).toBe("chore");
  });

  test('BREAKING CHANGE in body → "breaking"', () => {
    const r = analyzeCommit({ message: "feat: new API\n\nBREAKING CHANGE: removed old endpoint", linesAdded: 200, linesRemoved: 50, filesChanged: 10, changedFiles: ["api/routes.ts"], newFiles: [], deletedFiles: [] });
    expect(r.changeType).toBe("breaking");
  });

  test('no prefix, only .test.ts files → "test"', () => {
    const r = analyzeCommit({ message: "Add auth tests", linesAdded: 60, linesRemoved: 0, filesChanged: 2, changedFiles: ["auth/login.test.ts", "auth/register.test.ts"], newFiles: ["auth/login.test.ts", "auth/register.test.ts"], deletedFiles: [] });
    expect(r.changeType).toBe("test");
  });

  test('no prefix, only .md files → "docs"', () => {
    const r = analyzeCommit({ message: "Update contributing guide", linesAdded: 30, linesRemoved: 5, filesChanged: 2, changedFiles: ["CONTRIBUTING.md", "README.md"], newFiles: [], deletedFiles: [] });
    expect(r.changeType).toBe("docs");
  });
});

// ─── Feature Area Tests ───────────────────────────────────────────────────────

describe("analyzeCommit — featureArea", () => {
  test('files in /auth/ → "auth"', () => {
    const r = analyzeCommit({ message: "feat: jwt refresh", linesAdded: 50, linesRemoved: 0, filesChanged: 2, changedFiles: ["auth/tokens.ts", "auth/middleware.ts"], newFiles: [], deletedFiles: [] });
    expect(r.featureArea).toBe("auth");
  });

  test('files in /components/ → "ui"', () => {
    const r = analyzeCommit({ message: "feat: new button", linesAdded: 30, linesRemoved: 0, filesChanged: 1, changedFiles: ["components/Button.tsx"], newFiles: [], deletedFiles: [] });
    expect(r.featureArea).toBe("ui");
  });

  test('files in /api/ → "api"', () => {
    const r = analyzeCommit({ message: "fix: endpoint crash", linesAdded: 5, linesRemoved: 2, filesChanged: 1, changedFiles: ["api/users.ts"], newFiles: [], deletedFiles: [] });
    expect(r.featureArea).toBe("api");
  });

  test("majority vote — 3 auth files, 1 api → auth", () => {
    const r = analyzeCommit({ message: "feat: oauth", linesAdded: 100, linesRemoved: 0, filesChanged: 4, changedFiles: ["auth/oauth.ts", "auth/session.ts", "auth/jwt.ts", "api/endpoints.ts"], newFiles: [], deletedFiles: [] });
    expect(r.featureArea).toBe("auth");
  });
});

// ─── Significance Tests ───────────────────────────────────────────────────────

describe("analyzeCommit — significance", () => {
  test("1000 lines changed → score >= 7", () => {
    const r = analyzeCommit({ message: "feat: major rewrite", linesAdded: 800, linesRemoved: 200, filesChanged: 25, changedFiles: Array.from({ length: 25 }, (_, i) => `file${i}.ts`), newFiles: [], deletedFiles: [] });
    expect(r.significance).toBeGreaterThanOrEqual(7);
  });

  test("5 lines changed, chore → score <= 3", () => {
    const r = analyzeCommit({ message: "chore: fix typo", linesAdded: 3, linesRemoved: 2, filesChanged: 1, changedFiles: ["README.md"], newFiles: [], deletedFiles: [] });
    expect(r.significance).toBeLessThanOrEqual(3);
  });

  test("breaking change → score >= 8", () => {
    const r = analyzeCommit({ message: "feat!: breaking api change\n\nBREAKING CHANGE: removed auth", linesAdded: 300, linesRemoved: 200, filesChanged: 15, changedFiles: Array.from({ length: 15 }, (_, i) => `api/route${i}.ts`), newFiles: [], deletedFiles: [] });
    expect(r.significance).toBeGreaterThanOrEqual(8);
  });

  test("all scores clamped between 1-10", () => {
    for (let i = 0; i < 10; i++) {
      const r = analyzeCommit({
        message: "feat: test",
        linesAdded: i * 100,
        linesRemoved: i * 50,
        filesChanged: i * 3,
        changedFiles: Array.from({ length: i * 3 }, (_, j) => `file${j}.ts`),
        newFiles: Array.from({ length: i }, (_, j) => `new${j}.ts`),
        deletedFiles: [],
      });
      expect(r.significance).toBeGreaterThanOrEqual(1);
      expect(r.significance).toBeLessThanOrEqual(10);
    }
  });
});

// ─── Clean Message Tests ──────────────────────────────────────────────────────

describe("cleanCommitMessage", () => {
  test('"feat(auth): Add login" → "Add login"', () => {
    expect(cleanCommitMessage("feat(auth): Add login")).toBe("Add login");
  });

  test('"fix: resolve bug" → "Resolve bug"', () => {
    expect(cleanCommitMessage("fix: resolve bug")).toBe("Resolve bug");
  });

  test('"Add new feature" (no prefix) → unchanged', () => {
    expect(cleanCommitMessage("Add new feature")).toBe("Add new feature");
  });

  test('"chore(deps): bump version" → "Bump version"', () => {
    expect(cleanCommitMessage("chore(deps): bump version")).toBe("Bump version");
  });
});
