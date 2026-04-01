import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemStats {
  students: number;
  teachers: number;
  centers: number;
  loading: boolean;
}

export const useSystemStats = () => {
  return useQuery({
    queryKey: ['system_stats'],
    queryFn: async () => {
      const [studentsCount, teachersCount, centersCount] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('centers').select('*', { count: 'exact', head: true }),
      ]);

      return {
        students: studentsCount.count || 0,
        teachers: teachersCount.count || 0,
        centers: centersCount.count || 0,
      };
    },
    staleTime: 30 * 60 * 1000, // Stats don't need to be perfectly real-time for landing page
  });
};
