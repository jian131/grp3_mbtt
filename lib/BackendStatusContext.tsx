'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { checkBackendHealth, HealthCheckResult } from '@/lib/api';
import { ENABLE_HEALTH_CHECK } from '@/lib/config';

interface BackendStatusContextType {
  isOnline: boolean;
  isChecking: boolean;
  lastCheck: Date | null;
  latency: number | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const BackendStatusContext = createContext<BackendStatusContextType>({
  isOnline: true,
  isChecking: false,
  lastCheck: null,
  latency: null,
  error: null,
  refresh: async () => {},
});

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}

interface BackendStatusProviderProps {
  children: ReactNode;
  checkInterval?: number; // ms, default 30s
}

export function BackendStatusProvider({
  children,
  checkInterval = 30000
}: BackendStatusProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performHealthCheck = useCallback(async () => {
    if (!ENABLE_HEALTH_CHECK) {
      setIsOnline(true);
      return;
    }

    setIsChecking(true);

    try {
      const result: HealthCheckResult = await checkBackendHealth();
      setIsOnline(result.online);
      setLatency(result.latency || null);
      setError(result.error || null);
      setLastCheck(new Date());
    } catch (err) {
      setIsOnline(false);
      setError('Health check failed');
      setLastCheck(new Date());
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Initial check
  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  // Periodic checks
  useEffect(() => {
    if (!ENABLE_HEALTH_CHECK || checkInterval <= 0) return;

    const interval = setInterval(performHealthCheck, checkInterval);
    return () => clearInterval(interval);
  }, [performHealthCheck, checkInterval]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => performHealthCheck();
    const handleOffline = () => {
      setIsOnline(false);
      setError('Browser offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performHealthCheck]);

  return (
    <BackendStatusContext.Provider
      value={{
        isOnline,
        isChecking,
        lastCheck,
        latency,
        error,
        refresh: performHealthCheck,
      }}
    >
      {children}
    </BackendStatusContext.Provider>
  );
}
