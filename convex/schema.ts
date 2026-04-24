import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  repos: defineTable({
    owner: v.string(),
    name: v.string(),
    fullName: v.string(),
    githubId: v.number(),
    defaultBranch: v.string(),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    starCount: v.optional(v.number()),
    status: v.union(
      v.literal("queued"),
      v.literal("fetching_commits"),
      v.literal("processing_diffs"),
      v.literal("computing_heuristics"),
      v.literal("ready"),
      v.literal("error")
    ),
    progress: v.number(),
    totalCommits: v.number(),
    processedCommits: v.number(),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    lastAnalyzedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_full_name", ["fullName"])
    .index("by_owner", ["owner"])
    .index("by_user", ["createdBy"]),

  commits: defineTable({
    repoId: v.id("repos"),
    sha: v.string(),
    shortSha: v.string(),
    message: v.string(),
    cleanMessage: v.string(),
    authorName: v.string(),
    authorEmail: v.string(),
    authorAvatar: v.optional(v.string()),
    timestamp: v.number(),
    index: v.number(),
    filesChanged: v.number(),
    linesAdded: v.number(),
    linesRemoved: v.number(),
    changedFiles: v.array(v.string()),
    newFiles: v.array(v.string()),
    deletedFiles: v.array(v.string()),
    changeType: v.union(
      v.literal("feature"),
      v.literal("bugfix"),
      v.literal("refactor"),
      v.literal("docs"),
      v.literal("test"),
      v.literal("chore"),
      v.literal("breaking")
    ),
    featureArea: v.string(),
    significance: v.number(),
    chapterId: v.optional(v.id("chapters")),
    parentShas: v.array(v.string()),
  })
    .index("by_repo_index", ["repoId", "index"])
    .index("by_repo_sha", ["repoId", "sha"])
    .index("by_repo_chapter", ["repoId", "chapterId"])
    .index("by_repo_area", ["repoId", "featureArea"])
    .index("by_repo_type", ["repoId", "changeType"])
    .index("by_repo_author", ["repoId", "authorEmail"])
    .index("by_significance", ["repoId", "significance"])
    .searchIndex("search_commits", {
      searchField: "message",
      filterFields: ["repoId", "featureArea", "changeType"],
    }),

  chapters: defineTable({
    repoId: v.id("repos"),
    name: v.string(),
    startCommitIndex: v.number(),
    endCommitIndex: v.number(),
    startTimestamp: v.number(),
    endTimestamp: v.number(),
    primaryFeatureArea: v.string(),
    primaryChangeType: v.string(),
    commitCount: v.number(),
    linesAdded: v.number(),
    linesRemoved: v.number(),
    color: v.string(),
  })
    .index("by_repo", ["repoId"])
    .index("by_repo_start", ["repoId", "startCommitIndex"]),

  fileStats: defineTable({
    repoId: v.id("repos"),
    filePath: v.string(),
    changeCount: v.number(),
    stabilityScore: v.number(),
    firstSeenIndex: v.number(),
    lastSeenIndex: v.number(),
    isHotspot: v.boolean(),
    contributors: v.array(v.string()),
    totalLinesAdded: v.number(),
    totalLinesRemoved: v.number(),
    primaryArea: v.string(),
  })
    .index("by_repo_path", ["repoId", "filePath"])
    .index("by_repo_hotspot", ["repoId", "isHotspot"])
    .index("by_repo_stability", ["repoId", "stabilityScore"]),

  snapshots: defineTable({
    repoId: v.id("repos"),
    sha: v.string(),
    fileTree: v.string(),
    cachedAt: v.number(),
  }).index("by_repo_sha", ["repoId", "sha"]),
});
