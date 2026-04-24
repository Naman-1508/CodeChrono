"use client";

import { formatRelativeTime, formatDate } from "@/lib/utils";
import { CHANGE_TYPE_COLORS, AREA_COLORS } from "@/lib/heuristics";
import { GitCommit, Plus, Minus, FileText, Star } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div 
      key={commit._id}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl p-6 bg-slate-900/60 backdrop-blur-xl border shadow-2xl relative overflow-hidden group"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      {/* Background Glow */}
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none transition-all group-hover:opacity-40" 
        style={{ background: typeColor }} 
      />

      {/* Header badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap relative z-10">
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-inner"
          style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}
        >
          {commit.changeType}
        </span>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-inner"
          style={{ background: `${areaColor}15`, color: areaColor, border: `1px solid ${areaColor}30` }}
        >
          {commit.featureArea}
        </span>
        <span className="font-mono text-xs ml-auto font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
          #{commit.index + 1}/{totalCommits}
        </span>
      </div>

      {/* Message */}
      <h2 className="text-xl font-black mb-3 leading-snug text-white tracking-tight relative z-10">
        {commit.cleanMessage}
      </h2>

      {/* Significance stars */}
      <div className="flex items-center gap-1 mb-5 relative z-10">
        <div className="flex bg-black/20 p-1 rounded-full border border-white/5 shadow-inner">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              fill={i < stars ? typeColor : "transparent"}
              stroke={i < stars ? typeColor : "#475569"}
              className="mx-0.5"
            />
          ))}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest ml-2 text-slate-500">
          Impact {commit.significance}/10
        </span>
      </div>

      {/* Author + time */}
      <div className="flex items-center gap-3 mb-5 relative z-10">
        {commit.authorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={commit.authorAvatar}
            alt={commit.authorName}
            className="w-10 h-10 rounded-full border-2 border-slate-800 shadow-md"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border border-white/5 shadow-md"
            style={{ background: typeColor + "20", color: typeColor }}
          >
            {commit.authorName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-white">
            {commit.authorName}
          </p>
          <p className="text-xs font-medium text-slate-400">
            {formatDate(commit.timestamp)} · {formatRelativeTime(commit.timestamp)}
          </p>
        </div>
      </div>

      {/* Diff stats */}
      <div className="flex items-center gap-4 mb-5 p-3 rounded-2xl bg-black/20 border border-white/5 shadow-inner relative z-10">
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-1 text-emerald-400 font-bold mb-0.5">
            <Plus size={14} /> <span>{commit.linesAdded.toLocaleString()}</span>
          </div>
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Added</span>
        </div>
        <div className="w-[1px] h-6 bg-white/10" />
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-1 text-red-400 font-bold mb-0.5">
            <Minus size={14} /> <span>{commit.linesRemoved.toLocaleString()}</span>
          </div>
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Removed</span>
        </div>
        <div className="w-[1px] h-6 bg-white/10" />
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-1 text-cyan-400 font-bold mb-0.5">
            <FileText size={14} /> <span>{commit.filesChanged}</span>
          </div>
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Files</span>
        </div>
      </div>

      {/* SHA */}
      <div className="flex items-center gap-2 mb-2 relative z-10">
        <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center shadow-inner border border-white/5">
          <GitCommit size={12} className="text-slate-400" />
        </div>
        <span className="font-mono text-xs font-semibold text-slate-400 bg-black/30 px-2 py-0.5 rounded border border-white/5">
          {commit.sha}
        </span>
      </div>

      {/* Changed files preview */}
      {commit.changedFiles.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/5 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-slate-500">
            Files Modified
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {commit.changedFiles.slice(0, 10).map((f) => {
              const isNew = commit.newFiles.includes(f);
              const isDel = commit.deletedFiles.includes(f);
              return (
                <div key={f} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors group/file">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 shadow-inner group-hover/file:scale-125 transition-transform"
                    style={{
                      background: isNew ? "#34d399" : isDel ? "#f87171" : "#fbbf24",
                    }}
                  />
                  <span className="font-mono text-[11px] truncate text-slate-300 font-medium">
                    {f}
                  </span>
                </div>
              );
            })}
            {commit.changedFiles.length > 10 && (
              <p className="text-[11px] font-bold text-cyan-500/80 mt-2 pl-2 text-center py-1 bg-cyan-500/10 rounded-lg">
                +{commit.changedFiles.length - 10} more files
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
