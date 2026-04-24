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
import { ArrowRight, Clock, Search, Zap, Layers, GitBranch } from "lucide-react";

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
      setError(err instanceof Error ? err.message : "Failed to analyze repository");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className="relative flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00ffaa, #0ea5e9)" }}
          >
            <Clock size={16} style={{ color: "#0a0a0f" }} />
          </div>
          <span className="font-black text-lg" style={{ color: "var(--text-primary)" }}>
            CodeChrono
          </span>
        </div>

        {/* Total repos analyzed */}
        {totalRepos !== undefined && totalRepos > 0 && (
          <span className="hidden sm:block text-xs" style={{ color: "var(--text-muted)" }}>
            {totalRepos.toLocaleString()} repos analyzed
          </span>
        )}

        <AuthBar />
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-6 py-20 space-y-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-5"
        >
          <h1 className="text-5xl font-black leading-tight" style={{ color: "var(--text-primary)" }}>
            Explore any GitHub repo
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #00ffaa, #0ea5e9)" }}
            >
              through time
            </span>
          </h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Visual timeline. File evolution. Zero setup. No AI — just math.
          </p>
        </motion.div>

        {/* ── URL Input ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="repo-url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/facebook/react"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0ea5e9")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
            <button
              id="analyze-btn"
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background:
                  loading || !url.trim()
                    ? "var(--bg-elevated)"
                    : "linear-gradient(135deg, #00ffaa, #0ea5e9)",
                color: loading || !url.trim() ? "var(--text-muted)" : "#0a0a0f",
              }}
            >
              {loading ? "Analyzing…" : <>Analyze <ArrowRight size={14} /></>}
            </button>
          </form>

          {error && (
            <p className="text-sm flex items-center gap-1.5" style={{ color: "#ef4444" }}>
              ⚠ {error}
            </p>
          )}

          {/* Example repos */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_REPOS.map((repo) => (
              <button
                key={repo}
                onClick={() => setUrl(`https://github.com/${repo}`)}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,255,170,0.4)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                {repo}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── User dashboard (signed-in history) ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <UserDashboard />
        </motion.div>

        {/* ── Feature grid ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: "var(--accent-green)" }}>
                {f.icon}
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {f.title}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
