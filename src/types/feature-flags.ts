/**
 * TypeScript definitions for Feature Flags
 */

export interface FeatureFlags {
  v2_script_generation: boolean;
  v2_enhanced_prompts: boolean;
  v2_template_hooks: boolean;
  v2_smart_bridges: boolean;
  v2_performance_monitoring: boolean;
  voice_library: boolean;
  creator_spotlight: boolean;
}

export interface FeatureFlagConfig {
  enabled: boolean;
  rollout_percentage: number;
  whitelist_users: string[];
  blacklist_users: string[];
  admin_override: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagState {
  [key: string]: FeatureFlagConfig;
}

export interface FeatureFlagMetrics {
  total_users: number;
  enabled_users: number;
  success_rate: number;
  average_response_time: number;
  error_rate: number;
  rollback_count: number;
  last_updated: string;
}

export interface RolloutPlan {
  phase: number;
  percentage: number;
  duration_hours: number;
  success_criteria: {
    error_rate_threshold: number;
    performance_threshold_ms: number;
    user_satisfaction_threshold: number;
  };
}

export interface RolloutStatus {
  current_phase: number;
  current_percentage: number;
  next_phase_scheduled: string | null;
  metrics: FeatureFlagMetrics;
  can_progress: boolean;
}

export interface FeatureFlagEvent {
  event_type: "rollout_started" | "phase_progression" | "emergency_rollback" | "flag_updated";
  feature_flag: keyof FeatureFlags;
  admin_user_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AdminDashboardData {
  rollout_status: RolloutStatus;
  feature_flags: Record<keyof FeatureFlags, FeatureFlagConfig>;
  recent_events: FeatureFlagEvent[];
  system_health: {
    overall_error_rate: number;
    average_response_time: number;
    active_users: number;
  };
}

export type FeatureFlagName = keyof FeatureFlags;

export interface FeatureFlagHookResult {
  flags: FeatureFlags;
  isLoading: boolean;
  error: string | null;
  isEnabled: (flagName: FeatureFlagName) => boolean;
  refresh: () => Promise<void>;
}

export interface SingleFeatureFlagHookResult {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface V2ScriptGenerationHookResult extends SingleFeatureFlagHookResult {
  canUseV2: boolean;
}

// Environment variable types
export interface FeatureFlagEnvVars {
  FEATURE_V2_SCRIPT_GENERATION_ENABLED?: string;
  FEATURE_V2_SCRIPT_GENERATION_ROLLOUT_PERCENTAGE?: string;
  FEATURE_V2_ENHANCED_PROMPTS_ENABLED?: string;
  FEATURE_V2_TEMPLATE_HOOKS_ENABLED?: string;
  FEATURE_V2_SMART_BRIDGES_ENABLED?: string;
  FEATURE_V2_PERFORMANCE_MONITORING_ENABLED?: string;
  FEATURE_VOICE_LIBRARY_ENABLED?: string;
  FEATURE_CREATOR_SPOTLIGHT_ENABLED?: string;
}

// API response types
export interface FeatureFlagAPIResponse {
  success: boolean;
  flags?: FeatureFlags;
  error?: string;
  message?: string;
}

export interface RolloutAPIResponse {
  success: boolean;
  status?: RolloutStatus;
  error?: string;
  message?: string;
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Validation types
export interface FeatureFlagValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Constants
export const FEATURE_FLAG_NAMES: Record<string, FeatureFlagName> = {
  V2_SCRIPT_GENERATION: "v2_script_generation",
  V2_ENHANCED_PROMPTS: "v2_enhanced_prompts",
  V2_TEMPLATE_HOOKS: "v2_template_hooks",
  V2_SMART_BRIDGES: "v2_smart_bridges",
  V2_PERFORMANCE_MONITORING: "v2_performance_monitoring",
  VOICE_LIBRARY: "voice_library",
  CREATOR_SPOTLIGHT: "creator_spotlight",
} as const;

export const ROLLOUT_PHASES = [
  { phase: 1, percentage: 5, duration_hours: 24 },
  { phase: 2, percentage: 25, duration_hours: 48 },
  { phase: 3, percentage: 50, duration_hours: 72 },
  { phase: 4, percentage: 100, duration_hours: 0 },
] as const;

export const DEFAULT_SUCCESS_CRITERIA = {
  error_rate_threshold: 0.5,
  performance_threshold_ms: 5000,
  user_satisfaction_threshold: 0.8,
} as const;

// Utility types
export type PartialFeatureFlags = Partial<FeatureFlags>;
export type FeatureFlagUpdate = Partial<FeatureFlagConfig>;
export type MetricsUpdate = Partial<FeatureFlagMetrics>;

// Event types for feature flag changes
export type FeatureFlagChangeEvent = CustomEvent<{
  flagName: FeatureFlagName;
  oldValue: boolean;
  newValue: boolean;
  userId: string;
}>;

// Component props types
export interface FeatureFlagProviderProps {
  children: React.ReactNode;
  initialFlags?: PartialFeatureFlags;
  userId?: string;
}

export interface FeatureFlagWrapperProps {
  flagName: FeatureFlagName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export interface AdminPanelProps {
  onRolloutStart?: () => void;
  onRolloutProgress?: () => void;
  onEmergencyStop?: (reason: string) => void;
  onFlagUpdate?: (flagName: FeatureFlagName, config: FeatureFlagUpdate) => void;
}
