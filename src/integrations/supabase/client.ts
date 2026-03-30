import { createClient } from "@supabase/supabase-js"
import type { Database } from './types';
import { logger } from "@/utils/logger";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * EXPORT RAW CLIENT FOR LOGGER TO PREVENT CIRCULAR DEPENDENCY & INFINITE RECURSION
 * The logger uses this directly to insert logs without going through the Proxy.
 */
export const rawSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'X-Client-Info': '@supabase/supabase-js'
    }
  }
});

/**
 * Proxy/Wrapper for the Supabase client to automatically capture schema context on errors.
 * This implementation specifically wraps the .then() method of query builders to avoid
 * breaking method chaining (e.g., .from().select().eq()).
 */
export const supabase = new Proxy(rawSupabase, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    if (prop === 'from') {
      return (tableName: string) => {
        const queryBuilder = value.call(target, tableName);

        // Skip interception for the logs table to prevent infinite loops
        if (tableName === 'error_logs') {
          return queryBuilder;
        }

        // Intercept ONLY the .then() method to capture the final query result/error
        const originalThen = queryBuilder.then;
        queryBuilder.then = function(onfulfilled: any, onrejected: any) {
          return originalThen.call(this,
            async (response: any) => {
              if (response && response.error) {
                logger.error(`Database error on table: ${tableName}`, response.error, {
                  errorType: 'database',
                  schemaContext: tableName,
                  payload: { table: tableName, error: response.error }
                });
              }
              return onfulfilled ? onfulfilled(response) : response;
            },
            (err: any) => {
              logger.error(`Unhandled DB Promise rejection on table: ${tableName}`, err, {
                errorType: 'database',
                schemaContext: tableName,
                payload: { table: tableName, error: err }
              });
              return onrejected ? onrejected(err) : Promise.reject(err);
            }
          );
        };

        return queryBuilder;
      };
    }
    return value;
  }
});
