// ────────────────────────────────────────────────────────────────────────────
// convex/github.ts  —  GitHub API helpers (used inside Convex actions)
// ────────────────────────────────────────────────────────────────────────────

export type RawCommit = {
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  timestamp: number;
  parentShas: string[];
};

export type DiffStats = {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  changedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
};

export type TreeNode = {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
};

const GITHUB_API = "https://api.github.com";
const GITHUB_GQL = "https://api.github.com/graphql";

function buildHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "time-rewind-app/1.0",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function checkRateLimit(headers: Headers): Promise<void> {
  const remaining = parseInt(headers.get("X-RateLimit-Remaining") ?? "999", 10);
  const reset = parseInt(headers.get("X-RateLimit-Reset") ?? "0", 10);
  if (remaining < 10) {
    const waitMs = Math.max(0, reset * 1000 - Date.now()) + 2000;
    await sleep(waitMs);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      const backoff = Math.pow(2, attempt) * 1000;
      await sleep(backoff);
      continue;
    }
    // Non-retryable error
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API error ${res.status}: ${url} — ${text.slice(0, 200)}`);
  }
  throw new Error(`GitHub API failed after ${retries} retries: ${url}`);
}

// ─── Fetch All Commits (GraphQL — efficient pagination) ───────────────────────

const COMMITS_QUERY = `
query($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              oid
              message
              author {
                name
                email
                avatarUrl
                date
              }
              parents(first: 5) { nodes { oid } }
            }
          }
        }
      }
    }
  }
}`;

export async function fetchAllCommits(
  owner: string,
  repo: string,
  token?: string
): Promise<RawCommit[]> {
  const commits: RawCommit[] = [];
  let cursor: string | null = null;

  while (true) {
    const res = await fetchWithRetry(GITHUB_GQL, {
      method: "POST",
      headers: {
        ...buildHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: COMMITS_QUERY,
        variables: { owner, repo, cursor },
      }),
    });

    await checkRateLimit(res.headers);

    const json = (await res.json()) as {
      data: {
        repository: {
          defaultBranchRef: {
            target: {
              history: {
                pageInfo: { hasNextPage: boolean; endCursor: string };
                nodes: Array<{
                  oid: string;
                  message: string;
                  author: { name: string; email: string; avatarUrl: string; date: string };
                  parents: { nodes: Array<{ oid: string }> };
                }>;
              };
            };
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      throw new Error(`GraphQL error: ${json.errors[0].message}`);
    }

    const history = json.data?.repository?.defaultBranchRef?.target?.history;
    if (!history) break;

    for (const node of history.nodes) {
      commits.push({
        sha: node.oid,
        message: node.message.trim(),
        authorName: node.author.name ?? "Unknown",
        authorEmail: node.author.email ?? "",
        authorAvatar: node.author.avatarUrl ?? "",
        timestamp: new Date(node.author.date).getTime(),
        parentShas: node.parents.nodes.map((p) => p.oid),
      });
    }

    if (!history.pageInfo.hasNextPage) break;
    cursor = history.pageInfo.endCursor;
  }

  // Return in chronological order (oldest first)
  return commits.reverse();
}

// ─── Fetch Single Commit Diff ─────────────────────────────────────────────────

export async function fetchCommitDiff(
  owner: string,
  repo: string,
  sha: string,
  token?: string
): Promise<DiffStats> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`;
  const res = await fetchWithRetry(url, {
    headers: buildHeaders(token),
  });

  await checkRateLimit(res.headers);

  const json = (await res.json()) as {
    files?: Array<{ filename: string; status: string; additions: number; deletions: number }>;
    stats?: { additions: number; deletions: number };
  };

  const files = json.files ?? [];
  const changedFiles = files.map((f) => f.filename);
  const newFiles = files.filter((f) => f.status === "added").map((f) => f.filename);
  const deletedFiles = files.filter((f) => f.status === "removed").map((f) => f.filename);

  return {
    filesChanged: files.length,
    linesAdded: json.stats?.additions ?? 0,
    linesRemoved: json.stats?.deletions ?? 0,
    changedFiles,
    newFiles,
    deletedFiles,
  };
}

// ─── Fetch File Tree at SHA ────────────────────────────────────────────────────

export async function fetchFileTree(
  owner: string,
  repo: string,
  sha: string,
  token?: string
): Promise<TreeNode[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
  const res = await fetchWithRetry(url, { headers: buildHeaders(token) });
  await checkRateLimit(res.headers);

  const json = (await res.json()) as {
    tree: Array<{ path: string; type: string; sha: string; size?: number }>;
    truncated?: boolean;
  };

  return (json.tree ?? []).map((n) => ({
    path: n.path,
    type: n.type as "blob" | "tree",
    sha: n.sha,
    size: n.size,
  }));
}

// ─── Fetch File Content ────────────────────────────────────────────────────────

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  sha: string,
  token?: string
): Promise<string> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${sha}`;
  const res = await fetchWithRetry(url, { headers: buildHeaders(token) });
  await checkRateLimit(res.headers);

  const json = (await res.json()) as { content?: string; encoding?: string };

  if (json.encoding === "base64" && json.content) {
    return Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf-8");
  }

  return json.content ?? "";
}

// ─── Validate Repo ────────────────────────────────────────────────────────────

export async function validateRepo(
  owner: string,
  repo: string,
  token?: string
): Promise<{
  id: number;
  defaultBranch: string;
  description: string;
  language: string;
  starCount: number;
}> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}`;
  const res = await fetchWithRetry(url, { headers: buildHeaders(token) });
  await checkRateLimit(res.headers);

  const json = (await res.json()) as {
    id: number;
    default_branch: string;
    description: string;
    language: string;
    stargazers_count: number;
  };

  return {
    id: json.id,
    defaultBranch: json.default_branch,
    description: json.description ?? "",
    language: json.language ?? "",
    starCount: json.stargazers_count ?? 0,
  };
}
