# Folder Structure Specification

Version: 1.0.0

Status: Final (MVP)

Related Documents

- engineering/00_ARCHITECTURE.md
- engineering/01_DATABASE_SCHEMA.md
- engineering/02_API_SPECIFICATION.md
- cursor/CURSOR_RULES.md

---

# Purpose

This document defines the folder structure for the Muliya Kaizan MVP.

The application uses **two separate repositories** — not a monorepo:

| Repository | Technology | Deployment |
|------------|------------|------------|
| `kaizen-web` | Next.js 15 | Vercel |
| `kaizen-api` | Express + Prisma | Railway |

Documentation (`docs/`) may live in either repository or a shared docs repo. For this project, docs are at the workspace root.

---

# Repository Overview

```
Kaizen/                          # Workspace or docs root
├── docs/
│   ├── cursor/
│   ├── design/
│   ├── engineering/
│   └── product/
│
├── kaizen-web/                  # Frontend repository
└── kaizen-api/                  # Backend repository
```

Each repository is independently versioned, deployed, and configured.

---

# Frontend Repository: kaizen-web

```
kaizen-web/
├── .env.example
├── .env.local                   # Git-ignored
├── .gitignore
├── .eslintrc.json
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json              # shadcn/ui config
├── README.md
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   └── empty-states/
│   └── fonts/
│
├── app/
│   ├── layout.tsx               # Root layout, providers, fonts
│   ├── page.tsx                 # Redirect to dashboard or sign-in
│   ├── globals.css              # Tailwind + design tokens
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   │
│   ├── (auth)/
│   │   ├── layout.tsx           # Centered auth layout
│   │   ├── sign-in/
│   │   │   └── page.tsx         # Custom Clerk sign-in page
│   │   ├── sign-up/
│   │   │   └── page.tsx         # Custom Clerk sign-up page
│   │   └── forgot-password/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Sidebar + header shell
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Role-based dashboard redirect
│   │   ├── manager/
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   ├── hr/
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   ├── cmd/
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   │
│   │   ├── kaizen/
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [draftId]/
│   │   │   │       └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── ideas/
│   │   │   ├── page.tsx
│   │   │   └── drafts/
│   │   │       └── page.tsx
│   │   │
│   │   ├── review/
│   │   │   ├── page.tsx
│   │   │   └── [kaizenId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── implementation/
│   │   │   ├── page.tsx
│   │   │   └── [kaizenId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── page.tsx
│   │   │   └── personal/
│   │   │       └── page.tsx
│   │   │
│   │   ├── knowledge-base/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── leaderboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── achievements/
│   │   │   └── page.tsx
│   │   │
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   │
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── users/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── departments/
│   │       │   └── page.tsx
│   │       ├── categories/
│   │       │   └── page.tsx
│   │       ├── scoring/
│   │       │   └── page.tsx
│   │       ├── announcements/
│   │       │   └── page.tsx
│   │       ├── settings/
│   │       │   └── page.tsx
│   │       └── audit-logs/
│   │           └── page.tsx
│   │
│   └── api/                     # Next.js route handlers (minimal)
│       └── health/
│           └── route.ts
│
├── components/
│   ├── ui/                      # shadcn/ui primitives (generated)
│   ├── layout/
│   │   ├── app-sidebar.tsx
│   │   ├── app-header.tsx
│   │   ├── page-header.tsx
│   │   ├── mobile-nav.tsx
│   │   └── breadcrumb-nav.tsx
│   ├── feedback/
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx
│   │   ├── loading-skeleton.tsx
│   │   └── success-toast.tsx
│   ├── data-table/
│   │   ├── data-table.tsx
│   │   ├── data-table-pagination.tsx
│   │   ├── data-table-toolbar.tsx
│   │   └── data-table-column-header.tsx
│   └── charts/
│       ├── line-chart-card.tsx
│       ├── bar-chart-card.tsx
│       └── pie-chart-card.tsx
│
├── features/                    # Business modules (mandatory structure)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── constants/
│   ├── dashboard/
│   ├── kaizen/
│   ├── review/
│   ├── scoring/
│   ├── implementation/
│   ├── notifications/
│   ├── analytics/
│   ├── knowledge-base/
│   ├── gamification/
│   ├── profile/
│   ├── admin/
│   └── settings/
│
├── hooks/
│   └── use-debounce.ts          # Shared hooks only
│
├── lib/
│   ├── api-client.ts            # HTTP client with auth header
│   ├── clerk.ts                 # Clerk helpers
│   ├── query-client.ts          # TanStack Query config
│   ├── utils.ts                 # cn() and shared utilities
│   └── permissions.ts           # Frontend RBAC helpers
│
├── providers/
│   ├── app-providers.tsx
│   ├── query-provider.tsx
│   └── theme-provider.tsx
│
├── services/
│   └── api/                     # Thin re-exports if needed
│
├── types/
│   ├── api.ts                   # Shared API response types
│   └── enums.ts                 # Mirror backend enums
│
├── constants/
│   ├── routes.ts
│   ├── navigation.ts              # Role-based sidebar config
│   └── kaizen-status.ts
│
├── utils/
│   └── format.ts
│
└── middleware.ts                # Clerk auth + role route protection
```

---

# Feature Module Structure

Every folder under `features/` MUST follow this structure:

```
features/kaizen/
├── components/
│   ├── kaizen-wizard.tsx
│   ├── kaizen-wizard-step-category.tsx
│   ├── kaizen-status-badge.tsx
│   └── ...
├── hooks/
│   ├── use-kaizen.ts
│   ├── use-kaizen-draft.ts
│   └── use-submit-kaizen.ts
├── services/
│   └── kaizen-service.ts        # All API calls for this feature
├── types/
│   └── kaizen.types.ts
├── schemas/
│   └── kaizen.schema.ts         # Zod validation
├── utils/
│   └── kaizen-helpers.ts
└── constants/
    └── wizard-steps.ts
```

### Rules

- **Pages** (`app/`) are thin — import from `features/`
- **Components** receive data via props; no direct API calls
- **Services** are the only layer that calls `api-client`
- **Hooks** wrap TanStack Query mutations and queries
- **Max 250 lines** per component (per CURSOR_RULES)
- **No `any`** types

---

# Backend Repository: kaizen-api

```
kaizen-api/
├── .env.example
├── .env                         # Git-ignored
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
│
├── prisma/
│   ├── schema.prisma            # Canonical schema (see 01_DATABASE_SCHEMA.md)
│   ├── seed.ts
│   └── migrations/
│
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app setup
│   │
│   ├── config/
│   │   ├── env.ts               # Validated environment variables
│   │   ├── cors.ts
│   │   └── cloudinary.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts              # Clerk JWT verification
│   │   ├── rbac.ts              # Role permission checks
│   │   ├── validate.ts          # Zod request validation
│   │   ├── error-handler.ts
│   │   ├── rate-limiter.ts
│   │   └── request-logger.ts
│   │
│   ├── routes/
│   │   ├── index.ts             # Mount all v1 routes
│   │   ├── health.routes.ts
│   │   └── v1/
│   │       ├── me.routes.ts
│   │       ├── users.routes.ts
│   │       ├── departments.routes.ts
│   │       ├── categories.routes.ts
│   │       ├── kaizens.routes.ts
│   │       ├── reviews.routes.ts
│   │       ├── scoring.routes.ts
│   │       ├── implementations.routes.ts
│   │       ├── business-impact.routes.ts
│   │       ├── timeline.routes.ts
│   │       ├── dashboard.routes.ts
│   │       ├── analytics.routes.ts
│   │       ├── gamification.routes.ts
│   │       ├── knowledge-base.routes.ts
│   │       ├── notifications.routes.ts
│   │       ├── uploads.routes.ts
│   │       ├── announcements.routes.ts
│   │       └── admin.routes.ts
│   │
│   ├── modules/                 # Business logic (no HTTP in services)
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   └── auth.types.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── users.schema.ts
│   │   ├── departments/
│   │   ├── categories/
│   │   ├── kaizens/
│   │   ├── reviews/
│   │   ├── scoring/
│   │   ├── implementations/
│   │   ├── business-impact/
│   │   ├── workflow/
│   │   │   ├── workflow.service.ts      # Sole authority for status transitions
│   │   │   └── workflow.transitions.ts
│   │   ├── notifications/
│   │   │   └── notification.service.ts
│   │   ├── gamification/
│   │   │   ├── points.service.ts
│   │   │   ├── achievements.service.ts
│   │   │   └── leaderboard.service.ts
│   │   ├── analytics/
│   │   ├── knowledge-base/
│   │   ├── uploads/
│   │   ├── admin/
│   │   └── audit/
│   │       └── audit.service.ts
│   │
│   ├── webhooks/
│   │   └── clerk.webhook.ts
│   │
│   ├── events/
│   │   ├── event-bus.ts
│   │   └── handlers/
│   │       ├── notification.handler.ts
│   │       ├── gamification.handler.ts
│   │       └── analytics.handler.ts
│   │
│   ├── jobs/
│   │   └── leaderboard-refresh.job.ts
│   │
│   ├── types/
│   │   ├── express.d.ts         # Extend Request with req.user
│   │   └── api.types.ts
│   │
│   ├── utils/
│   │   ├── api-response.ts
│   │   ├── kaizen-number.ts
│   │   └── pagination.ts
│   │
│   └── constants/
│       ├── roles.ts
│       ├── permissions.ts
│       └── kaizen-status.ts
│
└── tests/                       # Future
    ├── unit/
    └── integration/
```

---

# Module Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| `routes/` | HTTP routing, middleware chain, no business logic |
| `modules/*/controller.ts` | Parse request, call service, format response |
| `modules/*/service.ts` | Business logic, orchestration, permissions |
| `modules/*/repository.ts` | Prisma queries only |
| `modules/*/schema.ts` | Zod validation schemas |
| `workflow/` | All Kaizen status transitions |
| `events/` | Side effects (notifications, points, analytics) |

---

# Shared Types Strategy

Without a monorepo, types are duplicated with discipline:

| Location | Contents |
|----------|----------|
| `kaizen-api/src/constants/` | Source of truth for enums |
| `kaizen-web/types/enums.ts` | Mirror of backend enums |
| `kaizen-web/features/*/schemas/` | Zod schemas matching API validation |
| `kaizen-web/features/*/types/` | Feature-specific TypeScript interfaces |

When API shapes change, update both repositories.

---

# Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `KaizenWizard.tsx` |
| Files | kebab-case | `kaizen-wizard.tsx` |
| Folders | kebab-case | `knowledge-base/` |
| Hooks | camelCase | `useKaizen.ts` |
| Services | camelCase | `kaizenService.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| API routes | kebab-case | `/knowledge-base` |
| Prisma models | PascalCase | `Kaizen` |
| DB columns | snake_case | `kaizen_number` |

---

# Environment Files

| File | Repository | Purpose |
|------|------------|---------|
| `.env.example` | `kaizen-web` | Documented frontend variables |
| `.env.local` | `kaizen-web` | Local overrides (git-ignored) |
| `.env.example` | `kaizen-api` | Documented backend variables |
| `.env` | `kaizen-api` | Local config (git-ignored) |

See `.env.example` in each repository root.

---

# Files Explicitly NOT in MVP

Do not create folders or modules for:

- `features/ai/`
- `features/challenges/`
- `features/command-palette/`
- `packages/shared/` (no monorepo)
- `apps/` (no monorepo)

---

# Implementation Order

| Step | Repository | Deliverable |
|------|------------|-------------|
| 1 | kaizen-web | Clerk custom auth pages, middleware |
| 2 | kaizen-api | Prisma schema, migrations, seed |
| 3 | kaizen-api | Core API modules |
| 4 | kaizen-web | Global layout (sidebar, header) |
| 5 | kaizen-web | Dashboards |
| 6 | kaizen-web + api | Kaizen wizard |
| 7 | Both | Review workspace |
| 8 | Both | Scoring |
| 9 | kaizen-api | Workflow service |
| 10 | Both | Notifications |
| 11 | Both | Analytics |
| 12 | Both | Knowledge base |
| 13 | Both | Gamification (basic) |
| 14 | Both | Admin panel |

---

# Acceptance Criteria

- Two independent repositories with clear boundaries
- Every feature module follows the mandated subfolder structure
- No business logic in React components or route handlers
- All status changes flow through `workflow.service.ts`
- Frontend never imports from backend; API-only communication
