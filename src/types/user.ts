export type UserRole = "super_admin" | "coach" | "creator";

export interface FullUserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  coachId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
