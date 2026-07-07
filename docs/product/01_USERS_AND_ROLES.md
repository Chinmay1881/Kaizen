# Users & Roles

Version: 1.0.0

Related Documents

- 00_PROJECT_OVERVIEW.md

---

# Purpose

This document defines every type of user that can access the Muliya Kaizan platform.

It specifies:

- User roles
- Responsibilities
- Permissions
- Restrictions
- Dashboard access
- Feature access

This document acts as the foundation for Role Based Access Control (RBAC).

Every feature implemented in the application must respect the permissions defined in this document.

---

# User Roles

The system contains five user roles.

1. Employee

2. Department Manager

3. HR

4. CMD

5. Super Admin

---

# Role Hierarchy

Super Admin

↓

CMD

↓

HR

↓

Department Manager

↓

Employee

Higher roles inherit permissions from lower roles unless explicitly restricted.

---

# Employee

## Description

Employees are the primary users of the application.

Their responsibility is to identify problems within the organization and submit Kaizen ideas.

Employees interact mainly with the submission system, dashboards and notifications.

---

## Employee Dashboard

Employee dashboard should display

- Welcome card

- Current Rank

- Current Points

- Total Ideas Submitted

- Pending Ideas

- Approved Ideas

- Rejected Ideas

- Recent Activity

- Notifications

- Achievement Badges

- Leaderboard Preview

---

## Employee Permissions

Employee CAN

Create Kaizen

Save Draft

Edit Draft

Delete Draft

Submit Idea

Upload Images

Upload Documents

Upload Videos

Track Idea Status

View Own History

View Notifications

View Leaderboard

View Profile

Update Profile

Download Own Submission

Search Knowledge Base

View Implemented Kaizens

---

Employee CANNOT

Review Ideas

Approve Ideas

Reject Ideas

Assign Rewards

Manage Users

Manage Departments

Modify Scores

View Confidential Analytics

Delete Other Users

Access Admin Dashboard

---

# Department Manager

## Description

Department Managers review Kaizens submitted by employees belonging to their department.

They act as the first level reviewer.

---

## Department Dashboard

Dashboard should display

Department Statistics

Pending Reviews

Approved Reviews

Department Leaderboard

Implementation Progress

Recent Submissions

Review Queue

Department Analytics

---

## Department Manager Permissions

CAN

Review Department Ideas

Read Employee Ideas

Comment

Assign Priority

Request Changes

Approve

Reject

View Department Analytics

Track Implementation

Search Department Ideas

Download Reports

---

CANNOT

Manage Users

Manage Roles

Delete Employees

Modify Global Settings

Modify Rewards

View Company Financial Analytics

---

# HR

## Description

HR oversees employee participation and reward management.

HR focuses on engagement rather than technical implementation.

---

## HR Dashboard

Employee Participation

Department Participation

Pending Reviews

Rewards

Achievements

Leaderboard

Announcements

Analytics

---

## HR Permissions

CAN

Review Ideas

Approve Rewards

Manage Achievements

Create Announcements

View Employee Analytics

View Department Analytics

Generate Reports

View Leaderboard

Export Reports

---

CANNOT

Delete Ideas

Modify System Configuration

Manage Database

Modify Global Permissions

---

# CMD

## Description

CMD is the highest business authority.

CMD has complete visibility across the organization.

CMD primarily uses the platform for strategic decisions.

---

## CMD Dashboard

Company Overview

Innovation Metrics

Top Departments

Business Impact

Savings Generated

Employee Participation

Top Contributors

Recent Implementations

Executive Analytics

---

## CMD Permissions

CAN

View Everything

Approve Everything

Reject Everything

Override Reviews

View Company Analytics

Manage Rewards

Generate Executive Reports

View Business Impact

Access Audit Logs

---

# Super Admin

## Description

Super Admin manages the platform itself.

This role is responsible for configuration and maintenance.

---

## Super Admin Dashboard

System Health

Users

Departments

Roles

Categories

Audit Logs

Announcements

Platform Settings

Storage

Database Statistics

---

## Super Admin Permissions

CAN

Create Users

Delete Users

Modify Users

Reset Passwords

Manage Roles

Manage Departments

Manage Categories

Manage Announcements

Manage Notifications

Manage Reward System

Manage Scoring Parameters

Manage Platform Settings

View Audit Logs

Export Data

Import Data

Configure System

---

# Common Permissions

Every authenticated user can

Login

Logout

View Own Profile

Change Password

Receive Notifications

View Help

Update Profile Picture

Enable Dark Mode

Search Implemented Kaizens

---

# Role Permission Matrix

| Feature | Employee | Dept Manager | HR | CMD | Super Admin |
|----------|----------|--------------|----|-----|-------------|
| Submit Kaizen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save Draft | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload Files | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review Ideas | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve Ideas | ❌ | ✅ | ✅ | ✅ | ✅ |
| Reject Ideas | ❌ | ✅ | ✅ | ✅ | ✅ |
| View Company Analytics | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Roles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Platform Settings | ❌ | ❌ | ❌ | ❌ | ✅ |

---

# Future Roles

Future versions may introduce

Vendor

Branch Manager

Regional Manager

Operations Head

CEO

External Auditor

---

# Design Notes

Every role should have

- Different dashboard

- Different sidebar

- Different permissions

- Different analytics

- Different landing page

No user should see UI components that they do not have permission to access.

Permissions should be enforced both

Frontend

AND

Backend.

Frontend restrictions improve UX.

Backend restrictions enforce security.

Backend permissions always take priority.