"use client";

import { formatRelativeTime, formatDate } from "@/lib/utils";
import { CHANGE_TYPE_COLORS, AREA_COLORS } from "@/lib/heuristics";
import { GitCommit, Plus, Minus, FileText, Star } from "lucide-react";

type Commit = {
  _id: string;
  sha: string;
  shortSha: string;
  cleanMessage: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  timestamp: number;
  index: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  changedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
  changeType: string;
  featureArea: string;
  significance: number;
};

type Props = {
  commit: Commit;
  totalCommits: number;
};

export function CommitCard({ commit, totalCommits }: Props) {
  const typeColor = CHANGE_TYPE_COLORS[commit.changeType] ?? "#94a3b8";
  const areaColor = AREA_COLORS[commit.featureArea] ?? "#6366f1";
  const stars = Math.ceil(commit.significance / 2); // 1-5 stars

  return (
    <div className="glass rounded-2xl p-5 animate-fade-in">
      {/* Header badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="badge"
          style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}
        >
          {commit.changeType}
        </span>
        <span
          className="badge"
          style={{ background: `${areaColor}15`, color: areaColor, border: `1px solid ${areaColor}30` }}
        >
          {commit.featureArea}
        </span>
        <span className="mono text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
          #{commit.index + 1}/{totalCommits}
        </span>
      </div>

      {/* Message */}
      <h2 className="text-base font-bold mb-2 leading-snug" style={{ color: "var(--text-primary)" }}>
        {commit.cleanMessage}
      </h2>

      {/* Significance stars */}
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            fill={i < stars ? typeColor : "transparent"}
            stroke={i < stars ? typeColor : "var(--text-muted)"}
          />
        ))}
        <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
          significance {commit.significance}/10
        </span>
      </div>

      {/* Author + time */}
      <div className="flex items-center gap-3 mb-4">
        {commit.authorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={commit.authorAvatar}
            alt={commit.authorName}
            className="w-7 h-7 rounded-full"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: typeColor + "20", color: typeColor }}
          >
            {commit.authorName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {commit.authorName}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {formatDate(commit.timestamp)} · {formatRelativeTime(commit.timestamp)}
          </p>
        </div>
      </div>

      {/* Diff stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5" style={{ color: "#10b981" }}>
          <Plus size={14} />
          <span>{commit.linesAdded.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: "#ef4444" }}>
          <Minus size={14} />
          <span>{commit.linesRemoved.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
          <FileText size={14} />
          <span>{commit.filesChanged} files</span>
        </div>
      </div>

      {/* SHA */}
      <div className="flex items-center gap-2">
        <GitCommit size={13} style={{ color: "var(--text-muted)" }} />
        <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>
          {commit.sha}
        </span>
      </div>

      {/* Changed files preview */}
      {commit.changedFiles.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            FILES CHANGED
          </p>
          <div className="space-y-1">
            {commit.changedFiles.slice(0, 6).map((f) => {
              const isNew = commit.newFiles.includes(f);
              const isDel = commit.deletedFiles.includes(f);
              return (
                <div key={f} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: isNew ? "#10b981" : isDel ? "#ef4444" : "#f59e0b",
                    }}
                  />
                  <span className="mono text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                    {f}
                  </span>
                </div>
              );
            })}
            {commit.changedFiles.length > 6 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                +{commit.changedFiles.length - 6} more files
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
