/**
 * Performance Benchmarking Tool for V1 vs V2 Script Generation
 * Tests response times, success rates, and quality metrics
 */

import { FeatureFlagService } from './feature-flags';

export interface BenchmarkResult {
  version: 'v1' | 'v2';
  success: boolean;
  responseTime: number;
  wordCount: number;
  hasAllComponents: boolean;
  error?: string;
  metadata?: any;
}

export interface BenchmarkSummary {
  v1: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    average_response_time: number;
    median_response_time: number;
    p95_response_time: number;
    average_word_count: number;
    component_completion_rate: number;
  };
  v2: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    average_response_time: number;
    median_response_time: number;
    p95_response_time: number;
    average_word_count: number;
    component_completion_rate: number;
  };
  comparison: {
    v2_performance_improvement: number;
    v2_success_rate_improvement: number;
    v2_quality_improvement: number;
    recommendation: 'proceed' | 'investigate' | 'halt';
  };
}

export class PerformanceBenchmark {
  private static TEST_CASES = [
    {
      idea: "How to improve productivity with AI tools",
      length: "60" as const,
      type: "speed" as const,
    },
    {
      idea: "The psychology behind viral content creation",
      length: "90" as const,
      type: "viral" as const,
    },
    {
      idea: "Data-driven decision making in business",
      length: "60" as const,
      type: "educational" as const,
    },
    {
      idea: "Building habits that stick long-term",
      length: "30" as const,
      type: "speed" as const,
    },
    {
      idea: "The future of remote work collaboration",
      length: "90" as const,
      type: "viral" as const,
    },
  ];

  /**
   * Run comprehensive benchmark test
   */
  static async runBenchmark(
    iterations: number = 5,
    apiKey: string
  ): Promise<BenchmarkSummary> {
    console.log(`🚀 Starting performance benchmark with ${iterations} iterations`);
    
    const v1Results: BenchmarkResult[] = [];
    const v2Results: BenchmarkResult[] = [];
    
    // Test each case multiple times
    for (let i = 0; i < iterations; i++) {
      console.log(`📊 Running iteration ${i + 1}/${iterations}`);
      
      for (const testCase of this.TEST_CASES) {
        // Test V1
        const v1Result = await this.testV1(testCase, apiKey);
        v1Results.push(v1Result);
        
        // Test V2
        const v2Result = await this.testV2(testCase, apiKey);
        v2Results.push(v2Result);
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Calculate summaries
    const v1Summary = this.calculateSummary(v1Results);
    const v2Summary = this.calculateSummary(v2Results);
    const comparison = this.calculateComparison(v1Summary, v2Summary);
    
    return {
      v1: v1Summary,
      v2: v2Summary,
      comparison,
    };
  }

  /**
   * Test V1 generation
   */
  private static async testV1(
    testCase: typeof this.TEST_CASES[0],
    apiKey: string
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/script/speed-write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(testCase),
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (!response.ok) {
        return {
          version: 'v1',
          success: false,
          responseTime,
          wordCount: 0,
          hasAllComponents: false,
          error: data.error || 'Unknown error',
        };
      }
      
      const wordCount = this.calculateWordCount(data);
      const hasAllComponents = this.validateComponents(data);
      
      return {
        version: 'v1',
        success: data.success,
        responseTime,
        wordCount,
        hasAllComponents,
        metadata: data,
      };
    } catch (error) {
      return {
        version: 'v1',
        success: false,
        responseTime: Date.now() - startTime,
        wordCount: 0,
        hasAllComponents: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test V2 generation
   */
  private static async testV2(
    testCase: typeof this.TEST_CASES[0],
    apiKey: string
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/script/speed-write/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(testCase),
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (!response.ok) {
        return {
          version: 'v2',
          success: false,
          responseTime,
          wordCount: 0,
          hasAllComponents: false,
          error: data.error || 'Unknown error',
        };
      }
      
      const wordCount = this.calculateWordCount(data);
      const hasAllComponents = this.validateComponents(data);
      
      return {
        version: 'v2',
        success: data.success,
        responseTime,
        wordCount,
        hasAllComponents,
        metadata: data,
      };
    } catch (error) {
      return {
        version: 'v2',
        success: false,
        responseTime: Date.now() - startTime,
        wordCount: 0,
        hasAllComponents: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate word count from response
   */
  private static calculateWordCount(data: any): number {
    let totalWords = 0;
    
    if (data.optionA?.content) {
      totalWords += data.optionA.content.split(/\s+/).length;
    }
    
    if (data.optionB?.content) {
      totalWords += data.optionB.content.split(/\s+/).length;
    }
    
    return totalWords;
  }

  /**
   * Validate that all components are present
   */
  private static validateComponents(data: any): boolean {
    const checkOption = (option: any) => {
      if (!option?.elements) return false;
      
      return !!(
        option.elements.hook &&
        option.elements.bridge &&
        option.elements.goldenNugget &&
        option.elements.wta
      );
    };
    
    const optionAValid = data.optionA ? checkOption(data.optionA) : false;
    const optionBValid = data.optionB ? checkOption(data.optionB) : false;
    
    return optionAValid || optionBValid;
  }

  /**
   * Calculate summary statistics
   */
  private static calculateSummary(results: BenchmarkResult[]): BenchmarkSummary['v1'] {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const responseTimes = successful.map(r => r.responseTime);
    const wordCounts = successful.map(r => r.wordCount);
    const componentsComplete = results.filter(r => r.hasAllComponents);
    
    responseTimes.sort((a, b) => a - b);
    
    return {
      total_requests: results.length,
      successful_requests: successful.length,
      failed_requests: failed.length,
      success_rate: successful.length / results.length,
      average_response_time: responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      median_response_time: responseTimes.length > 0 ? 
        responseTimes[Math.floor(responseTimes.length / 2)] : 0,
      p95_response_time: responseTimes.length > 0 ? 
        responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
      average_word_count: wordCounts.length > 0 ? 
        wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0,
      component_completion_rate: componentsComplete.length / results.length,
    };
  }

  /**
   * Calculate performance comparison
   */
  private static calculateComparison(
    v1: BenchmarkSummary['v1'],
    v2: BenchmarkSummary['v2']
  ): BenchmarkSummary['comparison'] {
    const performanceImprovement = v1.average_response_time > 0 ? 
      ((v1.average_response_time - v2.average_response_time) / v1.average_response_time) * 100 : 0;
    
    const successRateImprovement = v1.success_rate > 0 ? 
      ((v2.success_rate - v1.success_rate) / v1.success_rate) * 100 : 0;
    
    const qualityImprovement = v1.component_completion_rate > 0 ? 
      ((v2.component_completion_rate - v1.component_completion_rate) / v1.component_completion_rate) * 100 : 0;
    
    let recommendation: 'proceed' | 'investigate' | 'halt' = 'proceed';
    
    if (v2.success_rate < 0.9 || successRateImprovement < -10) {
      recommendation = 'halt';
    } else if (performanceImprovement < -20 || qualityImprovement < -20) {
      recommendation = 'investigate';
    }
    
    return {
      v2_performance_improvement: performanceImprovement,
      v2_success_rate_improvement: successRateImprovement,
      v2_quality_improvement: qualityImprovement,
      recommendation,
    };
  }

  /**
   * Generate benchmark report
   */
  static generateReport(summary: BenchmarkSummary): string {
    const report = `
# V1 vs V2 Performance Benchmark Report

## V1 Performance
- Total Requests: ${summary.v1.total_requests}
- Success Rate: ${(summary.v1.success_rate * 100).toFixed(1)}%
- Average Response Time: ${summary.v1.average_response_time.toFixed(0)}ms
- Median Response Time: ${summary.v1.median_response_time.toFixed(0)}ms
- P95 Response Time: ${summary.v1.p95_response_time.toFixed(0)}ms
- Component Completion Rate: ${(summary.v1.component_completion_rate * 100).toFixed(1)}%

## V2 Performance
- Total Requests: ${summary.v2.total_requests}
- Success Rate: ${(summary.v2.success_rate * 100).toFixed(1)}%
- Average Response Time: ${summary.v2.average_response_time.toFixed(0)}ms
- Median Response Time: ${summary.v2.median_response_time.toFixed(0)}ms
- P95 Response Time: ${summary.v2.p95_response_time.toFixed(0)}ms
- Component Completion Rate: ${(summary.v2.component_completion_rate * 100).toFixed(1)}%

## Comparison
- Performance Improvement: ${summary.comparison.v2_performance_improvement.toFixed(1)}%
- Success Rate Improvement: ${summary.comparison.v2_success_rate_improvement.toFixed(1)}%
- Quality Improvement: ${summary.comparison.v2_quality_improvement.toFixed(1)}%

## Recommendation: ${summary.comparison.recommendation.toUpperCase()}

${summary.comparison.recommendation === 'proceed' ? 
  '✅ V2 shows good performance improvements. Safe to proceed with rollout.' :
  summary.comparison.recommendation === 'investigate' ?
  '⚠️ V2 shows some performance concerns. Investigation recommended before rollout.' :
  '🚨 V2 shows significant performance degradation. Halt rollout and investigate.'
}
    `.trim();
    
    return report;
  }
}

// Quick benchmark function for testing
export const quickBenchmark = async (apiKey: string): Promise<string> => {
  const summary = await PerformanceBenchmark.runBenchmark(2, apiKey);
  return PerformanceBenchmark.generateReport(summary);
};