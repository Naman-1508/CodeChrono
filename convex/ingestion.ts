// ────────────────────────────────────────────────────────────────────────────
// convex/ingestion.ts  —  Node.js Action only ("use node")
// All mutations live in ingestionMutations.ts
// ────────────────────────────────────────────────────────────────────────────
"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { validateRepo, fetchAllCommits, fetchCommitDiff } from "./github";

const DIFF_BATCH_SIZE = 50;
const PARALLEL_DIFFS = 5;

export const ingestRepo = action({
  args: {
    repoFullName: v.string(),
    token: v.optional(v.string()),   // PAT or Clerk OAuth — used for API calls, never stored
    userId: v.optional(v.string()),  // Clerk userId — saved to repo record for history
  },
  handler: async (ctx, { repoFullName, token: userToken, userId }) => {
    const token = userToken ?? process.env.GITHUB_TOKEN;
    const [owner, name] = repoFullName.split("/");

    // 1. Validate repo with GitHub
    const repoMeta = await validateRepo(owner, name, token);

    // 2. Create/update repo record
    const repoId: string = await ctx.runMutation(internal.ingestionMutations.upsertRepo, {
      owner,
      name,
      fullName: repoFullName,
      githubId: repoMeta.id,
      defaultBranch: repoMeta.defaultBranch,
      description: repoMeta.description,
      language: repoMeta.language,
      starCount: repoMeta.starCount,
      status: "fetching_commits",
      progress: 0,
      totalCommits: 0,
      processedCommits: 0,
      createdBy: userId,  // undefined for anonymous users — never store the token
    });

    try {
      // 3. Fetch all commits via GitHub GraphQL
      const commits = await fetchAllCommits(owner, name, token);

      await ctx.runMutation(internal.ingestionMutations.storeCommits, {
        repoId,
        commits,
      });

      await ctx.runMutation(internal.ingestionMutations.updateRepoStatus, {
        repoId,
        status: "processing_diffs",
        totalCommits: commits.length,
        processedCommits: 0,
        progress: 10,
      });

      // 4. Fetch diffs in batches of 50, 5 parallel
      for (let i = 0; i < commits.length; i += DIFF_BATCH_SIZE) {
        const batch = commits.slice(i, i + DIFF_BATCH_SIZE);

        for (let j = 0; j < batch.length; j += PARALLEL_DIFFS) {
          const chunk = batch.slice(j, j + PARALLEL_DIFFS);
          const results = await Promise.allSettled(
            chunk.map((c) => fetchCommitDiff(owner, name, c.sha, token))
          );

          const updates = chunk.map((c, k) => {
            const result = results[k];
            return result.status === "fulfilled"
              ? { sha: c.sha, ...result.value }
              : { sha: c.sha, filesChanged: 0, linesAdded: 0, linesRemoved: 0, changedFiles: [], newFiles: [], deletedFiles: [] };
          });

          await ctx.runMutation(internal.ingestionMutations.storeDiffs, { repoId, updates });
        }

        const processed = Math.min(i + DIFF_BATCH_SIZE, commits.length);
        const progress = Math.floor(10 + (processed / commits.length) * 60);
        await ctx.runMutation(internal.ingestionMutations.updateRepoStatus, {
          repoId,
          status: "processing_diffs",
          totalCommits: commits.length,
          processedCommits: processed,
          progress,
        });
      }

      // 5. Heuristics
      await ctx.runMutation(internal.ingestionMutations.updateRepoStatus, {
        repoId,
        status: "computing_heuristics",
        progress: 70,
        totalCommits: commits.length,
        processedCommits: commits.length,
      });
      await ctx.runMutation(internal.ingestionMutations.processAllHeuristics, { repoId });

      // 6. Chapters
      await ctx.runMutation(internal.ingestionMutations.buildChapters, { repoId });
      await ctx.runMutation(internal.ingestionMutations.updateRepoStatus, {
        repoId,
        status: "computing_heuristics",
        progress: 90,
        totalCommits: commits.length,
        processedCommits: commits.length,
      });

      // 7. File stats
      await ctx.runMutation(internal.ingestionMutations.buildFileStats, { repoId });

      // 8. Done
      await ctx.runMutation(internal.ingestionMutations.updateRepoStatus, {
        repoId,
        status: "ready",
        progress: 100,
        totalCommits: commits.length,
        processedCommits: commits.length,
      });

      return { success: true, repoId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.ingestionMutations.updateRepoStatus, {
        repoId,
        status: "error",
        progress: 0,
        totalCommits: 0,
        processedCommits: 0,
        errorMessage: msg,
      });
      throw err;
    }
  },
});
