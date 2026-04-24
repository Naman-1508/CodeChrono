// ────────────────────────────────────────────────────────────────────────────
// convex/commits.ts  —  Queries & internal mutations (Convex runtime)
// File content actions live in convex/commitActions.ts  ("use node")
// ────────────────────────────────────────────────────────────────────────────

import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getCommitsByRepo = query({
  args: {
    repoId: v.id("repos"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { repoId, limit = 5000 }) => {
    return ctx.db
      .query("commits")
      .withIndex("by_repo_index", (q) => q.eq("repoId", repoId))
      .order("asc")
      .take(limit);
  },
});

export const getCommitByIndex = query({
  args: { repoId: v.id("repos"), index: v.number() },
  handler: async (ctx, { repoId, index }) => {
    return ctx.db
      .query("commits")
      .withIndex("by_repo_index", (q) => q.eq("repoId", repoId).eq("index", index))
      .first();
  },
});

export const getCommitsForFile = query({
  args: { repoId: v.id("repos"), filePath: v.string() },
  handler: async (ctx, { repoId, filePath }) => {
    const all = await ctx.db
      .query("commits")
      .withIndex("by_repo_index", (q) => q.eq("repoId", repoId))
      .order("asc")
      .collect();
    return all.filter((c) => c.changedFiles.includes(filePath));
  },
});

export const searchCommits = query({
  args: {
    repoId: v.id("repos"),
    query: v.string(),
    featureArea: v.optional(v.string()),
    changeType: v.optional(v.string()),
  },
  handler: async (ctx, { repoId, query: q, featureArea, changeType }) => {
    if (!q.trim()) return [];
    let search = ctx.db.query("commits").withSearchIndex("search_commits", (s) => {
      const base = s.search("message", q).eq("repoId", repoId);
      return base;
    });
    const results = await search.take(100);
    return results.filter((c) => {
      if (featureArea && c.featureArea !== featureArea) return false;
      if (changeType && c.changeType !== changeType) return false;
      return true;
    });
  },
});

export const getChaptersByRepo = query({
  args: { repoId: v.id("repos") },
  handler: async (ctx, { repoId }) => {
    return ctx.db
      .query("chapters")
      .withIndex("by_repo_start", (q) => q.eq("repoId", repoId))
      .order("asc")
      .collect();
  },
});

export const getFileStats = query({
  args: { repoId: v.id("repos"), onlyHotspots: v.optional(v.boolean()) },
  handler: async (ctx, { repoId, onlyHotspots }) => {
    if (onlyHotspots) {
      return ctx.db
        .query("fileStats")
        .withIndex("by_repo_hotspot", (q) => q.eq("repoId", repoId).eq("isHotspot", true))
        .collect();
    }
    return ctx.db
      .query("fileStats")
      .withIndex("by_repo_path", (q) => q.eq("repoId", repoId))
      .collect();
  },
});

export const getRepoByFullName = query({
  args: { fullName: v.string() },
  handler: async (ctx, { fullName }) => {
    return ctx.db
      .query("repos")
      .withIndex("by_full_name", (q) => q.eq("fullName", fullName))
      .first();
  },
});

export const getCachedSnapshot = query({
  args: { repoId: v.id("repos"), sha: v.string() },
  handler: async (ctx, { repoId, sha }) => {
    return ctx.db
      .query("snapshots")
      .withIndex("by_repo_sha", (q) => q.eq("repoId", repoId).eq("sha", sha))
      .first();
  },
});

// ─── Internal mutations ───────────────────────────────────────────────────────

export const cacheSnapshot = internalMutation({
  args: { repoId: v.id("repos"), sha: v.string(), fileTree: v.string() },
  handler: async (ctx, { repoId, sha, fileTree }) => {
    const existing = await ctx.db
      .query("snapshots")
      .withIndex("by_repo_sha", (q) => q.eq("repoId", repoId).eq("sha", sha))
      .first();
    if (!existing) {
      await ctx.db.insert("snapshots", { repoId, sha, fileTree, cachedAt: Date.now() });
    }
  },
});
