"use client";
// Force dynamic rendering — Clerk requires browser runtime
export const dynamic = "force-dynamic";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { parseGitHubUrl } from "@/lib/utils";
import { AuthBar } from "@/components/AuthBar";
import { UserDashboard } from "@/components/UserDashboard";
import { ArrowRight, Clock, Search, Zap, Layers, GitBranch, AlertCircle } from "lucide-react";

const EXAMPLE_REPOS = [
  "facebook/react",
  "vercel/next.js",
  "microsoft/vscode",
  "tailwindlabs/tailwindcss",
];

const FEATURES = [
  {
    icon: <Clock size={20} />,
    title: "Scrubble Timeline",
    desc: "Drag through the entire commit history with a cinematic scrubber.",
  },
  {
    icon: <Layers size={20} />,
    title: "Auto Chapters",
    desc: "Commits clustered into meaningful feature chapters automatically.",
  },
  {
    icon: <GitBranch size={20} />,
    title: "File Evolution",
    desc: "Monaco diff viewer shows exactly what changed at every commit.",
  },
  {
    icon: <Zap size={20} />,
    title: "Hotspot Detection",
    desc: "Instantly see which files are changed most often across the project.",
  },
];

export default function HomePage() {
  const { bestToken, clerkUser } = useAuth();
  const router = useRouter();
  const ingestRepo = useAction(api.ingestion.ingestRepo);
  const totalRepos = useQuery(api.repos.getTotalCount);

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");

    const parsed = parseGitHubUrl(url.trim());
    if (!parsed) {
      setError("Please enter a valid GitHub repository URL (e.g. github.com/owner/repo)");
      return;
    }

    const { owner, repo: name } = parsed;
    const repoFullName = `${owner}/${name}`;

    setLoading(true);
    try {
      await ingestRepo({
        repoFullName,
        token: bestToken ?? undefined,
        userId: clerkUser?.id ?? undefined,
      });
      router.push(`/repo/${owner}/${name}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository. Ensure it is public or you have provided a valid PAT token.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#050810", color: "#f8fafc" }}>
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #0ea5e9, #00ffaa)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #00ffaa, #0ea5e9)" }} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20" style={{ background: "linear-gradient(135deg, #00ffaa, #0ea5e9)" }}>
            <Clock size={20} style={{ color: "#050810" }} />
          </div>
          <span className="font-black text-xl tracking-tight text-white drop-shadow-md">
            CodeChrono
          </span>
        </div>

        <div className="flex items-center gap-4">
          {totalRepos !== undefined && totalRepos > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
              <Layers size={12} className="text-cyan-400" />
              {totalRepos.toLocaleString()} Repos Analyzed
            </span>
          )}
          <AuthBar />
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-24 space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold mb-2">
            <Zap size={14} fill="currentColor" /> No AI. Pure Deterministic Analysis.
          </div>
          <h1 className="text-6xl sm:text-7xl font-black leading-[1.1] tracking-tight text-white drop-shadow-2xl">
            Time Travel Through <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #00ffaa, #0ea5e9, #3b82f6)" }}>
              Any Codebase
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Turn thousands of commits into a visual, interactive timeline. See how architectures evolve, spot hotspots, and understand legacy code instantly.
          </p>
        </motion.div>

        {/* ── URL Input ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto space-y-4"
        >
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
            <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
              <Search size={20} className="absolute left-6 text-slate-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/facebook/react"
                className="w-full pl-14 pr-32 py-4 bg-transparent text-white placeholder-slate-500 outline-none text-lg font-medium"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all overflow-hidden group/btn"
                style={{
                  background: loading || !url.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #00ffaa, #0ea5e9)",
                  color: loading || !url.trim() ? "#64748b" : "#050810",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#050810]/30 border-t-[#050810] rounded-full animate-spin" /> Analyzing</span>
                ) : (
                  <>Analyze <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </form>

          {error && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-sm text-red-400 flex items-center gap-2 justify-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
              <AlertCircle size={16} /> {error}
            </motion.p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="text-sm text-slate-500 font-medium">Try it out:</span>
            {EXAMPLE_REPOS.map((repo, i) => (
              <motion.button
                key={repo}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => setUrl(`https://github.com/${repo}`)}
                className="text-xs px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-cyan-500/50 hover:text-white transition-all shadow-sm"
              >
                {repo}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── User dashboard ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <UserDashboard />
        </motion.div>

        {/* ── Feature grid ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/5 hover:border-cyan-500/30 transition-all shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400 border border-cyan-500/20">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
