import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';

type TableFilter = { column: string; value: string | number };

/**
 * Subscribe to Postgres change events on a Supabase table and invoke `onChange`
 * whenever a row is inserted, updated, or deleted. Optionally filter to a single
 * column/value (e.g. `{ column: 'tenant_id', value: 'tenant-1' }`).
 *
 * Safely no-ops when Supabase is not configured, so callers can mount it without
 * checking the backend mode themselves — useful in the multi-backend fallback
 * model used by `api.ts` (Supabase → Frappe → localStorage).
 *
 * The `onChange` callback is held in a ref so re-renders don't tear down the
 * subscription; pass any plain function without memoising it.
 */
export function useRealtimeTable(
  table: string,
  onChange: () => void,
  filter?: TableFilter
) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const filterColumn = filter?.column;
  const filterValue = filter?.value;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const filterString = filterColumn && filterValue !== undefined
      ? `${filterColumn}=eq.${filterValue}`
      : undefined;

    const channelName = filterString
      ? `realtime:${table}:${filterString}`
      : `realtime:${table}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filterString ? { filter: filterString } : {}),
        },
        () => {
          try {
            cbRef.current();
          } catch (err) {
            console.warn(`useRealtimeTable(${table}) callback threw`, err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filterColumn, filterValue]);
}
