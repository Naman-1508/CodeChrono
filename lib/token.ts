"use client";

const TOKEN_KEY = "codechrono_github_token";

export type TokenValidationResult = {
  valid: boolean;
  login?: string;
  avatarUrl?: string;
  name?: string;
  rateLimit?: number;
  rateLimitRemaining?: number;
  scopes?: string[];
  error?: string;
};

/** Save PAT to localStorage — validates format first */
export function saveToken(token: string): void {
  const trimmed = token.trim();
  if (!trimmed.startsWith("github_pat_") && !trimmed.startsWith("ghp_")) {
    throw new Error(
      "Invalid token format. Must start with github_pat_ or ghp_"
    );
  }
  localStorage.setItem(TOKEN_KEY, trimmed);
}

/** Read PAT from localStorage */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove PAT from localStorage */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Returns true if a PAT is currently stored */
export function hasToken(): boolean {
  return getToken() !== null;
}

/** Validate a PAT against the live GitHub API */
export async function validateToken(
  token: string
): Promise<TokenValidationResult> {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    };

    const [userRes, rateRes] = await Promise.all([
      fetch("https://api.github.com/user", { headers }),
      fetch("https://api.github.com/rate_limit", { headers }),
    ]);

    if (userRes.status === 401) {
      return { valid: false, error: "Token is invalid or expired" };
    }
    if (userRes.status === 403) {
      return { valid: false, error: "Token lacks required permissions" };
    }
    if (!userRes.ok) {
      return { valid: false, error: `GitHub API error: ${userRes.status}` };
    }

    const user = (await userRes.json()) as {
      login: string;
      avatar_url: string;
      name?: string;
    };
    const rate = (await rateRes.json()) as {
      rate: { limit: number; remaining: number };
    };
    const scopes =
      userRes.headers.get("X-OAuth-Scopes")?.split(", ").filter(Boolean) ?? [];

    return {
      valid: true,
      login: user.login,
      avatarUrl: user.avatar_url,
      name: user.name,
      rateLimit: rate.rate.limit,
      rateLimitRemaining: rate.rate.remaining,
      scopes,
    };
  } catch {
    return { valid: false, error: "Network error. Check your connection." };
  }
}

/**
 * Token priority:
 *   1. Fine-grained PAT from localStorage
 *   2. GitHub OAuth token from Clerk session
 *   3. null (anonymous, 60 req/hr)
 */
export function getBestToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Always prioritize user's locally entered PAT
  const pat = getToken();
  if (pat) return pat;

  // 2. Otherwise return null (we no longer try to use Clerk's token directly here)
  return null;
}
