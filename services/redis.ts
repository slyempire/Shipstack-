
/**
 * Shipstack Cache Service (Proxying via Backend)
 * Used for high-speed driver telemetry and hot data caching
 */
export const cacheService = {
  /**
   * Set JSON data in Redis with TTL via Backend Proxy
   */
  set: async (key: string, value: any, ttlSeconds: number = 3600): Promise<void> => {
    try {
      await fetch(`/api/cache/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, ttl: ttlSeconds })
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const lowMsg = errorMsg.toLowerCase();
      const isNetworkError = lowMsg.includes('fetch') || 
                            lowMsg.includes('network') ||
                            lowMsg.includes('failed to fetch') ||
                            lowMsg.includes('typeerror') ||
                            lowMsg.includes('abort') ||
                            lowMsg.includes('load failed');
      if (!isNetworkError) {
        console.error(`Cache set failed for key ${key}:`, err);
      }
    }
  },

  /**
   * Get data from Redis via Backend Proxy
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const response = await fetch(`/api/cache/${key}`);
      if (!response.ok) return null;
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return null;
      }

      const { value } = await response.json();
      return value as T;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const lowMsg = errorMsg.toLowerCase();
      const isNetworkError = lowMsg.includes('fetch') || 
                            lowMsg.includes('network') ||
                            lowMsg.includes('failed to fetch') ||
                            lowMsg.includes('typeerror') ||
                            lowMsg.includes('abort') ||
                            lowMsg.includes('load failed');
      
      if (!isNetworkError) {
        console.error(`Cache get failed for key ${key}:`, err);
      }
      return null;
    }
  },

  /**
   * Delete keys via Backend Proxy
   */
  del: async (key: string): Promise<void> => {
    try {
      await fetch(`/api/cache/${key}`, { method: 'DELETE' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const lowMsg = errorMsg.toLowerCase();
      const isNetworkError = lowMsg.includes('fetch') || 
                            lowMsg.includes('network') ||
                            lowMsg.includes('failed to fetch') ||
                            lowMsg.includes('typeerror') ||
                            lowMsg.includes('abort') ||
                            lowMsg.includes('load failed');
      if (!isNetworkError) {
        console.error(`Cache del failed for key ${key}:`, err);
      }
    }
  }
};
