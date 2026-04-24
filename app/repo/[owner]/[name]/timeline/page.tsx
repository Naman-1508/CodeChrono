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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-green)" }} />
      </div>
    );
  }

  return (
    <main
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center gap-4 px-6 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}
      >
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00ffaa, #0ea5e9)" }}>
            <Clock size={13} style={{ color: "#0a0a0f" }} />
          </div>
          <span className="font-bold text-sm hidden md:block" style={{ color: "var(--text-primary)" }}>
            Time Rewind
          </span>
        </Link>

        <span className="text-sm mono" style={{ color: "var(--text-muted)" }}>{fullName}</span>

        <div className="flex-1">
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
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all flex-shrink-0"
          style={{
            background: showHeatmap ? "rgba(255,107,53,0.15)" : "var(--bg-elevated)",
            border: `1px solid ${showHeatmap ? "rgba(255,107,53,0.4)" : "var(--border)"}`,
            color: showHeatmap ? "#ff6b35" : "var(--text-secondary)",
          }}
        >
          <Flame size={14} /> Hotspots
        </button>
      </header>

      {/* Timeline scrubber */}
      <div
        className="flex-shrink-0 px-6 pt-3 pb-2"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}
      >
        <TimelineScrubber
          commits={(commits ?? []) as any[]}
          chapters={(chapters ?? []) as any[]}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Left panel */}
        <div className="flex flex-col gap-4 overflow-y-auto" style={{ width: showHeatmap ? 320 : 360, flexShrink: 0 }}>
          {selectedCommit ? (
            <CommitCard commit={selectedCommit as any} totalCommits={(commits ?? []).length} />
          ) : (
            <div className="glass rounded-2xl p-6 text-center" style={{ color: "var(--text-muted)" }}>
              No commit selected
            </div>
          )}

          {showHeatmap && fileStats && (
            <HeatmapOverlay
              fileStats={fileStats}
              onFileSelect={(path) => setSelectedFile(path)}
            />
          )}
        </div>

        {/* Right panel — Code viewer */}
        <div className="flex-1 overflow-hidden">
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
            <div
              className="h-full flex items-center justify-center rounded-2xl"
              style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-muted)" }}
            >
              Select a commit on the timeline above
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
