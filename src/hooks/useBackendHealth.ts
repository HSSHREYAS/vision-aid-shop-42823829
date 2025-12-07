import { useState, useEffect, useCallback } from 'react';
import { checkHealth, HealthResponse } from '@/services/api';

interface UseBackendHealthResult {
    health: HealthResponse | null;
    isConnected: boolean;
    isChecking: boolean;
    error: string | null;
    recheckHealth: () => Promise<void>;
}

/**
 * Hook to monitor backend health status
 * Checks connectivity on mount and periodically every 30 seconds
 */
export function useBackendHealth(intervalMs: number = 30000): UseBackendHealthResult {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const performHealthCheck = useCallback(async () => {
        try {
            setIsChecking(true);
            setError(null);

            const response = await checkHealth();
            setHealth(response);
            setIsConnected(response.status === 'healthy');
        } catch (err) {
            console.error('Backend health check failed:', err);
            setHealth(null);
            setIsConnected(false);
            setError(err instanceof Error ? err.message : 'Backend unreachable');
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Initial health check on mount
    useEffect(() => {
        performHealthCheck();
    }, [performHealthCheck]);

    // Periodic health checks
    useEffect(() => {
        if (intervalMs <= 0) return;

        const interval = setInterval(performHealthCheck, intervalMs);
        return () => clearInterval(interval);
    }, [intervalMs, performHealthCheck]);

    return {
        health,
        isConnected,
        isChecking,
        error,
        recheckHealth: performHealthCheck,
    };
}
