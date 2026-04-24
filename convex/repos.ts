import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByFullName = query({
  args: { fullName: v.string() },
  handler: async (ctx, { fullName }) => {
    return ctx.db
      .query("repos")
      .withIndex("by_full_name", (q) => q.eq("fullName", fullName))
      .first();
  },
});

export const getById = query({
  args: { repoId: v.id("repos") },
  handler: async (ctx, { repoId }) => {
    return ctx.db.get(repoId);
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return ctx.db
      .query("repos")
      .order("desc")
      .take(limit);
  },
});

export const getTotalCount = query({
  args: {},
  handler: async (ctx) => {
    const repos = await ctx.db.query("repos").collect();
    return repos.length;
  },
});

export const deleteRepo = mutation({
  args: { repoId: v.id("repos") },
  handler: async (ctx, { repoId }) => {
    await ctx.db.delete(repoId);
  },
});

/** Returns the 20 most-recently analyzed repos for a specific Clerk userId */
export const getReposByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("repos")
      .withIndex("by_user", (q) => q.eq("createdBy", userId))
      .order("desc")
      .take(20);
  },
});

