import type { UserRole } from "../constants/roles.js";

export interface AuthContext {
  clerkId: string;
  sessionId: string | null;
}

export interface RequestUser {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      user?: RequestUser;
    }
  }
}

export {};
