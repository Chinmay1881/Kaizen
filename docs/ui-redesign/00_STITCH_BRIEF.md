# Muliya Kaizan V2
## Google Stitch Design Brief

Version: 2.0

Status: Final

---

# Introduction

You are redesigning an existing enterprise SaaS application called **Muliya Kaizan**.

This is NOT a greenfield project.

The application already exists.

The backend is production-ready.

The frontend is functionally complete.

Every business workflow has already been implemented.

Your objective is NOT to invent new functionality.

Your objective is to redesign the user experience while preserving every implemented capability.

---

# Project Context

Muliya Kaizan is an enterprise Continuous Improvement Management System developed for Muliya Jewellers.

The platform allows employees to submit Kaizen ideas, reviewers to evaluate them, implementation teams to execute improvements and management to monitor business impact.

The application supports:

Employee

Reviewer

Implementation Team

Department Manager

CMD

Super Administrator

Each role has different responsibilities.

The redesign must provide each role with an experience tailored to its responsibilities.

---

# Read The Following Documents

Before generating any interface, use the following documents as the product specification.

01_PRODUCT_VISION.md

02_USER_PERSONAS.md

03_INFORMATION_ARCHITECTURE.md

04_NAVIGATION.md

05_PAGE_REQUIREMENTS.md

06_LAYOUT_PATTERNS.md

07_COMPONENT_LIBRARY.md

08_DESIGN_GUIDELINES.md

09_ROLE_EXPERIENCE_AND_PERMISSIONS.md

10_SCREEN_INVENTORY.md

These documents together define the application.

Do not contradict them.

---

# Primary Goal

Create an enterprise-grade experience that dramatically improves usability while preserving all implemented functionality.

The redesign should reduce cognitive load without reducing capability.

---

# Existing Problems

The current interface has become increasingly cluttered as features were added.

Problems include:

Too much information displayed simultaneously.

Multiple unrelated responsibilities on the same page.

Large dashboards containing analytics, workflows and configuration together.

Poor information hierarchy.

Too many visible cards.

Too many competing actions.

Large cognitive load.

Insufficient whitespace.

Repeated information across pages.

Inconsistent layouts.

These problems should be solved through better information architecture rather than by removing functionality.

---

# What Must NOT Change

Do NOT redesign the backend.

Do NOT invent new workflows.

Do NOT remove features.

Do NOT remove permissions.

Do NOT simplify business logic.

Do NOT merge unrelated workflows.

Do NOT replace existing review processes.

Do NOT replace implementation processes.

Do NOT redesign authentication.

Do NOT redesign database relationships.

Do NOT redesign APIs.

---

# What SHOULD Change

Navigation.

Information hierarchy.

Spacing.

Layout.

Page organization.

Progressive disclosure.

Visual consistency.

Component consistency.

Role-specific dashboards.

Workflow clarity.

Accessibility.

Responsiveness.

Overall visual polish.

---

# Design Philosophy

The redesign should feel calm.

Enterprise software should reduce stress.

Every page should answer exactly one question.

Every page should have one primary responsibility.

Information should progressively reveal itself.

Whitespace is preferred over visual clutter.

Consistency is preferred over novelty.

Workflow is more important than decoration.

---

# Design References

The application should feel inspired by:

Stripe Dashboard

Linear

Notion

GitHub

Slack

Vercel

Clerk Dashboard

Figma

Atlassian

The goal is not to copy these products.

Instead adopt their principles:

Minimal interfaces.

Excellent hierarchy.

Professional typography.

Excellent spacing.

Progressive disclosure.

Fast workflows.

Predictable navigation.

Focused pages.

---

# Visual Direction

Modern enterprise SaaS.

Dark-first design.

Professional.

Minimal.

Elegant.

Readable.

Consistent.

High quality.

Sophisticated.

Trustworthy.

Premium.

---

# Dashboard Philosophy

Dashboards should answer:

"What requires my attention today?"

NOT

"What happened this year?"

Dashboards should contain:

Greeting.

Quick Actions.

Pending Work.

Recent Activity.

Notifications.

Nothing else unless required by role.

---

# Analytics Philosophy

Analytics pages answer:

"What is happening?"

Analytics pages should contain:

KPIs.

Charts.

Comparisons.

Filters.

Drilldowns.

Exports.

Analytics pages should NOT contain workflow actions.

---

# Administration Philosophy

Administration is a management console.

Search-first.

Table-first.

Bulk actions.

Configuration.

No operational workflows.

---

# Review Philosophy

Reviewers should spend almost all of their time inside the Review Workspace.

The interface should minimize navigation.

Everything required for reviewing should exist in one focused workspace.

---

# Knowledge Base

Implemented Kaizens become searchable organizational knowledge.

Employees should learn from previous improvements before creating new Kaizens.

Knowledge Base should feel like an internal company wiki.

---

# Navigation Philosophy

Different roles should experience different applications.

Employees should not see Administration.

Executives should not begin in operational workflows.

Super Administrators should begin in system management.

Reviewers should begin in Review.

Implementation teams should begin in Assigned Work.

---

# Accessibility

Keyboard accessible.

Screen-reader friendly.

Responsive.

High contrast.

Visible focus states.

Readable typography.

No color-only communication.

---

# Responsive Behaviour

Desktop.

Tablet.

Mobile.

The application should function seamlessly across all three.

---

# Deliverables

For every screen provide:

High-fidelity mockup.

Desktop version.

Tablet version.

Mobile version.

Component annotations.

Interaction notes.

Navigation flow.

Responsive behavior.

Empty states.

Loading states.

Error states.

Hover states.

---

# Screen Generation Order

Generate screens in the following order.

Phase 1

Employee Dashboard

My Kaizens

New Kaizen Wizard

Kaizen Details

---

Phase 2

Review Dashboard

Review Queue

Review Workspace

Review History

---

Phase 3

Implementation Dashboard

Implementation Workspace

Implementation Details

---

Phase 4

Executive Dashboard

Analytics

Reports

Knowledge Base

---

Phase 5

Administration

Users

Departments

Categories

Permissions

Settings

---

# Final Success Criteria

The redesign is successful if:

Employees require almost no training.

Reviewers can process Kaizens faster.

Managers understand pending work immediately.

Executives understand business health within one minute.

Every implemented feature remains available.

The application feels significantly calmer than Version 1.

Users feel like the application was designed specifically for their role.

The redesign should resemble a modern enterprise SaaS platform rather than a traditional ERP system.

The objective is not to create beautiful screens.

The objective is to create software employees genuinely enjoy using every day.