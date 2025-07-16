import { useState, useEffect, useCallback } from 'react';

interface ApiCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiry: number;
  };
}

interface UseOptimizedApiOptions {
  cacheTime?: number; // Cache duration in milliseconds
  staleTime?: number; // Time before data is considered stale
  refetchInterval?: number; // Auto-refetch interval
  retryAttempts?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries
}

const apiCache: ApiCache = {};

// Cleanup expired cache entries
const cleanupCache = () => {
  const now = Date.now();
  Object.keys(apiCache).forEach(key => {
    if (apiCache[key].timestamp + apiCache[key].expiry < now) {
      delete apiCache[key];
    }
  });
};

// Run cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

export const useOptimizedApi = <T>(
  endpoint: string,
  options: UseOptimizedApiOptions = {}
) => {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    staleTime = 1 * 60 * 1000, // 1 minute default
    refetchInterval = 0, // No auto-refetch by default
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchData = useCallback(async (force = false) => {
    const cacheKey = endpoint;
    const now = Date.now();

    // Check cache first
    if (!force && apiCache[cacheKey]) {
      const cached = apiCache[cacheKey];
      const isExpired = now - cached.timestamp > cached.expiry;
      const isStale = now - cached.timestamp > staleTime;

      if (!isExpired) {
        setData(cached.data);
        setLastFetch(cached.timestamp);
        
        // If stale but not expired, return cached data and refetch in background
        if (isStale) {
          // Background refetch
          fetchData(true);
        }
        return;
      }
    }

    setLoading(true);
    setError(null);

    let attempts = 0;
    const attemptFetch = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('local_auth_token');
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Cache the result
        apiCache[cacheKey] = {
          data: result,
          timestamp: now,
          expiry: cacheTime
        };

        setData(result);
        setLastFetch(now);
        setError(null);
      } catch (err) {
        attempts++;
        
        if (attempts < retryAttempts) {
          // Retry with exponential backoff
          setTimeout(attemptFetch, retryDelay * Math.pow(2, attempts - 1));
        } else {
          setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        }
      } finally {
        setLoading(false);
      }
    };

    await attemptFetch();
  }, [endpoint, cacheTime, staleTime, retryAttempts, retryDelay]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidateCache = useCallback(() => {
    delete apiCache[endpoint];
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refetch interval
  useEffect(() => {
    if (refetchInterval > 0) {
      const interval = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [refetchInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache,
    lastFetch,
    isStale: lastFetch > 0 && Date.now() - lastFetch > staleTime
  };
};

// Hook for POST requests with optimistic updates
export const useOptimizedMutation = <T, R>(
  endpoint: string,
  options: {
    onSuccess?: (data: R) => void;
    onError?: (error: string) => void;
    optimisticUpdate?: (data: T) => void;
    invalidateCache?: string[]; // Endpoints to invalidate
  } = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: T) => {
    setLoading(true);
    setError(null);

    // Optimistic update
    if (options.optimisticUpdate) {
      options.optimisticUpdate(data);
    }

    try {
      const token = localStorage.getItem('local_auth_token');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Invalidate specified cache entries
      if (options.invalidateCache) {
        options.invalidateCache.forEach(cacheKey => {
          delete apiCache[cacheKey];
        });
      }

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  return { mutate, loading, error };
};

// Helper function to batch multiple API calls
export const useBatchedRequests = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const batchFetch = useCallback(async (requests: string[]) => {
    setLoading(true);
    setErrors([]);

    const token = localStorage.getItem('local_auth_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const promises = requests.map(endpoint => 
        fetch(endpoint, { headers }).then(response => {
          if (!response.ok) {
            throw new Error(`${endpoint}: ${response.status}`);
          }
          return response.json();
        })
      );

      const results = await Promise.allSettled(promises);
      
      const data: any[] = [];
      const batchErrors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          data.push(result.value);
        } else {
          batchErrors.push(`${requests[index]}: ${result.reason.message}`);
        }
      });

      setErrors(batchErrors);
      return data;
    } catch (err) {
      setErrors(['Erreur lors du traitement des requêtes groupées']);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { batchFetch, loading, errors };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    responseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    requestCount: 0
  });

  const updateMetrics = useCallback(() => {
    // Calculate cache hit rate
    const cacheEntries = Object.keys(apiCache).length;
    const totalRequests = metrics.requestCount;
    const cacheHitRate = totalRequests > 0 ? (cacheEntries / totalRequests) * 100 : 0;

    setMetrics(prev => ({
      ...prev,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    }));
  }, [metrics.requestCount]);

  useEffect(() => {
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return metrics;
};

// Clear all cache
export const clearAllCache = () => {
  Object.keys(apiCache).forEach(key => {
    delete apiCache[key];
  });
};

// Get cache stats
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  let totalSize = 0;

  Object.values(apiCache).forEach(entry => {
    if (now - entry.timestamp < entry.expiry) {
      validEntries++;
    } else {
      expiredEntries++;
    }
    totalSize += JSON.stringify(entry.data).length;
  });

  return {
    validEntries,
    expiredEntries,
    totalEntries: validEntries + expiredEntries,
    totalSize: Math.round(totalSize / 1024), // KB
    hitRate: validEntries / (validEntries + expiredEntries) * 100 || 0
  };
};