"use node";

import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { fetchFileTree, fetchFileContent, type TreeNode } from "./github";

export const getFileTree = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    sha: v.string(),
    token: v.optional(v.string()),
  },
  handler: async (ctx, { owner, repo, sha, token }): Promise<TreeNode[]> => {
    const fullName = `${owner}/${repo}`;
    const repoRecord = await ctx.runQuery(api.commits.getRepoByFullName, { fullName });

    if (repoRecord) {
      const snapshot = await ctx.runQuery(api.commits.getCachedSnapshot, {
        repoId: repoRecord._id,
        sha,
      });
      if (snapshot) return JSON.parse(snapshot.fileTree) as TreeNode[];
    }

    const tree = await fetchFileTree(owner, repo, sha, token ?? process.env.GITHUB_TOKEN);

    if (repoRecord) {
      await ctx.runMutation(internal.commits.cacheSnapshot, {
        repoId: repoRecord._id,
        sha,
        fileTree: JSON.stringify(tree),
      });
    }

    return tree;
  },
});

export const getFileContent = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    path: v.string(),
    sha: v.string(),
    token: v.optional(v.string()),
  },
  handler: async (_, { owner, repo, path, sha, token }): Promise<string> => {
    return fetchFileContent(owner, repo, path, sha, token ?? process.env.GITHUB_TOKEN);
  },
});
