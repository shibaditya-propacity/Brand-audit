# Propacity Brand Audit

An AI-powered brand audit platform for Indian real estate developers. Collects data from 8+ sources and runs 10 brand dimensions through LLM analysis to produce a scored report.

---

## Architecture

This is a **monorepo** with three runnable units:

| App | Port | Purpose |
|-----|------|---------|
| `backend/` | 3001 | Next.js API server — data collection, AI analysis, DB |
| `frontend/` | 5175 | Next.js UI — pages, components, state |
| root `src/` | 3000 | Legacy monolith (original app, still functional) |

The frontend proxies all `/api/*` requests to the backend via Next.js rewrites — no fetch calls in the UI need changing.

---

## Folder Structure

```
Brand-audit/
│
├── backend/                        # API-only Next.js app (port 3001)
│   ├── src/
│   │   ├── app/
│   │   │   └── api/
│   │   │       ├── analyze/        # AI dimension analysis
│   │   │       │   ├── _shared.ts  # saveDimensionResult, getAuditWithDev
│   │   │       │   ├── d1/         # Brand Overview
│   │   │       │   ├── d2/         # Website & SEO
│   │   │       │   ├── d3/         # Social Media
│   │   │       │   ├── d4/         # Paid Media
│   │   │       │   ├── d5/         # Visual Identity (vision API)
│   │   │       │   ├── d6/         # Collateral
│   │   │       │   ├── d7/         # Reputation & Reviews
│   │   │       │   ├── d8/         # Technology
│   │   │       │   ├── d9/         # Competitors
│   │   │       │   ├── d10/        # Promoter
│   │   │       │   ├── logo/       # Logo vision analysis
│   │   │       │   └── collateral/ # Uploaded doc analysis (Groq)
│   │   │       │
│   │   │       ├── audit/
│   │   │       │   ├── create/     # POST — create audit + developer
│   │   │       │   ├── list/       # GET  — list all audits
│   │   │       │   └── [auditId]/
│   │   │       │       ├── route.ts        # GET audit by ID
│   │   │       │       ├── run/            # GET (SSE) — run full audit
│   │   │       │       ├── rerun/          # GET (SSE) — rerun single dimension
│   │   │       │       └── manual-input/   # POST — save manual overrides
│   │   │       │
│   │   │       ├── collect/        # Data collection endpoints
│   │   │       │   ├── company-data/   # PDL company enrichment
│   │   │       │   ├── seo/            # Serper SERP + backlinks
│   │   │       │   ├── website/        # WebCrawler API
│   │   │       │   ├── screenshot/     # Microlink screenshot + Clearbit logo
│   │   │       │   ├── instagram/      # HikerAPI Instagram data
│   │   │       │   ├── meta-ads/       # Meta Ad Library
│   │   │       │   ├── gmb/            # Google My Business + Apify reviews
│   │   │       │   ├── competitors/    # Serper competitor discovery
│   │   │       │   └── promoter-linkedin/ # Promoter LinkedIn scrape
│   │   │       │
│   │   │       ├── auth/           # JWT auth (signup, signin, signout, me)
│   │   │       ├── developer/      # Developer search
│   │   │       ├── prefill/        # Brand quick-lookup before audit
│   │   │       └── upload/         # Collateral PDF upload
│   │   │
│   │   ├── lib/
│   │   │   ├── mongodb.ts          # Mongoose connection (cached)
│   │   │   ├── anthropic.ts        # Claude Sonnet (vision + text, retry, extractJson)
│   │   │   ├── groq.ts             # Llama 3.3 70B (free, fallback to Claude)
│   │   │   ├── auth.ts             # JWT sign/verify helpers
│   │   │   ├── fetchWithRetry.ts   # Fetch + axios retry wrappers
│   │   │   ├── utils.ts            # cn() utility
│   │   │   ├── models/
│   │   │   │   ├── Audit.ts        # Audit schema (dimensions, collectedData)
│   │   │   │   ├── Developer.ts    # Developer schema
│   │   │   │   └── User.ts         # User schema
│   │   │   └── apis/
│   │   │       ├── dataForSeo.ts   # Serper (SERP, places, competitors)
│   │   │       ├── webCrawler.ts   # WebCrawler API (crawl + markdown)
│   │   │       ├── shotApi.ts      # Microlink screenshot + Clearbit logo
│   │   │       ├── hikerApi.ts     # Instagram data via HikerAPI
│   │   │       ├── metaAdLibrary.ts# Meta Ad Library scraper
│   │   │       ├── apifyReviews.ts # Google Reviews via Apify
│   │   │       ├── googlePlaces.ts # Geoapify place details
│   │   │       ├── pdl.ts          # People Data Labs enrichment
│   │   │       ├── socialScraper.ts# LinkedIn/social scraper
│   │   │       └── socialInsights.ts
│   │   │
│   │   ├── config/
│   │   │   ├── checklist.ts        # All D1–D10 checklist items (130+ items)
│   │   │   ├── dimensions.ts       # Dimension metadata
│   │   │   └── scoring.ts          # Scoring weights
│   │   │
│   │   ├── prompts/                # Claude/Llama prompt builders
│   │   │   ├── shared.ts           # buildSharedContext, summarizeSerp
│   │   │   ├── d1-brand-overview.ts
│   │   │   ├── d2-website-seo.ts
│   │   │   ├── d3-social-media.ts
│   │   │   ├── d4-paid-media.ts
│   │   │   ├── d5-visual-identity.ts
│   │   │   ├── d6-collateral.ts
│   │   │   ├── d7-reputation.ts
│   │   │   ├── d8-technology.ts
│   │   │   ├── d9-competitors.ts
│   │   │   ├── d10-promoter.ts
│   │   │   └── logo-vision.ts
│   │   │
│   │   ├── types/                  # Shared TypeScript types
│   │   └── middleware.ts           # JWT auth middleware (protects all routes)
│   │
│   ├── .env                        # Copy of root .env
│   ├── next.config.mjs             # CORS headers for frontend origin
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # UI-only Next.js app (port 5175)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout (AuthProvider, ThemeProvider)
│   │   │   ├── page.tsx            # Home — fetches /api/audit/list from backend
│   │   │   ├── globals.css
│   │   │   └── audit/
│   │   │       ├── new/            # Audit wizard (4-step form)
│   │   │       └── [auditId]/
│   │   │           ├── page.tsx    # Audit dashboard (overview + scores)
│   │   │           ├── layout.tsx  # Sidebar layout
│   │   │           ├── d1–d10/     # Individual dimension pages
│   │   │           └── report/     # PDF report page
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                 # Radix-based primitives (button, card, tabs…)
│   │   │   ├── layout/             # TopBar, AuditSidebar, AppShell
│   │   │   ├── dashboard/          # AuditOverview, DimensionGrid, RadarChart, AuditProgress
│   │   │   ├── dimension/          # ChecklistTable, AIFindingsPanel, RerunButton
│   │   │   ├── widgets/            # SEOMetrics, Reviews, AdLibrary, Logo, Screenshot
│   │   │   ├── wizard/             # AuditWizard, Step1–4, BrandPrefillStep
│   │   │   ├── report/             # ReportViewer (PDF export)
│   │   │   ├── auth/               # AuthModal
│   │   │   ├── shared/             # ScoreBadge, StatusPill, LoadingSkeleton…
│   │   │   └── providers/          # AuthProvider, ThemeProvider
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuditData.ts     # Fetches single audit by ID
│   │   │   ├── useRunAnalysis.ts   # Manages dimension rerun SSE stream
│   │   │   └── useDeveloperSearch.ts
│   │   │
│   │   ├── store/
│   │   │   └── auditStore.ts       # Zustand — wizard state, progress events, isRunning
│   │   │
│   │   ├── types/                  # Shared TypeScript types (mirrored from backend)
│   │   ├── config/                 # Checklist + dimension metadata (read-only on frontend)
│   │   └── lib/
│   │       └── utils.ts            # cn() Tailwind merge utility
│   │
│   ├── public/
│   ├── .env                        # BACKEND_URL=http://localhost:3001, NEXT_PUBLIC_APP_URL=http://localhost:5175
│   ├── next.config.mjs             # Rewrites /api/* → http://localhost:3001/api/*
│   ├── tailwind.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── src/                            # Original monolith (still works independently)
│   └── ...                         # Same structure as backend + frontend combined
│
├── .env                            # Root env — all API keys
├── package.json                    # Root scripts: dev, dev:backend, dev:frontend, dev:all
├── next.config.mjs                 # Root Next.js config (for monolith)
├── tailwind.config.ts
└── tsconfig.json
```

---

## Getting Started

### Run both apps together
```bash
npm install -D concurrently     # one-time
npm run dev:all
```

### Run separately
```bash
# Terminal 1 — backend API
cd backend && npm install && npm run dev
# → http://localhost:3001

# Terminal 2 — frontend UI
cd frontend && npm install && npm run dev
# → http://localhost:5175
```

### Run original monolith (root)
```bash
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

Both `backend/.env` and `frontend/.env` are copies of the root `.env`.  
The frontend additionally needs:

```env
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:5175
```

The backend additionally needs (for deployed environments):

```env
FRONTEND_URL=http://localhost:5175
PORT=3001
```

---

## How an Audit Run Works

```
User submits wizard
      │
      ▼
POST /api/audit/create          ← creates Audit + Developer in MongoDB
      │
      ▼
GET  /api/audit/:id/run  (SSE)  ← Server-Sent Events stream
      │
      ├── Phase 1: Data Collection (parallel)
      │   ├── PDL          → company enrichment
      │   ├── Serper       → SERP + competitor data
      │   ├── WebCrawler   → website crawl (markdown)
      │   ├── HikerAPI     → Instagram metrics
      │   ├── MetaAds      → ad library
      │   ├── Microlink    → screenshot + Clearbit logo
      │   └── Apify        → Google reviews
      │
      └── Phase 2: AI Analysis (sequential, retry on fail)
          ├── D1  → Groq Llama 3.3 (→ Claude fallback)
          ├── D2  → Groq Llama 3.3
          ├── D3  → Groq Llama 3.3
          ├── D4  → Groq Llama 3.3
          ├── D5  → Claude Sonnet Vision (screenshot/logo)
          ├── D6  → Groq Llama 3.3
          ├── D7  → Groq Llama 3.3
          ├── D8  → Groq Llama 3.3
          ├── D9  → Groq Llama 3.3
          └── D10 → Groq Llama 3.3
```

Each dimension is retried once on failure. A 1.5 s gap between dimensions prevents Groq rate limiting.

---

## AI Stack

| Use case | Primary | Fallback |
|----------|---------|---------|
| Dimension analysis (D1–D4, D6–D10) | Groq — Llama 3.3 70B (free) | Claude Sonnet 4.6 |
| Visual analysis (D5, logo) | Claude Sonnet 4.6 Vision | Groq text-only |
| Document analysis (collateral) | Groq | Claude |

---

## Key Design Decisions

- **Groq-first**: 9 of 10 dimensions use the free Groq API, making each audit nearly free. Claude is paid but only used for vision and as a fallback.
- **SSE streaming**: The run and rerun routes stream progress events so the UI updates in real time without polling.
- **Frontend proxy**: `frontend/next.config.mjs` rewrites `/api/*` → backend, so every `fetch('/api/...')` in the UI just works — no environment-specific URLs needed in components.
- **extractJson**: Both Groq and Claude responses are parsed with a robust JSON extractor that strips markdown fences, preamble text, and trailing notes before `JSON.parse`.
- **Dimension retry**: Failed dimensions are retried once with a 5 s delay before being marked failed.
