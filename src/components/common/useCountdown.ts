/**
 * useCountdown Hook
 * Centralized countdown timer hook for consistent countdown functionality
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isComplete: boolean;
  isRunning: boolean;
}

export interface CountdownOptions {
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (state: CountdownState) => void;
  interval?: number;
}

export interface CountdownControls {
  start: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
}

export function useCountdown(
  targetDate: Date | string | number,
  options: CountdownOptions = {},
): [CountdownState, CountdownControls] {
  const { autoStart = true, onComplete, onTick, interval = 1000 } = options;

  const [state, setState] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isComplete: false,
    isRunning: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetTimeRef = useRef<number>(0);

  // Parse target date
  const parseTargetDate = useCallback((date: Date | string | number): number => {
    if (date instanceof Date) {
      return date.getTime();
    }
    if (typeof date === "string") {
      return new Date(date).getTime();
    }
    return date;
  }, []);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback((targetTime: number): CountdownState => {
    const now = Date.now();
    const difference = targetTime - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isComplete: true,
        isRunning: false,
      };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds: Math.floor(difference / 1000),
      isComplete: false,
      isRunning: true,
    };
  }, []);

  // Start countdown
  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const targetTime = parseTargetDate(targetDate);
    targetTimeRef.current = targetTime;

    const updateCountdown = () => {
      const newState = calculateTimeRemaining(targetTime);
      setState(newState);

      if (onTick) {
        onTick(newState);
      }

      if (newState.isComplete) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (onComplete) {
          onComplete();
        }
      }
    };

    // Initial calculation
    updateCountdown();

    // Start interval
    intervalRef.current = setInterval(updateCountdown, interval);
  }, [targetDate, parseTargetDate, calculateTimeRemaining, onTick, onComplete, interval]);

  // Pause countdown
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  // Reset countdown
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const targetTime = parseTargetDate(targetDate);
    const newState = calculateTimeRemaining(targetTime);
    setState({ ...newState, isRunning: false });
  }, [targetDate, parseTargetDate, calculateTimeRemaining]);

  // Restart countdown
  const restart = useCallback(() => {
    reset();
    start();
  }, [reset, start]);

  // Initialize countdown
  useEffect(() => {
    const targetTime = parseTargetDate(targetDate);
    targetTimeRef.current = targetTime;
    const initialState = calculateTimeRemaining(targetTime);
    setState({ ...initialState, isRunning: false });

    if (autoStart && !initialState.isComplete) {
      start();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [targetDate, parseTargetDate, calculateTimeRemaining, autoStart, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const controls: CountdownControls = {
    start,
    pause,
    reset,
    restart,
  };

  return [state, controls];
}

// Utility functions for formatting countdown
export function formatCountdown(state: CountdownState, format: "short" | "long" | "compact" = "short"): string {
  const { days, hours, minutes, seconds, isComplete } = state;

  if (isComplete) {
    return "Complete";
  }

  switch (format) {
    case "compact":
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;

    case "long":
      const parts = [];
      if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
      if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
      return parts.join(", ");

    case "short":
    default:
      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
  }
}

// Hook for countdown with formatted display
export function useFormattedCountdown(
  targetDate: Date | string | number,
  format: "short" | "long" | "compact" = "short",
  options: CountdownOptions = {},
): [string, CountdownState, CountdownControls] {
  const [state, controls] = useCountdown(targetDate, options);
  const formatted = formatCountdown(state, format);
  return [formatted, state, controls];
}
