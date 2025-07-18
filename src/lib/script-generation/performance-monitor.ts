/**
 * Performance Monitoring for Script Generation V2
 * Tracks generation speed, quality metrics, and feature flag performance
 */

interface PerformanceMetric {
  timestamp: number;
  userId: string;
  version: "v1" | "v2";
  generationMethod?: string;

  // Performance metrics
  responseTime: number;
  wordCount: number;
  targetWordCount: number;
  wordCountAccuracy: number; // percentage accuracy to target

  // Feature flags used
  featureFlags?: Record<string, boolean>;

  // Quality indicators
  hasAllComponents: boolean;
  componentStrategies?: Record<string, string>;

  // User behavior
  regenerated?: boolean;
  userSatisfaction?: number; // 1-5 scale if we implement rating
}

interface PerformanceAnalysis {
  totalGenerations: number;
  averageResponseTime: number;
  averageWordCountAccuracy: number;

  // V1 vs V2 comparison
  v1Stats: {
    count: number;
    averageResponseTime: number;
    averageWordCountAccuracy: number;
  };
  v2Stats: {
    count: number;
    averageResponseTime: number;
    averageWordCountAccuracy: number;
    enhancedGenerations: number;
    templateUsage: number;
  };

  // Feature flag performance
  featureFlagStats: Record<
    string,
    {
      usage: number;
      averageResponseTime: number;
      averageWordCountAccuracy: number;
    }
  >;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static readonly MAX_METRICS = 1000; // Keep only last 1000 metrics

  /**
   * Record a script generation performance metric
   */
  static recordGeneration(metric: Omit<PerformanceMetric, "timestamp">): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log important performance issues
    this.checkPerformanceIssues(fullMetric);
  }

  /**
   * Calculate word count accuracy percentage
   */
  static calculateWordCountAccuracy(actual: number, target: number): number {
    if (target === 0) return 100;
    const accuracy = 100 - (Math.abs(actual - target) / target) * 100;
    return Math.max(0, Math.min(100, accuracy));
  }

  /**
   * Get performance analysis for the last N generations
   */
  static getAnalysis(lastNGenerations: number = 100): PerformanceAnalysis {
    const recentMetrics = this.metrics.slice(-lastNGenerations);

    if (recentMetrics.length === 0) {
      return this.getEmptyAnalysis();
    }

    const v1Metrics = recentMetrics.filter((m) => m.version === "v1");
    const v2Metrics = recentMetrics.filter((m) => m.version === "v2");

    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const totalWordCountAccuracy = recentMetrics.reduce((sum, m) => sum + m.wordCountAccuracy, 0);

    // Analyze feature flag usage
    const featureFlagStats: Record<string, any> = {};
    v2Metrics.forEach((metric) => {
      if (metric.featureFlags) {
        Object.entries(metric.featureFlags).forEach(([flag, enabled]) => {
          if (enabled) {
            if (!featureFlagStats[flag]) {
              featureFlagStats[flag] = {
                usage: 0,
                totalResponseTime: 0,
                totalWordCountAccuracy: 0,
              };
            }
            featureFlagStats[flag].usage++;
            featureFlagStats[flag].totalResponseTime += metric.responseTime;
            featureFlagStats[flag].totalWordCountAccuracy += metric.wordCountAccuracy;
          }
        });
      }
    });

    // Calculate averages for feature flags
    Object.keys(featureFlagStats).forEach((flag) => {
      const stats = featureFlagStats[flag];
      stats.averageResponseTime = stats.totalResponseTime / stats.usage;
      stats.averageWordCountAccuracy = stats.totalWordCountAccuracy / stats.usage;
      delete stats.totalResponseTime;
      delete stats.totalWordCountAccuracy;
    });

    return {
      totalGenerations: recentMetrics.length,
      averageResponseTime: totalResponseTime / recentMetrics.length,
      averageWordCountAccuracy: totalWordCountAccuracy / recentMetrics.length,

      v1Stats: {
        count: v1Metrics.length,
        averageResponseTime:
          v1Metrics.length > 0 ? v1Metrics.reduce((sum, m) => sum + m.responseTime, 0) / v1Metrics.length : 0,
        averageWordCountAccuracy:
          v1Metrics.length > 0 ? v1Metrics.reduce((sum, m) => sum + m.wordCountAccuracy, 0) / v1Metrics.length : 0,
      },

      v2Stats: {
        count: v2Metrics.length,
        averageResponseTime:
          v2Metrics.length > 0 ? v2Metrics.reduce((sum, m) => sum + m.responseTime, 0) / v2Metrics.length : 0,
        averageWordCountAccuracy:
          v2Metrics.length > 0 ? v2Metrics.reduce((sum, m) => sum + m.wordCountAccuracy, 0) / v2Metrics.length : 0,
        enhancedGenerations: v2Metrics.filter(
          (m) =>
            m.generationMethod === "modular_enhanced" ||
            (m.componentStrategies &&
              Object.values(m.componentStrategies).some(
                (s) => s.includes("enhanced") || s.includes("template") || s.includes("smart"),
              )),
        ).length,
        templateUsage: v2Metrics.filter(
          (m) => m.componentStrategies && Object.values(m.componentStrategies).some((s) => s.includes("template")),
        ).length,
      },

      featureFlagStats,
    };
  }

  /**
   * Get metrics for a specific user
   */
  static getUserMetrics(userId: string, limit: number = 50): PerformanceMetric[] {
    return this.metrics.filter((m) => m.userId === userId).slice(-limit);
  }

  /**
   * Check for performance issues and log warnings
   */
  private static checkPerformanceIssues(metric: PerformanceMetric): void {
    // Slow response time warning
    if (metric.responseTime > 5000) {
      // 5 seconds
      console.warn(`Slow script generation detected: ${metric.responseTime}ms for ${metric.version}`);
    }

    // Poor word count accuracy warning
    if (metric.wordCountAccuracy < 70) {
      console.warn(`Poor word count accuracy: ${metric.wordCountAccuracy.toFixed(1)}% for ${metric.version}`);
    }

    // Missing components warning
    if (!metric.hasAllComponents) {
      console.warn(`Incomplete script generation detected for ${metric.version}`);
    }
  }

  /**
   * Export metrics for analysis (useful for admin dashboard)
   */
  static exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics (useful for testing)
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get empty analysis structure
   */
  private static getEmptyAnalysis(): PerformanceAnalysis {
    return {
      totalGenerations: 0,
      averageResponseTime: 0,
      averageWordCountAccuracy: 0,
      v1Stats: {
        count: 0,
        averageResponseTime: 0,
        averageWordCountAccuracy: 0,
      },
      v2Stats: {
        count: 0,
        averageResponseTime: 0,
        averageWordCountAccuracy: 0,
        enhancedGenerations: 0,
        templateUsage: 0,
      },
      featureFlagStats: {},
    };
  }

  /**
   * Get performance comparison summary
   */
  static getComparisonSummary(lastNGenerations: number = 100): {
    v2Improvements: {
      speedImprovement: number; // percentage
      accuracyImprovement: number; // percentage
      enhancedUsage: number; // percentage of V2 using enhanced features
    };
    issues: string[];
  } {
    const analysis = this.getAnalysis(lastNGenerations);
    const issues: string[] = [];

    // Calculate improvements
    let speedImprovement = 0;
    let accuracyImprovement = 0;

    if (analysis.v1Stats.count > 0 && analysis.v2Stats.count > 0) {
      // Negative improvement means V2 is faster (lower response time is better)
      speedImprovement =
        ((analysis.v1Stats.averageResponseTime - analysis.v2Stats.averageResponseTime) /
          analysis.v1Stats.averageResponseTime) *
        100;

      accuracyImprovement = analysis.v2Stats.averageWordCountAccuracy - analysis.v1Stats.averageWordCountAccuracy;
    }

    // Check for issues
    if (speedImprovement < 0) {
      issues.push(`V2 is ${Math.abs(speedImprovement).toFixed(1)}% slower than V1`);
    }

    if (accuracyImprovement < 0) {
      issues.push(`V2 word count accuracy is ${Math.abs(accuracyImprovement).toFixed(1)}% worse than V1`);
    }

    if (analysis.v2Stats.count > 0 && analysis.v2Stats.enhancedGenerations / analysis.v2Stats.count < 0.1) {
      issues.push("Low enhanced feature usage in V2");
    }

    return {
      v2Improvements: {
        speedImprovement,
        accuracyImprovement,
        enhancedUsage:
          analysis.v2Stats.count > 0 ? (analysis.v2Stats.enhancedGenerations / analysis.v2Stats.count) * 100 : 0,
      },
      issues,
    };
  }
}
