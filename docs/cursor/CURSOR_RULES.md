# Cursor Project Rules

Version: 1.0.0

Project: Muliya Kaizan

These rules apply to every piece of code generated for this project.

If any generated code violates these rules, regenerate it.

---

# Project Goal

Build an enterprise-grade SaaS web application.

The application should resemble software developed by a professional engineering team.

Avoid writing code that looks like a college project.

Always prioritize

Scalability

Maintainability

Performance

Accessibility

Developer Experience

Reusability

---

# Tech Stack

Frontend

Next.js 15

React 19

TypeScript

Tailwind CSS

shadcn/ui

Framer Motion

TanStack Query

React Hook Form

Zod

Backend

Node.js

Express

Prisma

PostgreSQL

Authentication

Clerk

Storage

Cloudinary

---

# General Rules

Never generate placeholder code.

Never leave TODO comments.

Never generate incomplete components.

Always generate production-ready code.

Always write TypeScript.

Never use JavaScript.

---

# TypeScript

Strict mode only.

Never use

any

Avoid

unknown

Use interfaces where appropriate.

Prefer type inference when possible.

Create reusable types.

Export shared types.

---

# React

Prefer Server Components.

Use Client Components only when necessary.

Keep components focused.

Avoid massive page files.

Extract reusable UI.

Never duplicate JSX.

---

# Component Rules

Maximum

250 lines per component.

Extract reusable components.

One responsibility per component.

Avoid deeply nested JSX.

Keep props typed.

Use composition instead of inheritance.

---

# Folder Structure

Every feature must follow

features/

components/

hooks/

services/

types/

schemas/

utils/

constants/

Do not invent new folder structures.

---

# UI

Use only

shadcn/ui

Do not build custom buttons.

Do not build custom dialogs.

Reuse existing components whenever possible.

---

# Styling

Tailwind CSS only.

No inline CSS.

No CSS modules.

No styled-components.

Use utility classes.

Keep spacing consistent.

---

# Colors

Use design tokens.

Never hardcode colors.

Use semantic colors.

Follow Design System.

---

# Icons

Use Lucide React.

Never mix icon libraries.

Maintain consistent icon sizing.

---

# Forms

Use

React Hook Form

+

Zod

Every form must validate.

Show inline errors.

Prevent duplicate submissions.

Disable submit while loading.

---

# API Calls

Never call fetch directly inside components.

Use service layer.

All API communication goes through services.

Handle loading.

Handle errors.

Handle retries where appropriate.

---

# State Management

React State

for local state.

TanStack Query

for server state.

Avoid global state.

Use Context only when necessary.

---

# Error Handling

Every async operation must

Handle loading.

Handle errors.

Display meaningful messages.

Provide retry when appropriate.

---

# Empty States

Every page must include

Empty State

Loading State

Error State

Success State

Never display blank screens.

---

# Tables

Every table must support

Pagination

Sorting

Filtering

Search

Responsive Layout

Loading

Empty State

---

# Charts

Use Recharts.

Responsive.

Animated.

Lazy Loaded.

---

# File Uploads

Validate file size.

Validate file type.

Display upload progress.

Preview before upload.

Support cancellation.

---

# Authentication

Use Clerk.

Never implement custom authentication.

Protect every private route.

Protect every API.

---

# Authorization

Follow RBAC.

Never trust frontend permissions.

Validate permissions on backend.

Hide unauthorized UI.

---

# Accessibility

Keyboard Navigation

Screen Reader Support

ARIA Labels

Visible Focus

Minimum Touch Size

44px

---

# Performance

Lazy load heavy components.

Memoize expensive calculations.

Optimize images.

Avoid unnecessary renders.

Virtualize long lists.

---

# Animations

Use Framer Motion.

Animations should

Communicate state.

Improve UX.

Never distract users.

Maximum duration

300ms.

---

# Naming Conventions

Components

PascalCase

Hooks

camelCase

Services

camelCase

Types

PascalCase

Files

kebab-case

Folders

kebab-case

Constants

UPPER_SNAKE_CASE

---

# Code Style

Readable code.

Self-documenting functions.

Meaningful variable names.

Avoid nested conditionals.

Extract repeated logic.

No duplicated business logic.

---

# Comments

Write comments only when necessary.

Avoid obvious comments.

Explain why, not what.

---

# Logging

Do not leave console.log in production code.

Use structured logging where appropriate.

---

# Database

Use Prisma.

Never expose database logic to frontend.

Always validate input.

Always use transactions where appropriate.

---

# Security

Never trust client input.

Validate every request.

Sanitize uploaded files.

Protect secrets.

Never expose environment variables.

Use HTTPS.

---

# Responsiveness

Desktop First.

Support Tablet.

Support Mobile.

No horizontal scrolling.

---

# Dark Mode

Every page must support dark mode.

Do not hardcode light colors.

Use semantic theme variables.

---

# Testing

Generate code that is testable.

Separate business logic.

Avoid tight coupling.

---

# Documentation

Generate readable code.

Use meaningful file names.

Follow architecture document.

---

# Before Completing Any Feature

Ensure

TypeScript passes.

No lint errors.

Responsive.

Dark mode works.

Loading state exists.

Empty state exists.

Error state exists.

RBAC respected.

Accessibility respected.

Performance acceptable.

---

# Never Do

Never use any.

Never duplicate components.

Never duplicate APIs.

Never mix styling approaches.

Never hardcode business logic inside UI.

Never create huge components.

Never bypass validation.

Never bypass RBAC.

Never violate the documented architecture.

---

# Quality Standard

Every feature should be written as if it will be deployed to production and maintained by a professional software engineering team for years.

Do not optimize for speed of generation.

Optimize for code quality, maintainability and scalability.