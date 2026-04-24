"use client";

import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  GitCommit,
  Users,
  Star,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
  Code2,
  Layers,
} from "lucide-react";
import Link from "next/link";

const STATUS_MESSAGES: Record<string, string> = {
  queued: "Queued for analysis…",
  fetching_commits: "Fetching commit history from GitHub…",
  processing_diffs: "Processing file diffs…",
  computing_heuristics: "Computing analysis & building chapters…",
  ready: "Analysis complete!",
  error: "Analysis failed",
};

export default function RepoPage() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const router = useRouter();
  const fullName = `${owner}/${name}`;

  const repo = useQuery(api.repos.getByFullName, { fullName });
  const commits = useQuery(
    api.commits.getCommitsByRepo,
    repo?.status === "ready" ? { repoId: repo._id } : "skip"
  );

  if (repo === undefined) {
    return <LoadingScreen />;
  }

  if (!repo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "var(--accent-red)" }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Repo not found</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            This repository hasn't been analyzed yet.
          </p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2 mt-6">
            Analyze a Repo
          </Link>
        </div>
      </div>
    );
  }

  if (repo.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-center max-w-md glass rounded-2xl p-8">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "var(--accent-red)" }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Analysis Failed</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{repo.errorMessage}</p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (repo.status !== "ready") {
    return <ProcessingScreen repo={repo} />;
  }

  // Compute stats from commits
  const authors = new Set((commits ?? []).map((c: { authorEmail: string }) => c.authorEmail));
  const dateRange = commits && commits.length > 0
    ? `${formatDate(commits[0].timestamp)} → ${formatDate(commits[commits.length - 1].timestamp)}`
    : "—";

  const areaCounts: Record<string, number> = {};
  for (const c of commits ?? []) {
    areaCounts[c.featureArea] = (areaCounts[c.featureArea] ?? 0) + 1;
  }
  const topAreas = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00ffaa, #0ea5e9)" }}>
            <Clock size={16} style={{ color: "#0a0a0f" }} />
          </div>
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>Time Rewind</span>
        </Link>
        <span className="text-sm font-mono px-3 py-1 rounded-lg" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
          {fullName}
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Repo header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Code2 size={28} style={{ color: "var(--accent-green)" }} />
              <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
                {fullName}
              </h1>
            </div>
            {repo.description && (
              <p className="text-lg" style={{ color: "var(--text-secondary)" }}>{repo.description}</p>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <GitCommit size={18} />, label: "Commits", value: repo.totalCommits.toLocaleString(), color: "#00ffaa" },
              { icon: <Users size={18} />, label: "Contributors", value: authors.size.toString(), color: "#0ea5e9" },
              { icon: <Star size={18} />, label: "Stars", value: (repo.starCount ?? 0).toLocaleString(), color: "#f59e0b" },
              { icon: <Layers size={18} />, label: "Language", value: repo.language ?? "Mixed", color: "#7c3aed" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
                  {stat.icon}
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {stat.label}
                  </span>
                </div>
                <div className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Date range */}
          <div className="glass rounded-2xl p-5 mb-8">
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Commit history</p>
            <p className="font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{dateRange}</p>
          </div>

          {/* Top areas */}
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Primary Code Areas</h2>
            <div className="flex flex-wrap gap-3">
              {topAreas.map(([area, count]) => (
                <div key={area} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  <span className="font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{area}</span>
                  <span>·</span>
                  <span>{count} commits</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href={`/repo/${owner}/${name}/timeline`}
              id="explore-timeline-btn"
              className="btn-primary inline-flex items-center gap-3 text-lg"
            >
              Explore Timeline <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function ProcessingScreen({ repo }: { repo: any }) {
  const progress = repo.progress ?? 0;
  const message = STATUS_MESSAGES[repo.status] ?? "Processing…";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-10 max-w-md w-full mx-6 text-center"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #00ffaa20, #0ea5e920)" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-green)" }} />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Analyzing {repo.fullName}
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{message}</p>

        {/* Progress bar */}
        <div className="w-full rounded-full overflow-hidden mb-4" style={{ height: 8, background: "var(--bg-elevated)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #00ffaa, #0ea5e9)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{repo.processedCommits} / {repo.totalCommits} commits</span>
          <span>{progress}%</span>
        </div>
      </motion.div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-green)" }} />
    </div>
  );
}
