export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

/** GET /departments/:id/users — powers the Implementation "assign owner" picker (Milestone 8). */
export interface DepartmentUser {
  id: string;
  displayName: string;
  role: string;
  jobTitle: string | null;
}
