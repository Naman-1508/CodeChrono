// ────────────────────────────────────────────────────────────────────────────
// convex/ingestionMutations.ts  —  All internal mutations (Convex runtime, NO "use node")
// ────────────────────────────────────────────────────────────────────────────

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { analyzeCommit, getChapterName, getAreaColor } from "../lib/heuristics";

const STATUS_VALIDATOR = v.union(
  v.literal("queued"),
  v.literal("fetching_commits"),
  v.literal("processing_diffs"),
  v.literal("computing_heuristics"),
  v.literal("ready"),
  v.literal("error")
);

// ─── upsertRepo ───────────────────────────────────────────────────────────────

export const upsertRepo = internalMutation({
  args: {
    owner: v.string(),
    name: v.string(),
    fullName: v.string(),
    githubId: v.number(),
    defaultBranch: v.string(),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    starCount: v.optional(v.number()),
    status: STATUS_VALIDATOR,
    progress: v.number(),
    totalCommits: v.number(),
    processedCommits: v.number(),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("repos")
      .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastAnalyzedAt: Date.now(),
        // Only update createdBy if it was previously unset (anonymous → logged in)
        ...(existing.createdBy ? {} : args.createdBy ? { createdBy: args.createdBy } : {}),
      });
      return existing._id as unknown as string;
    }

    const id = await ctx.db.insert("repos", { ...args, createdAt: Date.now() });
    return id as unknown as string;
  },
});

// ─── storeCommits ─────────────────────────────────────────────────────────────

export const storeCommits = internalMutation({
  args: {
    repoId: v.string(),
    commits: v.array(
      v.object({
        sha: v.string(),
        message: v.string(),
        authorName: v.string(),
        authorEmail: v.string(),
        authorAvatar: v.string(),
        timestamp: v.number(),
        parentShas: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, { repoId, commits }) => {
    // Clear old commits for this repo
    const existing = await ctx.db
      .query("commits")
      .withIndex("by_repo_index", (q) => q.eq("repoId", repoId as any))
      .collect();
    for (const c of existing) await ctx.db.delete(c._id);

    for (let i = 0; i < commits.length; i++) {
      const c = commits[i];
      await ctx.db.insert("commits", {
        repoId: repoId as any,
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        message: c.message,
        cleanMessage: c.message,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        authorAvatar: c.authorAvatar,
        timestamp: c.timestamp,
        index: i,
        filesChanged: 0,
        linesAdded: 0,
        linesRemoved: 0,
        changedFiles: [],
        newFiles: [],
        deletedFiles: [],
        changeType: "chore",
        featureArea: "general",
        significance: 1,
        parentShas: c.parentShas,
      });
    }
  },
});

// ─── storeDiffs ───────────────────────────────────────────────────────────────

export const storeDiffs = internalMutation({
  args: {
    repoId: v.string(),
    updates: v.array(
      v.object({
        sha: v.string(),
        filesChanged: v.number(),
        linesAdded: v.number(),
        linesRemoved: v.number(),
        changedFiles: v.array(v.string()),
        newFiles: v.array(v.string()),
        deletedFiles: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, { repoId, updates }) => {
    for (const u of updates) {
      const commit = await ctx.db
        .query("commits")
        .withIndex("by_repo_sha", (q) =>
          q.eq("repoId", repoId as any).eq("sha", u.sha)
        )
        .first();
      if (commit) {
        await ctx.db.patch(commit._id, {
          filesChanged: u.filesChanged,
          linesAdded: u.linesAdded,
          linesRemoved: u.linesRemoved,
          changedFiles: u.changedFiles,
          newFiles: u.newFiles,
          deletedFiles: u.deletedFiles,
        });
      }
    }
  },
});

// ─── updateRepoStatus ─────────────────────────────────────────────────────────

export const updateRepoStatus = internalMutation({
  args: {
    repoId: v.string(),
    status: STATUS_VALIDATOR,
    progress: v.number(),
    totalCommits: v.number(),
    processedCommits: v.number(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { repoId, status, progress, totalCommits, processedCommits, errorMessage }) => {
    await ctx.db.patch(repoId as any, {
      status,
      progress,
      totalCommits,
      processedCommits,
      ...(errorMessage ? { errorMessage } : {}),
    });
  },
});

// ─── processAllHeuristics ────────────────────────────────────────────────────

export const processAllHeuristics = internalMutation({
  args: { repoId: v.string() },
  handler: async (ctx, { repoId }) => {
    const commits = await ctx.db
      .query("commits")
      .withIndex("by_repo_index", (q) => q.eq("repoId", repoId as any))
      .collect();

    for (const commit of commits) {
      const result = analyzeCommit({
        message: commit.message,
        linesAdded: commit.linesAdded,
        linesRemoved: commit.linesRemoved,
        filesChanged: commit.filesChanged,
        changedFiles: commit.changedFiles,
        newFiles: commit.newFiles,
        deletedFiles: commit.deletedFiles,
      });

      await ctx.db.patch(commit._id, {
        changeType: result.changeType,
        featureArea: result.featureArea,
        significance: result.significance,
        cleanMessage: result.cleanMessage,
      });
    }
  },
});

// ─── buildChapters ───────────────────────────────────────────────────────────

export const buildChapters = internalMutation({
  args: { repoId: v.string() },
  handler: async (ctx, { repoId }) => {
    // Clear old chapters
    const oldChapters = await ctx.db
      .query("chapters")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId as any))
      .collect();
    for (const ch of oldChapters) await ctx.db.delete(ch._id);

    const commits = await ctx.db
      .query("commits")
      .withIndex("by_repo_index", (q) => q.eq("repoId", repoId as any))
      .order("asc")
      .collect();

    if (commits.length === 0) return;

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const boundaries: number[] = [0];

    for (let i = 1; i < commits.length; i++) {
      const prev = commits[i - 1];
      const curr = commits[i];
      const timeGap = curr.timestamp - prev.timestamp > SEVEN_DAYS;
      const prevFiles = new Set(prev.changedFiles);
      const sharedFiles = curr.changedFiles.filter((f) => prevFiles.has(f)).length;
      const noOverlap = sharedFiles === 0 && prev.featureArea !== curr.featureArea;
      if (timeGap || noOverlap) boundaries.push(i);
    }
    boundaries.push(commits.length);

    for (let b = 0; b < boundaries.length - 1; b++) {
      const start = boundaries[b];
      const end = boundaries[b + 1] - 1;
      const slice = commits.slice(start, end + 1);

      const areaCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      let totalAdded = 0;
      let totalRemoved = 0;

      for (const c of slice) {
        areaCounts[c.featureArea] = (areaCounts[c.featureArea] ?? 0) + 1;
        typeCounts[c.changeType] = (typeCounts[c.changeType] ?? 0) + 1;
        totalAdded += c.linesAdded;
        totalRemoved += c.linesRemoved;
      }

      const primaryArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0][0];
      const primaryType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];
      const color = getAreaColor(primaryArea);
      const name = getChapterName(primaryType as any, primaryArea);

      const chapterId = await ctx.db.insert("chapters", {
        repoId: repoId as any,
        name,
        startCommitIndex: start,
        endCommitIndex: end,
        startTimestamp: slice[0].timestamp,
        endTimestamp: slice[slice.length - 1].timestamp,
        primaryFeatureArea: primaryArea,
        primaryChangeType: primaryType,
        commitCount: slice.length,
        linesAdded: totalAdded,
        linesRemoved: totalRemoved,
        color,
      });

      for (const c of slice) {
        await ctx.db.patch(c._id, { chapterId });
      }
    }
  },
});

// ─── buildFileStats ───────────────────────────────────────────────────────────

export const buildFileStats = internalMutation({
  args: { repoId: v.string() },
  handler: async (ctx, { repoId }) => {
    // Clear old file stats
    const old = await ctx.db
      .query("fileStats")
      .withIndex("by_repo_path", (q) => q.eq("repoId", repoId as any))
      .collect();
    for (const f of old) await ctx.db.delete(f._id);

    const commits = await ctx.db
      .query("commits")
      .withIndex("by_repo_index", (q) => q.eq("repoId", repoId as any))
      .collect();

    const totalCommits = commits.length;
    if (totalCommits === 0) return;

    const fileMap = new Map<string, {
      changeCount: number;
      firstSeenIndex: number;
      lastSeenIndex: number;
      contributors: Set<string>;
      totalLinesAdded: number;
      totalLinesRemoved: number;
      areas: string[];
    }>();

    for (const commit of commits) {
      for (const file of commit.changedFiles) {
        const existing = fileMap.get(file);
        if (!existing) {
          fileMap.set(file, {
            changeCount: 1,
            firstSeenIndex: commit.index,
            lastSeenIndex: commit.index,
            contributors: new Set([commit.authorEmail]),
            totalLinesAdded: commit.linesAdded,
            totalLinesRemoved: commit.linesRemoved,
            areas: [commit.featureArea],
          });
        } else {
          existing.changeCount++;
          existing.lastSeenIndex = commit.index;
          existing.contributors.add(commit.authorEmail);
          existing.totalLinesAdded += commit.linesAdded;
          existing.totalLinesRemoved += commit.linesRemoved;
          existing.areas.push(commit.featureArea);
        }
      }
    }

    for (const [filePath, stats] of Array.from(fileMap.entries())) {
      const stabilityScore = Math.max(
        0,
        Math.min(100, Math.round(100 - (stats.changeCount / totalCommits) * 100))
      );
      const isHotspot = stats.changeCount / totalCommits > 0.2;
      const areaCounts: Record<string, number> = {};
      for (const a of stats.areas) areaCounts[a] = (areaCounts[a] ?? 0) + 1;
      const primaryArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "general";

      await ctx.db.insert("fileStats", {
        repoId: repoId as any,
        filePath,
        changeCount: stats.changeCount,
        stabilityScore,
        firstSeenIndex: stats.firstSeenIndex,
        lastSeenIndex: stats.lastSeenIndex,
        isHotspot,
        contributors: [...stats.contributors],
        totalLinesAdded: stats.totalLinesAdded,
        totalLinesRemoved: stats.totalLinesRemoved,
        primaryArea,
      });
    }
  },
});
