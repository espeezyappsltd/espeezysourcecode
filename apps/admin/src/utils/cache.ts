/**
 * PersistentCache Utility
 * High-performance, TTL-based disk caching for massive global scale.
 * Reduces database churn and provides an "instantly-on" UX.
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

export class PersistentCache {
  private static PREFIX = 'gf_cache_';

  /**
   * Store data in persistent local storage
   */
  static set<T>(key: string, data: T, ttlMs: number = 3600000): void {
    if (typeof window === 'undefined') return;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    };
    
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.warn('PersistentCache: Failed to save to disk', e);
    }
  }

  /**
   * Retrieve data from disk, handling TTL invalidation
   */
  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    const raw = localStorage.getItem(this.PREFIX + key);
    if (!raw) return null;
    
    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;
      
      if (isExpired) {
        localStorage.removeItem(this.PREFIX + key);
        return null;
      }
      
      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Force clear a specific key
   */
  static clear(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.PREFIX + key);
  }
}
