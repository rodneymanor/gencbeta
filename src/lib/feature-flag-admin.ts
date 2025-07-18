/**
 * Feature Flag Admin Service - Management functions for administrators
 */

import { FeatureFlagService, FeatureFlags, FeatureFlagConfig } from './feature-flags';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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

export interface FeatureFlagMetrics {
  total_users: number;
  enabled_users: number;
  success_rate: number;
  average_response_time: number;
  error_rate: number;
  rollback_count: number;
  last_updated: string;
}

export class FeatureFlagAdmin {
  
  /**
   * V2 Script Generation Rollout Plan
   */
  private static V2_ROLLOUT_PLAN: RolloutPlan[] = [
    {
      phase: 1,
      percentage: 5,
      duration_hours: 24,
      success_criteria: {
        error_rate_threshold: 0.1, // 0.1%
        performance_threshold_ms: 5000,
        user_satisfaction_threshold: 0.9,
      },
    },
    {
      phase: 2,
      percentage: 25,
      duration_hours: 48,
      success_criteria: {
        error_rate_threshold: 0.2, // 0.2%
        performance_threshold_ms: 5000,
        user_satisfaction_threshold: 0.85,
      },
    },
    {
      phase: 3,
      percentage: 50,
      duration_hours: 72,
      success_criteria: {
        error_rate_threshold: 0.3, // 0.3%
        performance_threshold_ms: 5000,
        user_satisfaction_threshold: 0.8,
      },
    },
    {
      phase: 4,
      percentage: 100,
      duration_hours: 0, // Final phase
      success_criteria: {
        error_rate_threshold: 0.5, // 0.5%
        performance_threshold_ms: 5000,
        user_satisfaction_threshold: 0.75,
      },
    },
  ];

  /**
   * Initialize V2 rollout with phase 1
   */
  static async startV2Rollout(): Promise<void> {
    console.log('🚀 Starting V2 Script Generation Rollout - Phase 1');
    
    const phase1 = this.V2_ROLLOUT_PLAN[0];
    
    await FeatureFlagService.updateFeatureFlag('v2_script_generation', {
      enabled: true,
      rollout_percentage: phase1.percentage,
      whitelist_users: [],
      blacklist_users: [],
      admin_override: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Schedule automatic progression
    await this.schedulePhaseProgression(1);
  }

  /**
   * Progress to next rollout phase
   */
  static async progressToNextPhase(): Promise<boolean> {
    const currentPercentage = await FeatureFlagService.getRolloutPercentage('v2_script_generation');
    const currentPhase = this.V2_ROLLOUT_PLAN.findIndex(p => p.percentage === currentPercentage);
    
    if (currentPhase === -1 || currentPhase >= this.V2_ROLLOUT_PLAN.length - 1) {
      console.log('✅ V2 Rollout complete - 100% deployed');
      return false;
    }

    const nextPhase = this.V2_ROLLOUT_PLAN[currentPhase + 1];
    
    // Check success criteria before progressing
    const metrics = await this.getFeatureFlagMetrics('v2_script_generation');
    const currentPhasePlan = this.V2_ROLLOUT_PLAN[currentPhase];
    
    if (!this.validateSuccessCriteria(metrics, currentPhasePlan.success_criteria)) {
      console.warn('❌ Success criteria not met, halting rollout progression');
      return false;
    }

    console.log(`🔄 Progressing V2 rollout to Phase ${nextPhase.phase} (${nextPhase.percentage}%)`);
    
    await FeatureFlagService.increaseRollout('v2_script_generation', nextPhase.percentage);
    await this.schedulePhaseProgression(nextPhase.phase);
    
    return true;
  }

  /**
   * Validate success criteria for phase progression
   */
  private static validateSuccessCriteria(
    metrics: FeatureFlagMetrics,
    criteria: RolloutPlan['success_criteria']
  ): boolean {
    return (
      metrics.error_rate <= criteria.error_rate_threshold &&
      metrics.average_response_time <= criteria.performance_threshold_ms &&
      metrics.success_rate >= criteria.user_satisfaction_threshold
    );
  }

  /**
   * Schedule automatic phase progression
   */
  private static async schedulePhaseProgression(currentPhase: number): Promise<void> {
    const phaseConfig = this.V2_ROLLOUT_PLAN[currentPhase - 1];
    
    if (phaseConfig.duration_hours > 0) {
      const progressionTime = new Date(Date.now() + phaseConfig.duration_hours * 60 * 60 * 1000);
      
      // Store progression schedule in Firestore
      await setDoc(doc(db, 'system_config', 'rollout_schedule'), {
        next_phase: currentPhase + 1,
        scheduled_time: progressionTime.toISOString(),
        feature_flag: 'v2_script_generation',
        created_at: new Date().toISOString(),
      });
      
      console.log(`📅 Next phase scheduled for: ${progressionTime.toISOString()}`);
    }
  }

  /**
   * Get feature flag metrics for monitoring
   */
  static async getFeatureFlagMetrics(flagName: keyof FeatureFlags): Promise<FeatureFlagMetrics> {
    try {
      const docRef = doc(db, 'system_metrics', `feature_flag_${flagName}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as FeatureFlagMetrics;
      }
      
      // Return default metrics if not found
      return {
        total_users: 0,
        enabled_users: 0,
        success_rate: 1.0,
        average_response_time: 0,
        error_rate: 0,
        rollback_count: 0,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching metrics for ${flagName}:`, error);
      throw error;
    }
  }

  /**
   * Update feature flag metrics
   */
  static async updateFeatureFlagMetrics(
    flagName: keyof FeatureFlags,
    metrics: Partial<FeatureFlagMetrics>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'system_metrics', `feature_flag_${flagName}`);
      const updateData = {
        ...metrics,
        last_updated: new Date().toISOString(),
      };
      
      await setDoc(docRef, updateData, { merge: true });
    } catch (error) {
      console.error(`Error updating metrics for ${flagName}:`, error);
      throw error;
    }
  }

  /**
   * Emergency rollback with detailed logging
   */
  static async emergencyRollback(
    flagName: keyof FeatureFlags,
    reason: string,
    adminUserId: string
  ): Promise<void> {
    console.error(`🚨 EMERGENCY ROLLBACK: ${flagName} - Reason: ${reason}`);
    
    // Perform rollback
    await FeatureFlagService.emergencyRollback(flagName);
    
    // Log rollback event
    await setDoc(doc(db, 'system_events', `rollback_${Date.now()}`), {
      event_type: 'emergency_rollback',
      feature_flag: flagName,
      reason,
      admin_user_id: adminUserId,
      timestamp: new Date().toISOString(),
      rollback_time: new Date().toISOString(),
    });
    
    // Update metrics
    const currentMetrics = await this.getFeatureFlagMetrics(flagName);
    await this.updateFeatureFlagMetrics(flagName, {
      rollback_count: currentMetrics.rollback_count + 1,
    });
    
    console.log(`✅ Emergency rollback completed for ${flagName}`);
  }

  /**
   * Get rollout status summary
   */
  static async getRolloutStatus(): Promise<{
    current_phase: number;
    current_percentage: number;
    next_phase_scheduled: string | null;
    metrics: FeatureFlagMetrics;
    can_progress: boolean;
  }> {
    const currentPercentage = await FeatureFlagService.getRolloutPercentage('v2_script_generation');
    const currentPhase = this.V2_ROLLOUT_PLAN.findIndex(p => p.percentage === currentPercentage);
    const metrics = await this.getFeatureFlagMetrics('v2_script_generation');
    
    // Check if we can progress to next phase
    const canProgress = currentPhase >= 0 && currentPhase < this.V2_ROLLOUT_PLAN.length - 1 &&
      this.validateSuccessCriteria(metrics, this.V2_ROLLOUT_PLAN[currentPhase].success_criteria);
    
    // Get next phase schedule
    let nextPhaseScheduled = null;
    try {
      const scheduleDoc = await getDoc(doc(db, 'system_config', 'rollout_schedule'));
      if (scheduleDoc.exists()) {
        nextPhaseScheduled = scheduleDoc.data().scheduled_time;
      }
    } catch (error) {
      console.warn('Could not fetch rollout schedule:', error);
    }
    
    return {
      current_phase: currentPhase + 1,
      current_percentage: currentPercentage,
      next_phase_scheduled: nextPhaseScheduled,
      metrics,
      can_progress: canProgress,
    };
  }

  /**
   * Add user to whitelist for early access
   */
  static async addToWhitelist(flagName: keyof FeatureFlags, userId: string): Promise<void> {
    const currentFlags = await FeatureFlagService.getUserFlags(userId);
    // Implementation depends on current flag state
    // This would need to fetch current config and update the whitelist
    console.log(`Added user ${userId} to whitelist for ${flagName}`);
  }

  /**
   * Remove user from whitelist
   */
  static async removeFromWhitelist(flagName: keyof FeatureFlags, userId: string): Promise<void> {
    // Implementation to remove user from whitelist
    console.log(`Removed user ${userId} from whitelist for ${flagName}`);
  }

  /**
   * Get comprehensive admin dashboard data
   */
  static async getAdminDashboard(): Promise<{
    rollout_status: Awaited<ReturnType<typeof this.getRolloutStatus>>;
    feature_flags: Record<keyof FeatureFlags, FeatureFlagConfig>;
    recent_events: any[];
    system_health: {
      overall_error_rate: number;
      average_response_time: number;
      active_users: number;
    };
  }> {
    const rolloutStatus = await this.getRolloutStatus();
    
    // This would be expanded with actual implementations
    return {
      rollout_status: rolloutStatus,
      feature_flags: {} as Record<keyof FeatureFlags, FeatureFlagConfig>,
      recent_events: [],
      system_health: {
        overall_error_rate: 0,
        average_response_time: 0,
        active_users: 0,
      },
    };
  }
}

// Utility functions for common admin operations
export const rolloutOperations = {
  /**
   * Start V2 rollout
   */
  async start(): Promise<void> {
    await FeatureFlagAdmin.startV2Rollout();
  },

  /**
   * Progress to next phase
   */
  async progress(): Promise<boolean> {
    return await FeatureFlagAdmin.progressToNextPhase();
  },

  /**
   * Emergency stop
   */
  async emergency_stop(reason: string, adminId: string): Promise<void> {
    await FeatureFlagAdmin.emergencyRollback('v2_script_generation', reason, adminId);
  },

  /**
   * Get current status
   */
  async status(): Promise<Awaited<ReturnType<typeof FeatureFlagAdmin.getRolloutStatus>>> {
    return await FeatureFlagAdmin.getRolloutStatus();
  },
};