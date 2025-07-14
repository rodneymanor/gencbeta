import { ApiKeyAuthService } from "./api-key-auth";
/**
 * Authentication Service Layer
 * Centralized authentication, authorization, and RBAC
 */

// API Key Authentication Service
export {
  ApiKeyAuthService,
  authenticateWithApiKey,
  authenticateApiKey,
  type ApiKeyDocument,
  type AuthenticatedUser,
  type RateLimitResult,
  type ApiKeyValidationResult,
} from "./api-key-auth";

// Firebase Authentication Service
export {
  validateFirebaseToken,
  getUserProfile,
  setCustomClaims,
  getCustomClaims,
  authenticateFirebaseRequest,
  getUserIdFromToken,
  hasRole,
  hasAnyRole,
  getUserRole,
  createSessionToken,
  verifySessionToken,
  revokeUserTokens,
  deleteUser,
  updateUserProfile,
  type FirebaseUser,
  type AuthResult,
  type AuthError,
} from "./firebase-auth";

// RBAC Service
export { RBACService, type RBACContext, type CollectionAccessResult, type VideoAccessResult } from "./rbac";

// Re-export common types
export type { AccountLevel } from "@/lib/auth-cache";

// Unified Auth Service
export const AuthService = {
  authenticateRequest: ApiKeyAuthService.authenticateRequest,
  validateApiKey: ApiKeyAuthService.validateApiKey,
  extractApiKey: ApiKeyAuthService.extractApiKey,
};
