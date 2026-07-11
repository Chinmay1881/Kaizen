import Fuse, { type FuseResultMatch } from "fuse.js";

import { prisma } from "../../lib/prisma.js";
import type { UserRole } from "../../constants/roles.js";
import type { GroupedSearchResults, SearchResultItem } from "./search.types.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const COMPANY_WIDE_ROLES: UserRole[] = ["HR", "CMD", "SUPER_ADMIN"];

/** Candidate fetch caps — this runs Fuse.js in-process per request rather than a DB-side fuzzy
 * index (none exists — `KnowledgeBaseEntry.searchVector` is the only full-text column in this
 * schema, and it isn't backed by a migration yet, see PROJECT_STATUS.md Technical Debt). A cap
 * this generous is a non-issue at Muliya's actual scale (dozens of employees, low hundreds of
 * Kaizens); revisit with a real DB-side search index before this corpus reaches the tens of
 * thousands of rows. */
const KAIZEN_CANDIDATE_CAP = 2000;
const USER_CANDIDATE_CAP = 1000;

interface KaizenCandidate {
  id: string;
  kaizenNumber: string;
  title: string;
  problemStatement: string;
  currentProcess: string;
  proposedSolution: string;
  submitterName: string;
  departmentName: string;
  categoryName: string;
  ownerName: string;
}

function titleMatches(matches: readonly FuseResultMatch[] | undefined): Array<[number, number]> {
  const titleMatch = matches?.find((match) => match.key === "title");
  return titleMatch ? titleMatch.indices.map(([start, end]) => [start, end] as [number, number]) : [];
}

class SearchService {
  /** GET /api/v1/search — RBAC-scoped per entity group (see Part 9): Kaizens follow the exact
   * same visibility rule as every other Kaizen list endpoint (Employee: own only, Department
   * Manager: own department, HR/CMD/Super Admin: all). Users/Departments/Categories only ever
   * link to Admin Portal pages (no other page can display them), which are Super-Admin-only, so
   * those 3 groups are scoped to Super Admin — never returning a result the viewer couldn't open. */
  async search(requester: Requester, query: string, limit = 8): Promise<GroupedSearchResults> {
    const [kaizens, users, departments, categories] = await Promise.all([
      this.searchKaizens(requester, query, limit),
      requester.role === "SUPER_ADMIN" ? this.searchUsers(query, limit) : Promise.resolve([]),
      requester.role === "SUPER_ADMIN" ? this.searchDepartments(query, limit) : Promise.resolve([]),
      requester.role === "SUPER_ADMIN" ? this.searchCategories(query, limit) : Promise.resolve([]),
    ]);

    return { kaizens, users, departments, categories };
  }

  private async searchKaizens(requester: Requester, query: string, limit: number): Promise<SearchResultItem[]> {
    const isCompanyWide = COMPANY_WIDE_ROLES.includes(requester.role);
    const isOwnScope = !isCompanyWide && requester.role !== "DEPARTMENT_MANAGER";

    const kaizens = await prisma.kaizen.findMany({
      where: {
        ...(isCompanyWide
          ? {}
          : requester.role === "DEPARTMENT_MANAGER"
            ? { departmentId: requester.departmentId ?? "" }
            : { submitterId: requester.id }),
        ...(isOwnScope ? {} : { status: { not: "DRAFT" } }),
      },
      select: {
        id: true,
        kaizenNumber: true,
        title: true,
        problemStatement: true,
        currentProcess: true,
        proposedSolution: true,
        submitter: { select: { displayName: true } },
        department: { select: { name: true } },
        category: { select: { name: true } },
        assignedOwner: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: KAIZEN_CANDIDATE_CAP,
    });

    const candidates: KaizenCandidate[] = kaizens.map((kaizen) => ({
      id: kaizen.id,
      kaizenNumber: kaizen.kaizenNumber,
      title: kaizen.title,
      problemStatement: kaizen.problemStatement ?? "",
      currentProcess: kaizen.currentProcess ?? "",
      proposedSolution: kaizen.proposedSolution ?? "",
      submitterName: kaizen.submitter.displayName,
      departmentName: kaizen.department.name,
      categoryName: kaizen.category?.name ?? "",
      ownerName: kaizen.assignedOwner?.displayName ?? "",
    }));

    const fuse = new Fuse(candidates, {
      keys: [
        { name: "title", weight: 3 },
        { name: "kaizenNumber", weight: 2 },
        { name: "submitterName", weight: 1.5 },
        { name: "problemStatement", weight: 1 },
        { name: "currentProcess", weight: 1 },
        { name: "proposedSolution", weight: 1 },
        { name: "departmentName", weight: 1 },
        { name: "categoryName", weight: 1 },
        { name: "ownerName", weight: 1 },
      ],
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      threshold: 0.35,
    });

    return fuse
      .search(query, { limit })
      .map((result) => ({
        type: "kaizen" as const,
        id: result.item.id,
        title: `${result.item.kaizenNumber} — ${result.item.title}`,
        titleMatches: titleMatches(result.matches),
        subtitle: `${result.item.departmentName} · ${result.item.submitterName}`,
        href: `/kaizen/${result.item.id}`,
      }));
  }

  private async searchUsers(query: string, limit: number): Promise<SearchResultItem[]> {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, displayName: true, email: true, department: { select: { name: true } } },
      orderBy: { displayName: "asc" },
      take: USER_CANDIDATE_CAP,
    });

    const fuse = new Fuse(users, {
      keys: [
        { name: "displayName", weight: 2 },
        { name: "email", weight: 1 },
      ],
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      threshold: 0.35,
    });

    return fuse.search(query, { limit }).map((result) => ({
      type: "user" as const,
      id: result.item.id,
      title: result.item.displayName,
      titleMatches: titleMatches(
        result.matches?.map((match) => ({ ...match, key: match.key === "displayName" ? "title" : match.key })),
      ),
      subtitle: result.item.department?.name ?? result.item.email,
      href: "/admin/users",
    }));
  }

  private async searchDepartments(query: string, limit: number): Promise<SearchResultItem[]> {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    });

    const fuse = new Fuse(departments, {
      keys: ["name", "code"],
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      threshold: 0.35,
    });

    return fuse.search(query, { limit }).map((result) => ({
      type: "department" as const,
      id: result.item.id,
      title: result.item.name,
      titleMatches: titleMatches(
        result.matches?.map((match) => ({ ...match, key: match.key === "name" ? "title" : match.key })),
      ),
      subtitle: result.item.code,
      href: "/admin/departments",
    }));
  }

  private async searchCategories(query: string, limit: number): Promise<SearchResultItem[]> {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
    });

    const fuse = new Fuse(categories, {
      keys: ["name"],
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      threshold: 0.35,
    });

    return fuse.search(query, { limit }).map((result) => ({
      type: "category" as const,
      id: result.item.id,
      title: result.item.name,
      titleMatches: titleMatches(
        result.matches?.map((match) => ({ ...match, key: match.key === "name" ? "title" : match.key })),
      ),
      subtitle: result.item.description,
      href: "/admin/categories",
    }));
  }
}

export const searchService = new SearchService();
