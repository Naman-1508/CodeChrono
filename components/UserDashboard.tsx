"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Clock, GitBranch } from "lucide-react";

export function UserDashboard() {
  const { isSignedIn, clerkUser } = useAuth();

  const previousRepos = useQuery(
    api.repos.getReposByUser,
    isSignedIn && clerkUser ? { userId: clerkUser.id } : "skip"
  );

  if (!isSignedIn) {
    return (
      <div className="p-8 rounded-3xl text-center border border-white/5 bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <h2 className="text-xl font-bold mb-3 text-white">Save your analysis history</h2>
        <p className="text-sm mb-6 text-slate-400">
          Sign in to revisit analyzed repos anytime.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20"
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
            color: "white",
          }}
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock size={18} className="text-cyan-400" /> Recent Analyses
        </h2>
      </div>

      {!previousRepos ? (
        <div className="p-8 rounded-3xl text-center border border-white/5 bg-slate-900/40 backdrop-blur-sm animate-pulse">
          <p className="text-slate-500 text-sm">Loading history...</p>
        </div>
      ) : previousRepos.length === 0 ? (
        <div className="p-10 rounded-3xl text-center border border-white/5 bg-slate-900/40 backdrop-blur-sm shadow-inner">
          <p className="text-slate-400 text-sm">No repositories analyzed yet.</p>
          <p className="text-slate-500 text-xs mt-2">Enter a GitHub URL above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {previousRepos.map((r) => (
            <Link
              key={r._id}
              href={`/repo/${r.fullName}`}
              className="block p-5 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 hover:border-cyan-500/30 transition-all shadow-lg group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white mb-1 truncate max-w-[200px]" title={r.fullName}>
                    {r.fullName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <GitBranch size={12} /> {r.totalCommits?.toLocaleString() ?? 0} commits
                    </span>
                  </div>
                </div>
                {r.status !== "error" && r.status !== "ready" ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded border bg-yellow-500/10 border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                    Processing
                  </div>
                ) : r.status === "error" ? (
                  <div className="px-2 py-1 rounded border bg-red-500/10 border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                    Failed
                  </div>
                ) : (
                  <div className="px-2 py-1 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    Ready
                  </div>
                )}
              </div>
              <div className="mt-3 text-[10px] text-slate-500 font-medium">
                Last viewed: {new Date(r.lastAnalyzedAt ?? r.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
