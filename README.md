# Time Rewind for Codebases

> Transform any GitHub repository into an interactive visual timeline.  
> **No AI. No credit card. $0/month forever.**

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router + TypeScript |
| Backend/DB | Convex (DB + real-time + serverless) |
| Auth | Clerk (GitHub OAuth) |
| Animation | Framer Motion |
| Code Viewer | Monaco Editor |
| Styling | Tailwind CSS |
| AI / ML | **NONE** — pure heuristics |

## Quick Start (Local Dev)

### 1. Clone & install
```bash
cd time-rewind-app
npm install
```

### 2. Create external services (all free)

**Convex** → https://convex.dev
- Create project → copy deployment URL

**Clerk** → https://clerk.com
- Create app → enable GitHub OAuth
- Copy publishable key + secret key

**GitHub OAuth App** → https://github.com/settings/developers
- New OAuth App
- Callback: `https://your-clerk-domain.accounts.dev/v1/oauth_callback`

### 3. Set environment variables

Copy `.env.local.example` → `.env.local` and fill in values:
```
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

Copy `convex/.env.example` → `convex/.env`:
```
GITHUB_TOKEN=ghp_xxx   # optional but recommended (5000 req/hr vs 60)
```

### 4. Run dev servers

**Terminal 1 — Convex backend:**
```bash
npx convex dev
```

**Terminal 2 — Next.js frontend:**
```bash
npm run dev
```

Open http://localhost:3000

---

## Deploy to Production

```bash
npx convex deploy
npx vercel
# Add env vars in Vercel dashboard
```

---

## Architecture

```
User pastes GitHub URL
    ↓
Convex Action: ingestRepo()
    ↓ validateRepo (GitHub REST)
    ↓ fetchAllCommits (GitHub GraphQL, paginated)
    ↓ fetchCommitDiffs (batches of 50, 5 parallel)
    ↓ processAllHeuristics (pure JS, 200+ commits/sec)
    ↓ buildChapters (time-gap + file-overlap algorithm)
    ↓ buildFileStats (hotspot detection)
    ↓ status → "ready"
    ↓
Next.js Timeline page (Convex useQuery, real-time)
    ↓
TimelineScrubber → SVG with commit dots + chapter bands
CommitCard → cleaned message, badges, stars, diff stats
CodeViewer → Monaco diff editor (current vs prev commit)
FilterBar → full-text search + area/type/author filters
HeatmapOverlay → file stability visualization
```

## Heuristics Engine (lib/heuristics.ts)

All intelligence is **deterministic** — no AI black boxes:

- **changeType**: Conventional commit prefixes → file extension fallbacks
- **featureArea**: File path substring matching with majority vote
- **significance**: Math formula (lines changed + files + new files + type multiplier)
- **chapters**: Time-gap (>7 days) + file-overlap algorithm
- **search**: Convex built-in full-text search (no embeddings)

## Free Tier Limits

| Service | Free Limit |
|---------|-----------|
| Vercel | 100GB bandwidth, unlimited deploys |
| Convex | 1M function calls/month, 1GB storage |
| Clerk | 10,000 MAU |
| GitHub | 5,000 API req/hour (authenticated) |
| **Total cost** | **$0/month** |
