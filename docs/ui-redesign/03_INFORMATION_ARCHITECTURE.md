# Muliya Kaizan V2
## Information Architecture

Version: 2.0

Status: Draft

---

# Purpose

This document defines the logical structure of the application.

It determines:

• What pages exist.

• Which module each page belongs to.

• Which users access each module.

• What information belongs on each page.

• What information should never appear together.

This document serves as the blueprint for the application's navigation, page hierarchy and user experience.

---

# Design Philosophy

The application should be organized around business workflows rather than technical features.

Every page must answer one primary question.

If a page attempts to answer multiple unrelated questions, it should be divided into separate pages.

Information should progressively reveal itself as users move deeper into workflows.

Users should never feel overwhelmed.

---

# Primary Modules

The application is divided into nine major modules.

1. Dashboard

2. Kaizens

3. Reviews

4. Implementation

5. Analytics

6. Reports

7. Administration

8. Knowledge Base

9. Personal

---

==================================================
MODULE 1
Dashboard
==================================================

Purpose

Provide users with everything requiring attention today.

NOT everything happening in the company.

Dashboard answers:

"What should I do next?"

---

Contains

Greeting

Quick Actions

Pending Tasks

Recent Activity

Notifications

Today's Summary

---

Does NOT contain

Large charts

Reports

Configuration

Long tables

Department management

Historical analytics

Leaderboards

Business metrics (unless role requires)

---

Role Specific

Employee

Reviewer

Department Manager

CMD

Super Admin

Each role receives its own dashboard.

---

==================================================
MODULE 2
Kaizens
==================================================

Purpose

Everything related to creating and tracking Kaizens.

Dashboard should never contain Kaizen management.

---

Pages

My Kaizens

New Kaizen

Drafts

Submitted

Archived

Kaizen Details

Knowledge Library

---

Employee Flow

Dashboard

↓

My Kaizens

↓

Kaizen Details

↓

History

---

==================================================
MODULE 3
Reviews
==================================================

Purpose

Everything related to reviewing Kaizens.

Only reviewers and higher.

---

Pages

Review Queue

Review Workspace

Review History

Pending Reviews

Completed Reviews

Review Analytics

---

Review Workspace contains

Idea

Attachments

Comments

Score

Decision

Timeline

Print

Export

---

==================================================
MODULE 4
Implementation
==================================================

Purpose

Track approved Kaizens.

Implementation begins only after approval.

---

Pages

Assigned

Active

Completed

Timeline

Evidence

Impact

---

Does NOT contain

Review controls

Analytics

Administration

---

==================================================
MODULE 5
Analytics
==================================================

Purpose

Understand business performance.

Analytics should answer:

"What is happening?"

NOT

"What should I do?"

---

Pages

Executive Overview

Department Performance

Participation

Savings

Review Metrics

Implementation Metrics

Monthly Trends

Yearly Trends

Category Performance

---

Contains

Charts

KPIs

Comparisons

Filters

Drilldowns

---

Does NOT contain

Forms

Buttons

Review actions

Administration

Notifications

---

==================================================
MODULE 6
Reports
==================================================

Purpose

Generate business reports.

Reports answer:

"What document do I need?"

---

Pages

Generate Report

Templates

History

Scheduled Reports

Exports

Downloads

---

Supported Formats

PDF

Excel

CSV

---

==================================================
MODULE 7
Administration
==================================================

Purpose

Configure the organization.

Administration should NEVER appear in daily operational workflows.

---

Sections

Users

Departments

Roles

Permissions

Categories

Rewards

Achievements

Notification Rules

Organization Settings

System Configuration

Audit Logs

---

Users should enter this module intentionally.

---

==================================================
MODULE 8
Knowledge Base
==================================================

Purpose

Capture organizational learning.

Implemented Kaizens become searchable knowledge.

---

Pages

Implemented Kaizens

Search

Categories

Best Practices

Saved Improvements

---

Purpose

Avoid solving the same problem twice.

---

==================================================
MODULE 9
Personal
==================================================

Purpose

Everything related to the logged in user.

---

Pages

Profile

Notifications

Achievements

Leaderboard

Preferences

Security

Activity

---

==================================================
Information Hierarchy
==================================================

Every screen follows the same hierarchy.

Level 1

Primary Task

↓

Level 2

Supporting Information

↓

Level 3

History

↓

Level 4

Analytics

↓

Level 5

Configuration

Users should move deeper only when needed.

---

==================================================
Progressive Disclosure
==================================================

Do NOT display everything immediately.

Instead

Dashboard

↓

Open Module

↓

Select Item

↓

Workspace

↓

Advanced Details

↓

History

↓

Analytics

↓

Reports

---

==================================================
Page Ownership
==================================================

Dashboard

Owns today's work.

Kaizens

Owns submissions.

Reviews

Owns decisions.

Implementation

Owns execution.

Analytics

Owns insights.

Reports

Owns exports.

Administration

Owns configuration.

Knowledge Base

Owns organizational learning.

Personal

Owns user preferences.

No page should own another module's responsibilities.

---

==================================================
Cross Module Navigation
==================================================

Dashboard

↓

Kaizens

↓

Review

↓

Implementation

↓

Analytics

↓

Reports

↓

Administration

Users should never jump randomly between unrelated workflows.

---

==================================================
Information Density
==================================================

High density

Tables

Review Queue

Reports

Analytics

Administration

---

Medium density

Kaizen Details

Implementation

Knowledge Base

---

Low density

Dashboard

Profile

Notifications

New Kaizen

---

==================================================
Design Principles
==================================================

One responsibility per page.

One primary action per screen.

Everything searchable.

Everything filterable.

Everything consistent.

Whitespace over borders.

Hierarchy over decoration.

Content before visuals.

Actions before analytics.

Workflow before aesthetics.

---

==================================================
Final Objective
==================================================

The application should feel calm.

Every page should immediately communicate:

Where am I?

What am I looking at?

What should I do next?

How do I leave?

Users should never feel lost or overwhelmed.

The architecture should scale to future modules without requiring major redesigns.
