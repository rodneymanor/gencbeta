import { useState, useCallback } from 'react';

interface RecoveryStats {
  attempts: number;
  successfulStrategy: string | null;
  issueTypes: string[];
  recoveryTimes: number[];
}

interface SmartRecoveryProps {
  videoId: string;
}

export const useSmartRecovery = ({ videoId: _videoId }: SmartRecoveryProps) => {
  const [recoveryStats, setRecoveryStats] = useState<RecoveryStats>({
    attempts: 0,
    successfulStrategy: null,
    issueTypes: [],
    recoveryTimes: []
  });

  const recordRecoveryAttempt = useCallback((issueType: string, strategy: string, success: boolean, recoveryTime?: number) => {
    setRecoveryStats(prev => ({
      attempts: prev.attempts + 1,
      successfulStrategy: success ? strategy : prev.successfulStrategy,
      issueTypes: [...prev.issueTypes, issueType],
      recoveryTimes: recoveryTime ? [...prev.recoveryTimes, recoveryTime] : prev.recoveryTimes
    }));
  }, []);

  const getOptimalStrategy = useCallback(() => {
    // Use analytics to determine best recovery strategy
    const { successfulStrategy, issueTypes } = recoveryStats;

    if (successfulStrategy) {
      return successfulStrategy;
    }

    // Default strategy based on issue patterns
    const hasStallIssues = issueTypes.includes('stalled');
    const hasBufferIssues = issueTypes.includes('buffer_gap') || issueTypes.includes('low_buffer');
    const hasErrorIssues = issueTypes.includes('error');

    if (hasStallIssues) return 'iframe_recreation';
    if (hasBufferIssues) return 'url_refresh';
    if (hasErrorIssues) return 'progressive_delay';

    return 'iframe_reload';
  }, [recoveryStats]);

  const getAverageRecoveryTime = useCallback(() => {
    const { recoveryTimes } = recoveryStats;
    if (recoveryTimes.length === 0) return 0;
    
    return recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length;
  }, [recoveryStats]);

  const resetStats = useCallback(() => {
    setRecoveryStats({
      attempts: 0,
      successfulStrategy: null,
      issueTypes: [],
      recoveryTimes: []
    });
  }, []);

  return {
    recordRecoveryAttempt,
    getOptimalStrategy,
    getAverageRecoveryTime,
    resetStats,
    recoveryStats
  };
}; 