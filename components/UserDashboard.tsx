"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { GitBranch, Clock, CheckCircle, Loader2 } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

export function UserDashboard() {
  const { isSignedIn, clerkUser } = useAuth();

  const previousRepos = useQuery(
    api.repos.getReposByUser,
    isSignedIn && clerkUser ? { userId: clerkUser.id } : "skip"
  );

  // Not signed in — show upsell
  if (!isSignedIn) {
    return (
      <div
        className="p-6 rounded-2xl text-center"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <Clock size={32} className="mx-auto mb-3 opacity-40" style={{ color: "var(--accent-green)" }} />
        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
          Save your analysis history
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Sign in to revisit analyzed repos anytime.
        </p>
        <Link
          href="/sign-in"
          className="inline-block text-sm px-4 py-2 rounded-lg transition-all"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  // Loading
  if (previousRepos === undefined) {
    return (
      <div className="flex items-center gap-2 justify-center py-6" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading your repos…</span>
      </div>
    );
  }

  // Empty history
  if (previousRepos.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        Your Recent Repos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {previousRepos.map((repo) => (
          <Link
            key={repo._id}
            href={`/repo/${repo.owner}/${repo.name}/timeline`}
            className="block group"
          >
            <div
              className="p-4 rounded-xl transition-all"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(0,255,170,0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <GitBranch size={13} style={{ color: "var(--accent-green)", flexShrink: 0 }} />
                    <p
                      className="text-sm font-medium truncate transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {repo.fullName}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {repo.totalCommits.toLocaleString()} commits ·{" "}
                    {formatRelativeTime(repo.lastAnalyzedAt ?? repo.createdAt)}
                  </p>
                </div>

                <span
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      repo.status === "ready"
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(245,158,11,0.1)",
                    color:
                      repo.status === "ready" ? "#10b981" : "#f59e0b",
                    border: `1px solid ${repo.status === "ready" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                  }}
                >
                  {repo.status === "ready" ? (
                    <>
                      <CheckCircle size={10} /> Ready
                    </>
                  ) : (
                    <>
                      <Loader2 size={10} className="animate-spin" /> Processing
                    </>
                  )}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
