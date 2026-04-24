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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#050810" }}>
        <div className="text-center z-10 p-12 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl">
          <AlertCircle size={64} className="mx-auto mb-6 text-red-500/80 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h1 className="text-3xl font-black mb-3 text-white">Repository Not Found</h1>
          <p className="text-slate-400 font-medium mb-8">
            This repository hasn't been analyzed or doesn't exist.
          </p>
          <Link href="/" className="px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (repo.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#050810" }}>
        <div className="text-center z-10 max-w-md w-full p-10 bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-red-500/20 shadow-2xl shadow-red-500/10">
          <AlertCircle size={56} className="mx-auto mb-6 text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h1 className="text-2xl font-black mb-3 text-white">Analysis Failed</h1>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-8">
            <p className="text-sm font-mono text-red-300">{repo.errorMessage || "An unknown error occurred during ingestion."}</p>
          </div>
          <Link href="/" className="px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10">
            Try Another Repository
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
    <main className="min-h-screen relative overflow-hidden" style={{ background: "#050810" }}>
      {/* Background Effects */}
      <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #0ea5e9, #8b5cf6)" }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-[0.15] pointer-events-none" style={{ background: "radial-gradient(circle, #00ffaa, #0ea5e9)" }} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform group-hover:scale-105" style={{ background: "linear-gradient(135deg, #00ffaa, #0ea5e9)" }}>
            <Clock size={20} style={{ color: "#050810" }} />
          </div>
          <span className="font-black text-xl tracking-tight text-white drop-shadow-md">CodeChrono</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono text-sm shadow-inner">
            {fullName}
          </span>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          {/* Repo header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4 p-2 pr-6 rounded-full bg-white/5 border border-white/10 shadow-lg">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
                <Code2 size={20} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {fullName}
              </h1>
            </div>
            {repo.description && (
              <p className="text-lg text-slate-400 max-w-3xl mx-auto font-medium">{repo.description}</p>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <GitCommit size={20} />, label: "Commits", value: repo.totalCommits.toLocaleString(), color: "#00ffaa", gradient: "from-[#00ffaa]/10 to-transparent" },
              { icon: <Users size={20} />, label: "Contributors", value: authors.size.toString(), color: "#0ea5e9", gradient: "from-[#0ea5e9]/10 to-transparent" },
              { icon: <Star size={20} />, label: "Stars", value: (repo.starCount ?? 0).toLocaleString(), color: "#f59e0b", gradient: "from-[#f59e0b]/10 to-transparent" },
              { icon: <Layers size={20} />, label: "Language", value: repo.language ?? "Mixed", color: "#a855f7", gradient: "from-[#a855f7]/10 to-transparent" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label} 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`relative overflow-hidden rounded-3xl p-6 bg-slate-900/50 backdrop-blur-md border border-white/5 shadow-xl`}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${stat.gradient} opacity-50`} />
                <div className="relative z-10 flex items-center gap-3 mb-3" style={{ color: stat.color }}>
                  <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                    {stat.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {stat.label}
                  </span>
                </div>
                <div className="relative z-10 text-3xl font-black text-white tracking-tight">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Date range */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="col-span-1 rounded-3xl p-6 bg-slate-900/50 backdrop-blur-md border border-white/5 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Commit History Span</h2>
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-blue-400" />
                <p className="text-lg font-bold text-white tracking-tight">{dateRange}</p>
              </div>
            </motion.div>

            {/* Top areas */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="col-span-1 md:col-span-2 rounded-3xl p-6 bg-slate-900/50 backdrop-blur-md border border-white/5 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Primary Code Areas</h2>
              <div className="flex flex-wrap gap-2">
                {topAreas.map(([area, count]) => (
                  <div key={area} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                    <span className="font-bold text-white capitalize">{area}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="text-sm text-cyan-400 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center mt-16">
            <Link
              href={`/repo/${owner}/${name}/timeline`}
              id="explore-timeline-btn"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black text-lg transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10 text-white drop-shadow-md">Enter Timeline</span>
              <ArrowRight size={24} className="relative z-10 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

function ProcessingScreen({ repo }: { repo: any }) {
  const progress = repo.progress ?? 0;
  const message = STATUS_MESSAGES[repo.status] ?? "Processing…";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "#050810" }}>
      {/* Pulsing background glow during processing */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none" 
        style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }} 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-10 max-w-lg w-full mx-6 text-center border border-white/10 shadow-2xl shadow-cyan-500/10"
      >
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
          <motion.div 
            className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="text-cyan-400 animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-black mb-2 text-white tracking-tight">
          Analyzing <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{repo.fullName}</span>
        </h2>
        <p className="text-md mb-8 font-medium text-slate-400">{message}</p>

        {/* Progress bar */}
        <div className="w-full rounded-full overflow-hidden mb-4 p-1 bg-black/50 border border-white/5 shadow-inner">
          <motion.div
            className="h-3 rounded-full relative overflow-hidden"
            style={{ background: "linear-gradient(90deg, #00ffaa, #0ea5e9)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full" />
          </motion.div>
        </div>

        <div className="flex justify-between text-sm font-bold text-slate-500 px-1">
          <span>{repo.processedCommits.toLocaleString()} / {repo.totalCommits.toLocaleString()} commits</span>
          <span className="text-cyan-400">{progress}%</span>
        </div>
      </motion.div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#050810" }}>
      <Loader2 size={48} className="animate-spin text-cyan-500" />
    </div>
  );
}
