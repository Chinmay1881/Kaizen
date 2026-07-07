# API Specification

Version: 1.0.0

Status: Final (MVP)

Related Documents

- engineering/01_DATABASE_SCHEMA.md
- engineering/02_FOLDER_STRUCTURE.md
- product/01_USERS_AND_ROLES.md
- product/02_PRODUCT_REQUIREMENTS.md

---

# Purpose

This document defines the REST API contract for the Muliya Kaizan backend (Express).

The frontend communicates exclusively through this API. No direct database access from the client.

---

# Base Configuration

| Setting | Value |
|---------|-------|
| Base URL (production) | `https://api.kaizen.muliya.com` |
| Base URL (development) | `http://localhost:4000` |
| API prefix | `/api/v1` |
| Protocol | HTTPS (production) |
| Content-Type | `application/json` |
| Character encoding | UTF-8 |

---

# Authentication

## Provider

Clerk handles authentication and session management. The frontend uses custom sign-in/sign-up pages that call Clerk APIs; the backend validates Clerk-issued JWTs.

## Request Header

```
Authorization: Bearer <clerk_session_jwt>
```

## Clerk Webhook

```
POST /webhooks/clerk
```

Not under `/api/v1`. Verified via Clerk webhook signing secret.

**Handled events:**

- `user.created` — create `users` row (inactive until role assigned)
- `user.updated` — sync email, name, avatar
- `user.deleted` — soft-delete user

## Session Resolution

Every protected endpoint:

1. Verify JWT via Clerk
2. Resolve `users` row by `clerk_id`
3. Reject if user is inactive or deleted
4. Attach `req.user` with `{ id, clerkId, email, role, departmentId }`

---

# Response Envelope

## Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 142,
    "totalPages": 6
  }
}
```

`meta` is included only on paginated list responses.

## Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be at least 10 characters.",
    "details": [
      {
        "field": "title",
        "message": "Title must be at least 10 characters."
      }
    ]
  }
}
```

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No content (DELETE) |
| 400 | Validation error |
| 401 | Missing or invalid token |
| 403 | Forbidden (RBAC) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, invalid state transition) |
| 422 | Unprocessable entity (business rule violation) |
| 429 | Rate limited |
| 500 | Internal server error |

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or expired token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource does not exist |
| `VALIDATION_ERROR` | Request body/query invalid |
| `INVALID_STATE_TRANSITION` | Workflow rule violated |
| `DUPLICATE_RESOURCE` | Unique constraint violation |
| `UPLOAD_LIMIT_EXCEEDED` | File count or size exceeded |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |

---

# Pagination, Sorting, Filtering

## Pagination (all list endpoints)

| Param | Type | Default | Max |
|-------|------|---------|-----|
| `page` | integer | 1 | — |
| `pageSize` | integer | 25 | 100 |

## Sorting

| Param | Type | Example |
|-------|------|---------|
| `sortBy` | string | `createdAt` |
| `sortOrder` | `asc` \| `desc` | `desc` |

## Date Range Filter

| Param | Type |
|-------|------|
| `dateFrom` | ISO 8601 date |
| `dateTo` | ISO 8601 date |

---

# RBAC Summary (MVP)

| Resource | Employee | Dept Manager | HR | CMD | Super Admin |
|----------|----------|--------------|-----|-----|-------------|
| Own Kaizens | CRUD draft, read | read dept | read all | read all | read all |
| Submit Kaizen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review queue | ❌ | dept only | read all | read all | read all |
| Approve/Reject | ❌ | dept only | ❌ | ❌ | ❌ |
| Score Kaizen | ❌ | dept only | ❌ | ❌ | ❌ |
| Implementation | read own | manage dept | read all | read all | read all |
| Business impact | ❌ | ✅ | ✅ | ✅ | ✅ |
| Company analytics | personal only | dept only | ✅ | ✅ | ✅ |
| Admin | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |

**MVP approval:** Only Department Manager can approve/reject for their department.

---

# Endpoints

## Health

### GET /health

Public. No authentication.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-07-06T06:30:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## Authentication & Current User

### GET /api/v1/me

Returns authenticated user profile with gamification summary.

**Auth:** Required

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "chinmay@muliya.com",
    "firstName": "Chinmay",
    "lastName": "Patel",
    "displayName": "Chinmay Patel",
    "avatarUrl": "https://...",
    "role": "EMPLOYEE",
    "department": {
      "id": "uuid",
      "name": "Inventory",
      "code": "INV"
    },
    "jobTitle": "Store Associate",
    "gamification": {
      "totalPoints": 320,
      "ideasSubmitted": 12,
      "ideasApproved": 5,
      "ideasImplemented": 2,
      "currentRank": 8
    }
  }
}
```

---

### PATCH /api/v1/me

Update own profile (non-auth fields).

**Auth:** Required

**Body:**

```json
{
  "jobTitle": "Senior Associate",
  "phone": "+91XXXXXXXXXX"
}
```

**Allowed fields:** `jobTitle`, `phone`

**Response 200:** Updated user object (same shape as GET /me)

---

## Users (Admin)

### GET /api/v1/users

**Auth:** Super Admin

**Query:** `page`, `pageSize`, `search`, `role`, `departmentId`, `isActive`

**Response 200:** Paginated user list

---

### GET /api/v1/users/:id

**Auth:** Super Admin, HR, CMD (read only)

---

### POST /api/v1/users

Create user record and invite via Clerk.

**Auth:** Super Admin

**Body:**

```json
{
  "email": "user@muliya.com",
  "firstName": "Ravi",
  "lastName": "Kumar",
  "role": "EMPLOYEE",
  "departmentId": "uuid"
}
```

**Response 201:** Created user

---

### PATCH /api/v1/users/:id

**Auth:** Super Admin

**Body:**

```json
{
  "role": "DEPARTMENT_MANAGER",
  "departmentId": "uuid",
  "isActive": true
}
```

---

### DELETE /api/v1/users/:id

Soft-delete user.

**Auth:** Super Admin

**Response 204**

---

## Departments

### GET /api/v1/departments

**Auth:** Required (all roles)

**Query:** `isActive`

---

### POST /api/v1/departments

**Auth:** Super Admin

**Body:**

```json
{
  "name": "Inventory",
  "code": "INV",
  "managerId": "uuid"
}
```

---

### PATCH /api/v1/departments/:id

**Auth:** Super Admin

---

### DELETE /api/v1/departments/:id

Soft-delete.

**Auth:** Super Admin

---

## Categories

### GET /api/v1/categories

**Auth:** Required

**Query:** `isActive`

---

### POST /api/v1/categories

**Auth:** Super Admin

---

### PATCH /api/v1/categories/:id

**Auth:** Super Admin

---

## Kaizens

### GET /api/v1/kaizens

List Kaizens scoped by role.

| Role | Scope |
|------|-------|
| Employee | Own submissions only |
| Dept Manager | Own department |
| HR, CMD, Super Admin | All |

**Query:**

| Param | Type |
|-------|------|
| `status` | KaizenStatus (comma-separated) |
| `priority` | KaizenPriority |
| `categoryId` | UUID |
| `departmentId` | UUID |
| `submitterId` | UUID |
| `search` | string (title, kaizenNumber) |
| `page`, `pageSize`, `sortBy`, `sortOrder`, `dateFrom`, `dateTo` | |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "kaizenNumber": "KZN-2026-00042",
      "title": "Reduce inventory counting time",
      "status": "SUBMITTED",
      "priority": "HIGH",
      "estimatedImpact": "MAJOR",
      "category": { "id": "uuid", "name": "Inventory" },
      "department": { "id": "uuid", "name": "Inventory" },
      "submitter": { "id": "uuid", "displayName": "Chinmay Patel" },
      "submittedAt": "2026-07-06T10:00:00.000Z",
      "createdAt": "2026-07-05T08:00:00.000Z",
      "updatedAt": "2026-07-06T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 25, "total": 42, "totalPages": 2 }
}
```

---

### POST /api/v1/kaizens

Create new draft Kaizen.

**Auth:** Required

**Body:**

```json
{
  "title": "Optional draft title",
  "departmentId": "uuid"
}
```

If `departmentId` omitted, uses user's department.

**Response 201:** Full Kaizen detail (draft)

---

### GET /api/v1/kaizens/:id

Full Kaizen detail including 5W1H, 5Why, benefits, attachments summary.

**Auth:** Required (scoped by role)

---

### PATCH /api/v1/kaizens/:id

Update Kaizen. Only allowed when status is `DRAFT` or `NEEDS_CHANGES`.

**Auth:** Submitter (employee) or Super Admin

**Body (partial update):**

```json
{
  "title": "Reduce inventory counting time by 40%",
  "categoryId": "uuid",
  "priority": "HIGH",
  "estimatedImpact": "MAJOR",
  "location": "Warehouse A",
  "problemStatement": "...",
  "currentProcess": "...",
  "proposedSolution": "...",
  "fiveW1H": {
    "what": "...",
    "whereLocation": "...",
    "whenOccurs": "...",
    "who": "...",
    "why": "...",
    "how": "..."
  },
  "fiveWhy": [
    { "level": 1, "answer": "..." },
    { "level": 2, "answer": "..." },
    { "level": 3, "answer": "..." },
    { "level": 4, "answer": "..." },
    { "level": 5, "answer": "..." }
  ],
  "benefits": [
    { "benefitType": "TIME_SAVED", "description": "2 hours per day", "isCustom": false }
  ]
}
```

**Response 200:** Updated Kaizen detail

---

### DELETE /api/v1/kaizens/:id

Delete draft only.

**Auth:** Submitter or Super Admin

**Response 204**

---

### POST /api/v1/kaizens/:id/submit

Submit Kaizen for review. Transitions `DRAFT` or `NEEDS_CHANGES` → `SUBMITTED`.

**Auth:** Submitter

**Validation:** All required wizard fields complete, category set, min 1 benefit, 5W1H complete, 5Why complete (5 levels).

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "kaizenNumber": "KZN-2026-00042",
    "status": "SUBMITTED",
    "submittedAt": "2026-07-06T10:00:00.000Z"
  }
}
```

**Side effects:** Timeline event, notification to dept manager, points (+10)

---

### POST /api/v1/kaizens/:id/duplicate

Duplicate a draft or create copy from existing Kaizen.

**Auth:** Submitter

**Response 201:** New draft Kaizen

---

## Kaizen Attachments

### GET /api/v1/kaizens/:id/attachments

**Auth:** Required (scoped)

---

### POST /api/v1/kaizens/:id/attachments

Register attachment after Cloudinary upload.

**Auth:** Submitter (draft/needs_changes only)

**Body:**

```json
{
  "fileName": "before-photo.jpg",
  "fileType": "IMAGE",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 1048576,
  "cloudinaryPublicId": "kaizen/abc123",
  "cloudinaryUrl": "http://...",
  "cloudinarySecureUrl": "https://...",
  "tag": "BEFORE",
  "caption": "Current process"
}
```

**Response 201**

---

### DELETE /api/v1/kaizens/:id/attachments/:attachmentId

**Auth:** Submitter (draft/needs_changes only)

**Response 204**

---

## Review

### GET /api/v1/reviews/queue

Review queue for department managers.

**Auth:** Department Manager (dept scoped), HR/CMD/Super Admin (all)

**Query:** `status`, `priority`, `departmentId`, `categoryId`, `search`, pagination, sorting

**Response 200:** Paginated Kaizen list with review metadata

---

### POST /api/v1/kaizens/:id/review/start

Transition `SUBMITTED` → `UNDER_REVIEW`.

**Auth:** Department Manager (same department)

**Response 200**

---

### POST /api/v1/kaizens/:id/review/approve

**Auth:** Department Manager (same department)

**Precondition:** Evaluation submitted with `recommendation: APPROVE`

**Body:**

```json
{
  "notes": "Excellent improvement proposal."
}
```

**Transition:** `UNDER_REVIEW` → `APPROVED`

**Side effects:** Timeline, notification, points (+50 to submitter)

---

### POST /api/v1/kaizens/:id/review/reject

**Auth:** Department Manager

**Precondition:** Evaluation submitted with `recommendation: REJECT`

**Body:**

```json
{
  "notes": "Does not meet current priorities."
}
```

**Transition:** `UNDER_REVIEW` → `REJECTED`

---

### POST /api/v1/kaizens/:id/review/needs-changes

**Auth:** Department Manager

**Body:**

```json
{
  "notes": "Please provide more detail on cost savings."
}
```

**Transition:** `UNDER_REVIEW` → `NEEDS_CHANGES`

---

### PATCH /api/v1/kaizens/:id/priority

**Auth:** Department Manager, HR, CMD, Super Admin

**Body:**

```json
{
  "priority": "CRITICAL"
}
```

---

## Review Comments

### GET /api/v1/kaizens/:id/comments

**Auth:** Required (scoped)

---

### POST /api/v1/kaizens/:id/comments

**Auth:** Reviewers + submitter (on needs_changes)

**Body:**

```json
{
  "body": "<p>Please clarify the timeline.</p>",
  "parentId": null
}
```

**Response 201**

---

### PATCH /api/v1/kaizens/:id/comments/:commentId/resolve

**Auth:** Department Manager

**Response 200**

---

## Scoring

### GET /api/v1/scoring/parameters

Active scoring parameters.

**Auth:** Department Manager+

---

### GET /api/v1/kaizens/:id/evaluation

Get evaluation for current reviewer (draft or submitted).

**Auth:** Department Manager

---

### PUT /api/v1/kaizens/:id/evaluation

Create or update draft evaluation.

**Auth:** Department Manager (same department)

**Body:**

```json
{
  "scores": [
    { "parameterId": "uuid", "score": 8 },
    { "parameterId": "uuid", "score": 7 },
    { "parameterId": "uuid", "score": 9 },
    { "parameterId": "uuid", "score": 8 },
    { "parameterId": "uuid", "score": 7 }
  ],
  "recommendation": "APPROVE",
  "confidence": "HIGH",
  "remarks": "Strong operational improvement."
}
```

**Response 200:** Evaluation with computed `totalScore` and `overallRating`

---

### POST /api/v1/kaizens/:id/evaluation/submit

Finalize evaluation. Becomes read-only.

**Auth:** Department Manager

**Response 200**

---

### GET /api/v1/kaizens/:id/score

Aggregated score for a Kaizen (MVP: single evaluation).

**Auth:** Required (scoped)

**Response 200:**

```json
{
  "success": true,
  "data": {
    "totalScore": 39,
    "overallRating": 7.8,
    "evaluations": [
      {
        "reviewer": { "id": "uuid", "displayName": "Manager Name" },
        "scores": [
          { "parameter": "Problem Identification", "score": 8 }
        ],
        "recommendation": "APPROVE",
        "submittedAt": "2026-07-07T09:00:00.000Z"
      }
    ]
  }
}
```

---

## Implementation

### GET /api/v1/implementations

List implementations.

**Auth:** Dept Manager (dept), HR/CMD/Admin (all), Employee (own Kaizens read-only)

**Query:** `status`, `departmentId`, `ownerId`, pagination

---

### GET /api/v1/kaizens/:id/implementation

**Auth:** Required (scoped)

---

### POST /api/v1/kaizens/:id/implementation/assign

Assign implementation. Transitions `APPROVED` → `IMPLEMENTATION_IN_PROGRESS`.

**Auth:** Department Manager

**Body:**

```json
{
  "ownerId": "uuid",
  "assignedDepartmentId": "uuid",
  "dueDate": "2026-08-01",
  "description": "Implement barcode scanning workflow"
}
```

---

### PATCH /api/v1/kaizens/:id/implementation

Update implementation progress.

**Auth:** Department Manager or assigned owner

**Body:**

```json
{
  "progressPercent": 75,
  "description": "Phase 1 complete",
  "estimatedCost": 5000,
  "actualCost": 4800,
  "timeTakenDays": 14
}
```

---

### POST /api/v1/kaizens/:id/implementation/complete

Mark implementation complete. Transitions → `IMPLEMENTATION_COMPLETED`.

**Auth:** Department Manager or assigned owner

**Body:**

```json
{
  "completionNotes": "All stores migrated to new process."
}
```

---

### POST /api/v1/kaizens/:id/implementation/verify

Verify implementation.

**Auth:** Department Manager, HR, CMD

**Body:**

```json
{
  "status": "VERIFIED",
  "notes": "Verified on site."
}
```

---

### POST /api/v1/kaizens/:id/implementation/attachments

Register implementation evidence file.

**Auth:** Department Manager or owner

---

## Business Impact

### GET /api/v1/kaizens/:id/business-impact

**Auth:** Required (scoped)

---

### POST /api/v1/kaizens/:id/business-impact

Record business impact. Transitions `IMPLEMENTATION_COMPLETED` → `BUSINESS_IMPACT_RECORDED`.

**Auth:** Department Manager, HR, CMD

**Body:**

```json
{
  "moneySaved": 150000,
  "hoursSaved": 120,
  "employeesBenefited": 25,
  "customersBenefited": 500,
  "processImprovement": true,
  "qualityImprovement": true,
  "safetyImprovement": false,
  "productivityImprovement": true,
  "customerSatisfactionImprovement": true,
  "remarks": "Significant reduction in stock discrepancies."
}
```

**Side effects:** Triggers reward issuance automatically

---

## Workflow & Timeline

### GET /api/v1/kaizens/:id/timeline

Immutable timeline events.

**Auth:** Required (scoped)

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "eventType": "SUBMITTED",
      "actor": { "id": "uuid", "displayName": "Chinmay Patel" },
      "description": "Kaizen submitted for review",
      "metadata": {},
      "createdAt": "2026-07-06T10:00:00.000Z"
    }
  ]
}
```

---

## Rewards

### POST /api/v1/kaizens/:id/rewards/issue

Internal endpoint called by workflow service after business impact. Also exposed for manual retry by Super Admin.

**Auth:** System (internal) or Super Admin

**Transition:** `BUSINESS_IMPACT_RECORDED` → `REWARD_ISSUED`

**Side effects:** Points ledger, achievements check, leaderboard recompute, notification

---

### GET /api/v1/users/:id/rewards

Reward history.

**Auth:** Self, HR, CMD, Super Admin

---

## Archive & Knowledge Base

### POST /api/v1/kaizens/:id/archive

**Auth:** Department Manager, Super Admin

**Transition:** `REWARD_ISSUED` → `ARCHIVED`

---

### POST /api/v1/kaizens/:id/publish

Publish to knowledge base.

**Auth:** Department Manager, HR, Super Admin

**Transition:** `ARCHIVED` → `PUBLISHED_TO_KNOWLEDGE_BASE`

**Body:**

```json
{
  "summary": "Reduced inventory counting time by 40% using barcode scanning.",
  "tags": ["inventory", "barcode", "efficiency"]
}
```

**Side effects:** Creates `knowledge_base_entries` row, notification

---

### GET /api/v1/knowledge-base

Search and browse published Kaizens.

**Auth:** Required (all roles)

**Query:** `search`, `categoryId`, `departmentId`, `tags`, pagination

---

### GET /api/v1/knowledge-base/:id

**Auth:** Required

---

## Dashboards

### GET /api/v1/dashboard/employee

**Auth:** Required

**Response 200:**

```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalIdeas": 12,
      "approved": 5,
      "pending": 3,
      "rejected": 1,
      "totalPoints": 320,
      "leaderboardRank": 8
    },
    "recentActivity": [],
    "recentIdeas": [],
    "notifications": [],
    "achievements": [],
    "leaderboardPreview": [],
    "monthlyProgress": []
  }
}
```

---

### GET /api/v1/dashboard/manager

**Auth:** Department Manager

---

### GET /api/v1/dashboard/hr

**Auth:** HR

---

### GET /api/v1/dashboard/cmd

**Auth:** CMD

---

### GET /api/v1/dashboard/admin

**Auth:** Super Admin

---

## Analytics

MVP analytics: KPI cards, trend charts, department breakdowns, exports (PDF, Excel, CSV). No AI insights, heatmaps, or predictive analytics.

### GET /api/v1/analytics/overview

**Auth:** HR, CMD, Super Admin

**Query:** `dateFrom`, `dateTo`

---

### GET /api/v1/analytics/departments

**Auth:** Dept Manager (own dept), HR, CMD, Super Admin

---

### GET /api/v1/analytics/employees

**Auth:** HR, CMD, Super Admin

---

### GET /api/v1/analytics/kaizens

Kaizen volume and status breakdown.

**Auth:** Scoped by role

---

### GET /api/v1/analytics/trends

**Auth:** HR, CMD, Super Admin

**Query:** `metric` (submissions, approvals, implementations), `granularity` (day, week, month), `dateFrom`, `dateTo`

---

### GET /api/v1/analytics/personal

Personal analytics for any authenticated user.

**Auth:** Required (self)

---

### POST /api/v1/analytics/reports/export

**Auth:** HR, CMD, Super Admin

**Body:**

```json
{
  "reportType": "MONTHLY",
  "format": "PDF",
  "dateFrom": "2026-06-01",
  "dateTo": "2026-06-30",
  "departmentId": null
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://...",
    "expiresAt": "2026-07-06T07:00:00.000Z"
  }
}
```

---

## Gamification (MVP — Basic)

### GET /api/v1/leaderboard

**Auth:** Required

**Query:**

| Param | Values |
|-------|--------|
| `period` | `MONTHLY`, `QUARTERLY`, `YEARLY`, `ALL_TIME` |
| `scope` | `COMPANY`, `DEPARTMENT` |
| `departmentId` | UUID (required when scope=DEPARTMENT) |

---

### GET /api/v1/achievements

All achievement definitions.

**Auth:** Required

---

### GET /api/v1/users/:id/achievements

User's earned achievements.

**Auth:** Self, HR, CMD, Super Admin

---

### GET /api/v1/users/:id/points

Points ledger history.

**Auth:** Self, HR, CMD, Super Admin

---

## Notifications

### GET /api/v1/notifications

**Auth:** Required

**Query:** `isRead`, pagination

---

### PATCH /api/v1/notifications/:id/read

**Auth:** Required (own notifications)

---

### POST /api/v1/notifications/read-all

**Auth:** Required

**Response 200:** `{ "markedRead": 12 }`

---

### GET /api/v1/notifications/unread-count

**Auth:** Required

**Response 200:** `{ "count": 5 }`

---

## Uploads

### POST /api/v1/uploads/sign

Generate Cloudinary upload signature.

**Auth:** Required

**Body:**

```json
{
  "folder": "kaizen",
  "resourceType": "image"
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "signature": "...",
    "timestamp": 1720000000,
    "apiKey": "...",
    "cloudName": "...",
    "folder": "kaizen"
  }
}
```

---

## Admin

### GET /api/v1/admin/settings

**Auth:** Super Admin

---

### PATCH /api/v1/admin/settings

**Auth:** Super Admin

**Body:**

```json
{
  "settings": [
    { "key": "points.kaizen_submitted", "value": 10 }
  ]
}
```

---

### GET /api/v1/admin/scoring-parameters

**Auth:** Super Admin

---

### PATCH /api/v1/admin/scoring-parameters/:id

**Auth:** Super Admin

---

### GET /api/v1/admin/audit-logs

**Auth:** CMD, Super Admin

**Query:** `userId`, `action`, `entityType`, `dateFrom`, `dateTo`, pagination

---

### GET /api/v1/admin/announcements

**Auth:** HR, Super Admin

---

### POST /api/v1/admin/announcements

**Auth:** HR, Super Admin

---

## Announcements (Read)

### GET /api/v1/announcements

Published announcements for current user's role.

**Auth:** Required

---

# Webhooks

## POST /webhooks/clerk

**Headers:** `svix-id`, `svix-timestamp`, `svix-signature`

**Body:** Clerk webhook payload

**Response 200:** `{ "received": true }`

---

# Rate Limiting

| Endpoint group | Limit |
|----------------|-------|
| General API | 100 req/min per user |
| Auth / me | 30 req/min per user |
| Upload sign | 20 req/min per user |
| Export | 5 req/min per user |

---

# CORS

**Allowed origins (production):**

- `https://kaizen.muliya.com`
- `https://www.kaizen.muliya.com`

**Development:**

- `http://localhost:3000`

**Allowed methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed headers:** Authorization, Content-Type

**Credentials:** true

---

# Validation Rules (Key Fields)

| Field | Rule |
|-------|------|
| `title` | 10–120 characters |
| `problemStatement` | 1–1000 characters |
| `currentProcess` | 0–1500 characters |
| `proposedSolution` | 1–1500 characters |
| `fiveWhy[].answer` | 1–500 characters each |
| `benefits` | Min 1 on submit |
| `score` | 0–10 integer per parameter |
| `remarks` | 0–2000 characters |
| `comment.body` | 1–2000 characters |
| File size | Max 25 MB |
| Files per Kaizen | Max 10 |

---

# Workflow Service (Internal)

All status transitions MUST go through `WorkflowService.transition(kaizenId, toStatus, actor, metadata)`.

Direct status updates in controllers are prohibited.

**WorkflowService responsibilities:**

1. Validate transition against state machine
2. Update `kaizens.status`
3. Create `timeline_events` row
4. Create `audit_logs` row
5. Emit domain events for notifications, gamification, analytics

---

# Domain Events (Internal)

| Event | Subscribers |
|-------|-------------|
| `kaizen.submitted` | NotificationService, GamificationService |
| `kaizen.approved` | NotificationService, GamificationService |
| `kaizen.rejected` | NotificationService |
| `kaizen.needs_changes` | NotificationService |
| `implementation.completed` | NotificationService |
| `business_impact.recorded` | RewardService, NotificationService |
| `reward.issued` | GamificationService, LeaderboardService |
| `knowledge_base.published` | NotificationService |

---

# Implementation Order Mapping

| Phase | Endpoints |
|-------|-----------|
| 1. Authentication | `/health`, `/webhooks/clerk`, `/api/v1/me` |
| 2. Database | Prisma migrations (no API) |
| 3. Backend APIs | Users, departments, categories |
| 4. Global Layout | `/me`, announcements |
| 5. Dashboard | `/dashboard/*` |
| 6. Kaizen Wizard | `/kaizens/*`, `/uploads/sign` |
| 7. Review Workspace | `/reviews/*`, comments |
| 8. Scoring | `/scoring/*`, evaluation |
| 9. Workflow | timeline, transitions |
| 10. Notifications | `/notifications/*` |
| 11. Analytics | `/analytics/*` |
| 12. Knowledge Base | `/knowledge-base/*`, publish |
| 13. Gamification | `/leaderboard`, achievements, points |
| 14. Admin Panel | `/admin/*`, users, departments |

---

# Acceptance Criteria

- All endpoints return consistent envelope format
- RBAC enforced on every protected route
- Workflow transitions reject invalid state changes with `409`
- Pagination on all list endpoints
- Clerk JWT validation on all `/api/v1/*` routes except health
- Single-stage dept manager approval enforced
- No endpoints for excluded MVP features (challenges, AI, command palette, Power BI, heatmaps)
