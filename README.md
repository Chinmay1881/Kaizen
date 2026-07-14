# Muliya Kaizen
### Enterprise Kaizen & Continuous Improvement Management Platform

An enterprise-grade Kaizen Management System built for Muliya Gold & Diamonds to streamline idea submission, review, implementation, analytics, reporting, and organizational innovation.

---

# Overview

Muliya Kaizen is a full-stack web application designed to digitize and manage the complete lifecycle of employee improvement ideas.

The platform enables employees to submit improvement ideas (Kaizens), managers to review and evaluate them, implementation teams to execute approved ideas, and executives to monitor organizational innovation through powerful analytics and reporting dashboards.

The system replaces fragmented workflows with a centralized platform that supports collaboration, transparency, and continuous improvement.

---

# Key Features

## Employee Workspace

- Submit Kaizens
- Track idea status
- Personal innovation dashboard
- Achievement system
- Leaderboard
- Personal analytics
- Innovation timeline
- Contribution history

---

## Review Workspace

- Enterprise review inbox
- Evaluation scorecards
- Approval / Rejection workflow
- Comments
- Timeline
- Keyboard shortcuts
- Saved views
- Advanced filtering

---

## Implementation Workspace

- Implementation queue
- Progress tracking
- Milestone management
- Business impact recording
- Completion verification
- Timeline
- Implementation analytics

---

## Executive Dashboard

- Company overview
- Department performance
- Business impact
- Leaderboards
- Quick actions
- Live KPIs
- Team snapshot
- Recent activity

---

## Analytics Studio

- Executive analytics
- Department analytics
- Employee analytics
- Business intelligence dashboards
- Interactive charts
- Drill-down analysis
- Insight generation

---

## Report Studio

- Live report builder
- PDF export
- Excel export
- CSV export
- Download center
- Scheduled reports
- Report templates
- Executive summaries

---

## Admin Control Center

- User management
- Department management
- Category management
- Platform settings
- Permissions matrix
- Activity log
- Bulk operations

---

## Additional Features

- Role Based Access Control (RBAC)
- Notifications
- Gamification
- Achievements
- Leaderboards
- Global Search
- Saved Views
- Command Palette
- Responsive Design
- Modern Enterprise UI
- Dark Mode
- Accessibility Support

---

# Technology Stack

## Frontend

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- TanStack Query
- Recharts
- Clerk Authentication

---

## Backend

- Node.js
- Express
- TypeScript
- Prisma ORM

---

## Database

- PostgreSQL (Neon)

---

## Storage

- Cloudinary

---

## Authentication

- Clerk

---

# Project Architecture

```
Employee
        │
        ▼
Next.js Frontend
        │
REST API
        ▼
Express Backend
        │
Prisma ORM
        ▼
PostgreSQL
        │
Cloudinary
```

---

# User Roles

- Employee
- Department Manager
- HR
- CMD
- Super Admin

Each role has dedicated dashboards, permissions, and workflows.

---

# Workflow

Employee

↓

Submit Kaizen

↓

Manager Review

↓

Approval / Rejection

↓

Implementation

↓

Business Impact

↓

Analytics

↓

Executive Reports

---

# Project Statistics

- 7 Major Workspaces
- 25+ Routes
- Enterprise RBAC
- Analytics Platform
- Report Studio
- Admin Control Center
- Modern Design System
- Responsive UI
- Production Ready MVP

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
```

---

## Frontend

```bash
cd kaizen-web

npm install

npm run dev
```

---

## Backend

```bash
cd kaizen-api

npm install

npm run dev
```

---

## Environment Variables

Frontend

```
NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

Backend

```
DATABASE_URL=

CLERK_SECRET_KEY=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

---

# Screenshots

(Add screenshots here after deployment)

---

# Future Enhancements

- AI-powered Kaizen recommendations
- Predictive analytics
- Mobile application
- Multi-branch support
- SAP / ERP integration
- Email notifications
- Advanced business intelligence
- AI-generated executive summaries

---

# Author

**Chinmay R**

Information Science & Engineering

MS Ramaiah Institute of Technology

Built as an enterprise software engineering project for Muliya Gold & Diamonds.