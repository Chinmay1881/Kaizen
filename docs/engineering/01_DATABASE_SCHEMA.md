# Database Schema Specification

Version: 1.0.0

Status: Final (MVP)

Related Documents

- product/02_PRODUCT_REQUIREMENTS.md
- product/01_USERS_AND_ROLES.md
- engineering/02_API_SPECIFICATION.md
- engineering/02_FOLDER_STRUCTURE.md

---

# Purpose

This document defines the PostgreSQL database schema for the Muliya Kaizan MVP.

The schema supports:

- Clerk-authenticated users with RBAC
- Single-stage approval workflow (Department Manager only)
- Kaizen submission, review, scoring, implementation, business impact, rewards, and archival
- Basic gamification (points, leaderboard, achievements)
- Knowledge base publication
- In-app notifications and audit logging

---

# Technology

| Component | Choice |
|-----------|--------|
| Database | PostgreSQL 16+ (Neon) |
| ORM | Prisma |
| Primary Keys | UUID (`gen_random_uuid()`) |
| Timestamps | `timestamptz` (UTC) |
| Soft Delete | `deletedAt` on `User`, `Department`, `Category` only |

---

# MVP Workflow States

A Kaizen exists in exactly one status at a time.

```
DRAFT
  → SUBMITTED
  → UNDER_REVIEW
  → NEEDS_CHANGES → (edit) → SUBMITTED
  → REJECTED (terminal)
  → APPROVED
  → IMPLEMENTATION_IN_PROGRESS
  → IMPLEMENTATION_COMPLETED
  → BUSINESS_IMPACT_RECORDED
  → REWARD_ISSUED
  → ARCHIVED
  → PUBLISHED_TO_KNOWLEDGE_BASE (optional final state after archive)
```

### Status Definitions

| Status | Editable by Employee | Description |
|--------|----------------------|-------------|
| `DRAFT` | Yes | Wizard in progress |
| `SUBMITTED` | No | Awaiting department manager review |
| `UNDER_REVIEW` | No | Manager actively reviewing |
| `NEEDS_CHANGES` | Yes | Returned to submitter with feedback |
| `REJECTED` | No | Terminal; remains searchable |
| `APPROVED` | No | Accepted; awaiting implementation assignment |
| `IMPLEMENTATION_IN_PROGRESS` | No | Work underway |
| `IMPLEMENTATION_COMPLETED` | No | Awaiting verification / business impact |
| `BUSINESS_IMPACT_RECORDED` | No | Impact metrics captured |
| `REWARD_ISSUED` | No | Points and achievements applied |
| `ARCHIVED` | No | Read-only; closed |
| `PUBLISHED_TO_KNOWLEDGE_BASE` | No | Visible in knowledge base |

### Valid Transitions (enforced by application layer)

| From | To | Actor |
|------|-----|-------|
| `DRAFT` | `SUBMITTED` | Employee |
| `SUBMITTED` | `UNDER_REVIEW` | Department Manager |
| `UNDER_REVIEW` | `APPROVED` | Department Manager |
| `UNDER_REVIEW` | `REJECTED` | Department Manager |
| `UNDER_REVIEW` | `NEEDS_CHANGES` | Department Manager |
| `NEEDS_CHANGES` | `SUBMITTED` | Employee (resubmit) |
| `APPROVED` | `IMPLEMENTATION_IN_PROGRESS` | Department Manager |
| `IMPLEMENTATION_IN_PROGRESS` | `IMPLEMENTATION_COMPLETED` | Department Manager / assigned owner |
| `IMPLEMENTATION_COMPLETED` | `BUSINESS_IMPACT_RECORDED` | Department Manager / HR / CMD |
| `BUSINESS_IMPACT_RECORDED` | `REWARD_ISSUED` | System (automatic) |
| `REWARD_ISSUED` | `ARCHIVED` | Department Manager / Super Admin |
| `ARCHIVED` | `PUBLISHED_TO_KNOWLEDGE_BASE` | Department Manager / HR / Super Admin |

---

# Kaizen ID Format

Human-readable identifier stored separately from UUID primary key.

**Format:** `KZN-{YYYY}-{SEQUENCE}`

**Example:** `KZN-2026-00042`

- `YYYY` — submission year
- `SEQUENCE` — zero-padded 5-digit auto-increment per year

**Table:** `kaizen_number_sequences(year, last_value)`

---

# Entity Relationship Overview

```
Department ──┬── User
             └── Kaizen

User ──┬── Kaizen (submitter)
       ├── ReviewComment
       ├── Evaluation
       ├── Notification
       ├── PointsLedger
       ├── UserAchievement
       └── AuditLog

Kaizen ──┬── Kaizen5W1H
         ├── Kaizen5Why (×5)
         ├── KaizenBenefit
         ├── KaizenAttachment
         ├── ReviewComment
         ├── Evaluation
         ├── Implementation
         ├── BusinessImpact
         ├── TimelineEvent
         ├── KnowledgeBaseEntry
         └── Reward

Category ── Kaizen

ScoringParameter ── EvaluationScore

Achievement ── UserAchievement
```

---

# Enumerations

```prisma
enum UserRole {
  EMPLOYEE
  DEPARTMENT_MANAGER
  HR
  CMD
  SUPER_ADMIN
}

enum KaizenStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  NEEDS_CHANGES
  REJECTED
  APPROVED
  IMPLEMENTATION_IN_PROGRESS
  IMPLEMENTATION_COMPLETED
  BUSINESS_IMPACT_RECORDED
  REWARD_ISSUED
  ARCHIVED
  PUBLISHED_TO_KNOWLEDGE_BASE
}

enum KaizenPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum EstimatedImpact {
  LOW
  MEDIUM
  HIGH
  MAJOR
}

enum ReviewRecommendation {
  APPROVE
  REJECT
  NEEDS_CHANGES
}

enum ReviewConfidence {
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
}

enum AttachmentType {
  IMAGE
  VIDEO
  PDF
  DOCUMENT
  SPREADSHEET
  PRESENTATION
  OTHER
}

enum AttachmentTag {
  GENERAL
  BEFORE
  AFTER
  EVIDENCE
}

enum ImplementationVerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum NotificationType {
  KAIZEN_SUBMITTED
  KAIZEN_APPROVED
  KAIZEN_REJECTED
  KAIZEN_NEEDS_CHANGES
  KAIZEN_ASSIGNED
  IMPLEMENTATION_STARTED
  IMPLEMENTATION_COMPLETED
  REWARD_ISSUED
  ACHIEVEMENT_UNLOCKED
  KNOWLEDGE_BASE_PUBLISHED
  ANNOUNCEMENT
  COMMENT_ADDED
  MENTION
}

enum TimelineEventType {
  DRAFT_CREATED
  DRAFT_UPDATED
  SUBMITTED
  REVIEW_STARTED
  COMMENT_ADDED
  EVALUATION_SUBMITTED
  APPROVED
  REJECTED
  NEEDS_CHANGES
  RESUBMITTED
  IMPLEMENTATION_ASSIGNED
  IMPLEMENTATION_STARTED
  IMPLEMENTATION_COMPLETED
  BUSINESS_IMPACT_RECORDED
  REWARD_ISSUED
  ARCHIVED
  KNOWLEDGE_BASE_PUBLISHED
  PRIORITY_CHANGED
  STATUS_CHANGED
}

enum AchievementRarity {
  COMMON
  RARE
  EPIC
  LEGENDARY
}

enum LeaderboardPeriod {
  MONTHLY
  QUARTERLY
  YEARLY
  ALL_TIME
}

enum LeaderboardScope {
  COMPANY
  DEPARTMENT
}
```

---

# Tables

## organization

### departments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(120) | NOT NULL, UNIQUE | Display name |
| code | VARCHAR(20) | NOT NULL, UNIQUE | Short code (e.g. `INV`) |
| manager_id | UUID | FK → users.id, NULL | Department manager |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |

**Indexes:** `code`, `manager_id`, `is_active`

---

### categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(80) | NOT NULL, UNIQUE | |
| slug | VARCHAR(80) | NOT NULL, UNIQUE | URL-safe identifier |
| description | VARCHAR(255) | NULL | |
| icon | VARCHAR(50) | NULL | Lucide icon name |
| sort_order | INT | NOT NULL, DEFAULT 0 | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | NULL | |

**Seed categories:** Store Operations, Inventory, Customer Service, Technology, Marketing, Finance, Security, HR, Administration, Maintenance, Quality, Other

---

## users_and_auth

### users

Synced from Clerk via webhook. Application data stored here.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Internal ID |
| clerk_id | VARCHAR(255) | NOT NULL, UNIQUE | Clerk user ID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| display_name | VARCHAR(200) | NOT NULL | Computed or stored |
| avatar_url | TEXT | NULL | |
| department_id | UUID | FK → departments.id, NULL | |
| role | UserRole | NOT NULL, DEFAULT EMPLOYEE | Primary role |
| job_title | VARCHAR(120) | NULL | |
| phone | VARCHAR(20) | NULL | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | |
| last_login_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | NULL | |

**Indexes:** `clerk_id`, `email`, `department_id`, `role`, `is_active`

---

### user_gamification

Denormalized gamification summary for fast dashboard reads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE | |
| total_points | INT | NOT NULL, DEFAULT 0 | |
| ideas_submitted | INT | NOT NULL, DEFAULT 0 | |
| ideas_approved | INT | NOT NULL, DEFAULT 0 | |
| ideas_implemented | INT | NOT NULL, DEFAULT 0 | |
| current_rank | INT | NULL | Company rank; computed |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

## kaizen_core

### kaizen_number_sequences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| year | INT | PK | Calendar year |
| last_value | INT | NOT NULL, DEFAULT 0 | Last sequence used |

---

### kaizens

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_number | VARCHAR(20) | NOT NULL, UNIQUE | `KZN-2026-00042` |
| title | VARCHAR(120) | NOT NULL | |
| status | KaizenStatus | NOT NULL, DEFAULT DRAFT | |
| priority | KaizenPriority | NOT NULL, DEFAULT MEDIUM | |
| estimated_impact | EstimatedImpact | NOT NULL, DEFAULT MEDIUM | |
| location | VARCHAR(120) | NULL | |
| problem_statement | TEXT | NULL | Max 1000 chars (app validation) |
| current_process | TEXT | NULL | Max 1500 chars |
| proposed_solution | TEXT | NULL | Max 1500 chars |
| category_id | UUID | FK → categories.id, NULL | Required on submit |
| department_id | UUID | FK → departments.id, NOT NULL | |
| submitter_id | UUID | FK → users.id, NOT NULL | |
| assigned_reviewer_id | UUID | FK → users.id, NULL | Dept manager |
| assigned_owner_id | UUID | FK → users.id, NULL | Implementation owner |
| implementation_due_date | DATE | NULL | |
| submitted_at | TIMESTAMPTZ | NULL | |
| approved_at | TIMESTAMPTZ | NULL | |
| archived_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Indexes:**

- `status`
- `department_id`
- `submitter_id`
- `category_id`
- `assigned_reviewer_id`
- `submitted_at`
- `(status, department_id)` — review queue
- `(submitter_id, status)` — my ideas

---

### kaizen_5w1h

One row per Kaizen.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, UNIQUE, ON DELETE CASCADE | |
| what | TEXT | NULL | |
| where_location | TEXT | NULL | Maps to 5W1H "Where" (avoid SQL reserved word) |
| when_occurs | TEXT | NULL | Maps to 5W1H "When" |
| who | TEXT | NULL | |
| why | TEXT | NULL | |
| how | TEXT | NULL | |

---

### kaizen_5why

Five rows per completed Kaizen (levels 1–5).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, ON DELETE CASCADE | |
| level | INT | NOT NULL, CHECK (1–5) | |
| answer | TEXT | NOT NULL | |
| | | UNIQUE (kaizen_id, level) | |

---

### kaizen_benefits

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, ON DELETE CASCADE | |
| benefit_type | VARCHAR(50) | NOT NULL | TIME_SAVED, COST_REDUCTION, etc. |
| description | VARCHAR(500) | NOT NULL | |
| is_custom | BOOLEAN | NOT NULL, DEFAULT false | |
| sort_order | INT | NOT NULL, DEFAULT 0 | |

---

### kaizen_attachments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, ON DELETE CASCADE | |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_type | AttachmentType | NOT NULL | |
| mime_type | VARCHAR(100) | NOT NULL | |
| file_size_bytes | BIGINT | NOT NULL | Max 25 MB |
| cloudinary_public_id | VARCHAR(255) | NOT NULL | |
| cloudinary_url | TEXT | NOT NULL | |
| cloudinary_secure_url | TEXT | NOT NULL | |
| tag | AttachmentTag | NOT NULL, DEFAULT GENERAL | |
| caption | VARCHAR(255) | NULL | |
| sort_order | INT | NOT NULL, DEFAULT 0 | |
| uploaded_by_id | UUID | FK → users.id | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**Constraint:** Max 10 attachments per Kaizen (application layer)

---

## review_and_scoring

### scoring_parameters

Configurable by Super Admin. MVP ships with 5 default parameters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | |
| description | TEXT | NOT NULL | |
| guidelines | TEXT | NOT NULL | Score band guidance |
| max_score | INT | NOT NULL, DEFAULT 10 | |
| sort_order | INT | NOT NULL, DEFAULT 0 | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Default parameters:**

1. Problem Identification
2. Creative Thinking
3. Implementation
4. Usefulness
5. Maintenance / Sustainability

---

### evaluations

One final evaluation per reviewer per Kaizen (MVP: one dept manager).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id | |
| reviewer_id | UUID | FK → users.id | |
| recommendation | ReviewRecommendation | NOT NULL | |
| confidence | ReviewConfidence | NULL | |
| remarks | TEXT | NULL | Max 2000 chars |
| total_score | INT | NOT NULL | Sum of parameter scores (0–50) |
| overall_rating | DECIMAL(3,1) | NOT NULL | total_score / 5 |
| is_submitted | BOOLEAN | NOT NULL, DEFAULT false | Immutable once true |
| submitted_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Unique:** `(kaizen_id, reviewer_id)`

---

### evaluation_scores

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| evaluation_id | UUID | FK → evaluations.id, ON DELETE CASCADE | |
| parameter_id | UUID | FK → scoring_parameters.id | |
| score | INT | NOT NULL, CHECK (0–10) | |
| | | UNIQUE (evaluation_id, parameter_id) | |

---

### review_comments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, ON DELETE CASCADE | |
| author_id | UUID | FK → users.id | |
| parent_id | UUID | FK → review_comments.id, NULL | Thread replies |
| body | TEXT | NOT NULL | Max 2000 chars; rich text HTML |
| is_resolved | BOOLEAN | NOT NULL, DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Note:** Comments cannot be edited after Kaizen approval (application rule).

---

## implementation

### implementations

One row per Kaizen after approval.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, UNIQUE | |
| owner_id | UUID | FK → users.id | |
| assigned_department_id | UUID | FK → departments.id | |
| description | TEXT | NULL | |
| progress_percent | INT | NOT NULL, DEFAULT 0, CHECK (0–100) | |
| estimated_cost | DECIMAL(12,2) | NULL | |
| actual_cost | DECIMAL(12,2) | NULL | |
| time_taken_days | INT | NULL | |
| started_at | TIMESTAMPTZ | NULL | |
| completed_at | TIMESTAMPTZ | NULL | |
| completion_notes | TEXT | NULL | |
| verification_status | ImplementationVerificationStatus | NOT NULL, DEFAULT PENDING | |
| verified_by_id | UUID | FK → users.id, NULL | |
| verified_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### implementation_attachments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| implementation_id | UUID | FK → implementations.id, ON DELETE CASCADE | |
| file_name | VARCHAR(255) | NOT NULL | |
| file_type | AttachmentType | NOT NULL | |
| mime_type | VARCHAR(100) | NOT NULL | |
| file_size_bytes | BIGINT | NOT NULL | |
| cloudinary_public_id | VARCHAR(255) | NOT NULL | |
| cloudinary_secure_url | TEXT | NOT NULL | |
| uploaded_by_id | UUID | FK → users.id | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

## business_impact

### business_impacts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, UNIQUE | |
| money_saved | DECIMAL(14,2) | NULL | |
| hours_saved | DECIMAL(10,2) | NULL | |
| employees_benefited | INT | NULL | |
| customers_benefited | INT | NULL | |
| process_improvement | BOOLEAN | NOT NULL, DEFAULT false | |
| quality_improvement | BOOLEAN | NOT NULL, DEFAULT false | |
| safety_improvement | BOOLEAN | NOT NULL, DEFAULT false | |
| productivity_improvement | BOOLEAN | NOT NULL, DEFAULT false | |
| customer_satisfaction_improvement | BOOLEAN | NOT NULL, DEFAULT false | |
| remarks | TEXT | NULL | |
| recorded_by_id | UUID | FK → users.id | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

## gamification_mvp

Basic gamification only. No monthly challenges, XP levels, or streaks in MVP.

### points_ledger

Append-only points history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| amount | INT | NOT NULL | Always positive |
| reason | VARCHAR(100) | NOT NULL | e.g. `KAIZEN_SUBMITTED` |
| kaizen_id | UUID | FK → kaizens.id, NULL | |
| issued_by_id | UUID | FK → users.id, NULL | NULL = system |
| created_at | TIMESTAMPTZ | NOT NULL | |

**MVP point values (stored in `platform_settings`):**

| Action | Points |
|--------|--------|
| Kaizen submitted | 10 |
| Idea approved | 50 |
| Implementation completed | 100 |
| Business impact verified | 150 |
| Achievement unlocked | 25 |

---

### achievements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| code | VARCHAR(50) | NOT NULL, UNIQUE | e.g. `FIRST_KAIZEN` |
| name | VARCHAR(100) | NOT NULL | |
| description | VARCHAR(255) | NOT NULL | |
| icon | VARCHAR(50) | NOT NULL | Lucide icon name |
| rarity | AchievementRarity | NOT NULL, DEFAULT COMMON | |
| points_awarded | INT | NOT NULL, DEFAULT 25 | |
| criteria | JSONB | NOT NULL | Machine-readable unlock rules |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**MVP achievements (10):**

| Code | Criteria |
|------|----------|
| `FIRST_KAIZEN` | 1 submission |
| `FIVE_SUBMISSIONS` | 5 submissions |
| `FIRST_APPROVAL` | 1 approval |
| `FIVE_APPROVALS` | 5 approvals |
| `IMPLEMENTER` | 1 implementation completed |
| `IMPACT_MAKER` | 1 business impact recorded |
| `TOP_CONTRIBUTOR` | Top 10 on monthly leaderboard |
| `INNOVATION_CHAMPION` | 10 approvals |
| `DEPARTMENT_HERO` | Highest points in department (monthly) |
| `QUALITY_EXPERT` | Avg score ≥ 8.0 with 3+ approvals |

---

### user_achievements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| achievement_id | UUID | FK → achievements.id | |
| earned_at | TIMESTAMPTZ | NOT NULL | |
| | | UNIQUE (user_id, achievement_id) | |

---

### rewards

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| kaizen_id | UUID | FK → kaizens.id | |
| points | INT | NOT NULL | |
| reason | VARCHAR(255) | NOT NULL | |
| issued_by_id | UUID | FK → users.id, NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

### leaderboard_snapshots

Precomputed rankings refreshed on reward events and every 5 minutes (cron).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| period | LeaderboardPeriod | NOT NULL | |
| scope | LeaderboardScope | NOT NULL | |
| department_id | UUID | FK → departments.id, NULL | NULL = company-wide |
| rankings | JSONB | NOT NULL | Ordered array of rank entries |
| computed_at | TIMESTAMPTZ | NOT NULL | |

**Unique:** `(period, scope, department_id)`

**Ranking entry shape:**

```json
{
  "rank": 1,
  "userId": "uuid",
  "displayName": "Chinmay",
  "departmentName": "Inventory",
  "totalPoints": 450,
  "ideasApproved": 8,
  "achievementCount": 3
}
```

---

## knowledge_base

### knowledge_base_entries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, UNIQUE | |
| title | VARCHAR(200) | NOT NULL | |
| summary | TEXT | NOT NULL | |
| problem | TEXT | NOT NULL | |
| solution | TEXT | NOT NULL | |
| benefits | TEXT | NOT NULL | |
| department_id | UUID | FK → departments.id | |
| category_id | UUID | FK → categories.id | |
| tags | TEXT[] | NOT NULL, DEFAULT '{}' | |
| published_by_id | UUID | FK → users.id | |
| published_at | TIMESTAMPTZ | NOT NULL | |
| search_vector | TSVECTOR | NULL | Full-text search (generated) |

**Index:** GIN on `search_vector`, GIN on `tags`

---

## notifications

### notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| type | NotificationType | NOT NULL | |
| title | VARCHAR(200) | NOT NULL | |
| body | TEXT | NOT NULL | |
| entity_type | VARCHAR(50) | NULL | e.g. `kaizen` |
| entity_id | UUID | NULL | |
| is_read | BOOLEAN | NOT NULL, DEFAULT false | |
| read_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**Indexes:** `(user_id, is_read)`, `(user_id, created_at DESC)`

---

## platform

### announcements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| title | VARCHAR(200) | NOT NULL | |
| body | TEXT | NOT NULL | |
| author_id | UUID | FK → users.id | |
| target_roles | UserRole[] | NOT NULL | |
| is_published | BOOLEAN | NOT NULL, DEFAULT false | |
| published_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### platform_settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| key | VARCHAR(100) | NOT NULL, UNIQUE | |
| value | JSONB | NOT NULL | |
| description | VARCHAR(255) | NULL | |
| updated_by_id | UUID | FK → users.id, NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**MVP keys:**

- `points.kaizen_submitted`
- `points.idea_approved`
- `points.implementation_completed`
- `points.business_impact_verified`
- `points.achievement_unlocked`
- `upload.max_file_size_bytes`
- `upload.max_files_per_kaizen`
- `pagination.default_page_size`

---

## audit_and_timeline

### timeline_events

Immutable activity log per Kaizen.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kaizen_id | UUID | FK → kaizens.id, ON DELETE CASCADE | |
| event_type | TimelineEventType | NOT NULL | |
| actor_id | UUID | FK → users.id, NULL | NULL = system |
| description | TEXT | NOT NULL | Human-readable |
| metadata | JSONB | NULL | Structured payload |
| created_at | TIMESTAMPTZ | NOT NULL | |

**Index:** `(kaizen_id, created_at DESC)`

**Rule:** No UPDATE or DELETE permitted.

---

### audit_logs

Immutable system-wide audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NULL | |
| user_role | UserRole | NULL | Role at time of action |
| action | VARCHAR(100) | NOT NULL | e.g. `kaizen.approve` |
| entity_type | VARCHAR(50) | NOT NULL | |
| entity_id | UUID | NOT NULL | |
| previous_value | JSONB | NULL | |
| new_value | JSONB | NULL | |
| ip_address | INET | NULL | |
| user_agent | TEXT | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**Index:** `(entity_type, entity_id)`, `(user_id, created_at DESC)`, `(created_at DESC)`

**Rule:** No UPDATE or DELETE permitted.

---

# Prisma Schema Reference

The canonical Prisma schema lives in the **backend repository** at `prisma/schema.prisma`.

Below is the consolidated schema definition for implementation.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums and models as defined in sections above.
// Full generated file will be created during backend implementation.
```

---

# Seed Data

The backend `prisma/seed.ts` must seed:

1. **12 categories** (from product requirements)
2. **5 scoring parameters** with guidelines
3. **10 achievements** with criteria
4. **Platform settings** with default point values
5. **Initial Super Admin** (linked to Clerk user after first login)

Departments and users are created via Admin Panel or Clerk webhook.

---

# Migration Strategy

1. `001_initial_schema` — all tables and enums
2. `002_add_search_vector` — full-text search trigger on `knowledge_base_entries`
3. Future migrations — additive only; no destructive changes without backup

---

# Data Retention

| Data | Retention |
|------|-----------|
| Kaizens (all statuses) | Permanent |
| Timeline events | Permanent |
| Audit logs | Permanent |
| Notifications (read) | 90 days (configurable) |
| Leaderboard snapshots | Replace on recompute |
| Draft Kaizens (abandoned) | 180 days inactive → soft archive (future) |

---

# Security Rules

- Never expose `clerk_id` to frontend except via `/me`
- Row-level access enforced in service layer, not database RLS (MVP)
- Uploaded file URLs use Cloudinary signed URLs where appropriate
- `audit_logs` and `timeline_events` are append-only at application level

---

# Performance Notes

- Denormalize `user_gamification` on every points change
- Precompute leaderboard snapshots; do not rank on every request
- Paginate all list endpoints (default page size: 25)
- Index all foreign keys and filter columns listed above
- Use `SELECT` projections; avoid `SELECT *` in hot paths

---

# Acceptance Criteria

- Schema supports full MVP workflow without nullable workarounds
- All status transitions map to exactly one `KaizenStatus` value
- Single reviewer evaluation per Kaizen in MVP
- Knowledge base full-text search operational
- Gamification limited to points, achievements, leaderboard
- Audit and timeline tables are immutable
