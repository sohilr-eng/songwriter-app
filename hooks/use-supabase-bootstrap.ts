import { useEffect } from 'react';
import { bindSupabaseAutoRefresh } from '@/lib/supabase/client';

export function useSupabaseBootstrap() {
  useEffect(() => {
    bindSupabaseAutoRefresh();
  }, []);
}
