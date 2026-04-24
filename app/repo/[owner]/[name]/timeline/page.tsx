"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { TimelineScrubber } from "@/components/TimelineScrubber";
import { CommitCard } from "@/components/CommitCard";
import { CodeViewer } from "@/components/CodeViewer";
import { FilterBar } from "@/components/FilterBar";
import { HeatmapOverlay } from "@/components/HeatmapOverlay";
import { Clock, Loader2, Flame } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type Filters = {
  query: string;
  featureArea: string;
  changeType: string;
  author: string;
};

export default function TimelinePage() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const fullName = `${owner}/${name}`;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filters, setFilters] = useState<Filters>({ query: "", featureArea: "", changeType: "", author: "" });

  const repo = useQuery(api.repos.getByFullName, { fullName });
  const allCommits = useQuery(
    api.commits.getCommitsByRepo,
    repo?._id ? { repoId: repo._id } : "skip"
  );
  const chapters = useQuery(
    api.commits.getChaptersByRepo,
    repo?._id ? { repoId: repo._id } : "skip"
  );
  const fileStats = useQuery(
    api.commits.getFileStats,
    repo?._id ? { repoId: repo._id } : "skip"
  );

  // Filtered commits
  const commits = useMemo(() => {
    if (!allCommits) return [];
    return allCommits.filter((c) => {
      if (filters.query && !c.cleanMessage.toLowerCase().includes(filters.query.toLowerCase())) return false;
      if (filters.featureArea && c.featureArea !== filters.featureArea) return false;
      if (filters.changeType && c.changeType !== filters.changeType) return false;
      if (filters.author && c.authorEmail !== filters.author) return false;
      return true;
    });
  }, [allCommits, filters]);

  const selectedCommit = useMemo(
    () => (commits ?? []).find((c) => c.index === selectedIndex) ?? (commits ?? [])[0] ?? null,
    [commits, selectedIndex]
  );

  const prevCommit = useMemo(
    () => (selectedCommit ? (commits ?? []).find((c) => c.index === selectedCommit.index - 1) : null),
    [commits, selectedCommit]
  );

  // Unique authors and areas for filters
  const authors: string[] = useMemo(
    () => Array.from(new Set((allCommits ?? []).map((c) => c.authorEmail))),
    [allCommits]
  );
  const featureAreas: string[] = useMemo(
    () => Array.from(new Set((allCommits ?? []).map((c) => c.featureArea))).sort(),
    [allCommits]
  );

  if (!repo || !allCommits) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#050810" }}>
        <Loader2 size={48} className="animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <main
      className="h-screen flex flex-col overflow-hidden relative"
      style={{ background: "#050810" }}
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* Top bar */}
      <header
        className="relative z-20 flex items-center gap-4 px-6 py-3 flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 shadow-md"
      >
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-105" style={{ background: "linear-gradient(135deg, #00ffaa, #0ea5e9)" }}>
            <Clock size={16} style={{ color: "#0a0a0f" }} />
          </div>
          <span className="font-black text-white hidden md:block tracking-tight drop-shadow-md">
            CodeChrono
          </span>
        </Link>

        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono text-xs font-semibold shadow-inner">
          {fullName}
        </span>

        <div className="flex-1 ml-4">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            authors={authors}
            featureAreas={featureAreas}
          />
        </div>

        <button
          id="heatmap-toggle-btn"
          onClick={() => setShowHeatmap((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 shadow-lg"
          style={{
            background: showHeatmap ? "linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.05))" : "rgba(255,255,255,0.05)",
            border: `1px solid ${showHeatmap ? "rgba(255,107,53,0.5)" : "rgba(255,255,255,0.1)"}`,
            color: showHeatmap ? "#ff9871" : "#94a3b8",
          }}
        >
          <Flame size={14} className={showHeatmap ? "animate-pulse" : ""} /> Hotspots
        </button>
      </header>

      {/* Timeline scrubber */}
      <div
        className="relative z-10 flex-shrink-0 px-6 pt-3 pb-2 bg-slate-900/40 backdrop-blur-md border-b border-white/5"
      >
        <TimelineScrubber
          commits={(commits ?? []) as any[]}
          chapters={(chapters ?? []) as any[]}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex flex-1 overflow-hidden gap-6 p-6">
        {/* Left panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-4 overflow-y-auto" style={{ width: showHeatmap ? 340 : 380, flexShrink: 0 }}
        >
          {selectedCommit ? (
            <CommitCard commit={selectedCommit as any} totalCommits={(commits ?? []).length} />
          ) : (
            <div className="rounded-3xl p-8 text-center bg-slate-900/50 backdrop-blur-xl border border-white/5 text-slate-500 font-medium">
              No commit selected
            </div>
          )}

          {showHeatmap && fileStats && (
            <HeatmapOverlay
              fileStats={fileStats}
              onFileSelect={(path) => setSelectedFile(path)}
            />
          )}
        </motion.div>

        {/* Right panel — Code viewer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 overflow-hidden rounded-3xl border border-white/5 shadow-2xl bg-[#0a0a0f] relative"
        >
          {selectedCommit ? (
            <CodeViewer
              owner={owner}
              repo={name}
              commitSha={selectedCommit.sha}
              prevSha={prevCommit?.sha}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              changedFiles={selectedCommit.changedFiles}
              newFiles={selectedCommit.newFiles}
              deletedFiles={selectedCommit.deletedFiles}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-medium bg-slate-900/30">
              Select a commit on the timeline above
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
