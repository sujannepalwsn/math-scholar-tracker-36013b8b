import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home, CheckSquare, Clock, LayoutList, BookOpen, Book,
  ClipboardCheck, GraduationCap, Award, Paintbrush, AlertTriangle,
  UserPlus, Users, UserCheck, Plane, IdCard, Archive, Bus,
  CalendarDays, Settings, MessageSquare, Video, Calendar,
  User, BarChart3, TrendingUp, FileText, DollarSign, PenTool, Brain
} from "lucide-react";
import React from "react";

export function useDynamicNavigation() {
  const { user } = useAuth();

  const getIcon = (name: string) => {
    const icons: Record<string, React.ElementType> = {
      Home, CheckSquare, Clock, LayoutList, BookOpen, Book,
      ClipboardCheck, GraduationCap, Award, Paintbrush, AlertTriangle,
      UserPlus, Users, UserCheck, Plane, IdCard, Archive, Bus,
      CalendarDays, Settings, MessageSquare, Video, Calendar,
      User, BarChart3, TrendingUp, FileText, DollarSign, PenTool, Brain
    };
    return icons[name] || Home;
  };

  const { data: dynamicCategories = [] } = useQuery({
    queryKey: ["nav-categories", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("nav_categories")
        .select("*")
        .eq("center_id", user.center_id)
        .order("order");
      if (error) return [];
      return data;
    },
    enabled: !!user?.center_id,
  });

  const { data: dynamicItems = [] } = useQuery({
    queryKey: ["nav-items", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("nav_items")
        .select("*")
        .eq("center_id", user.center_id)
        .order("order");
      if (error) return [];
      return data;
    },
    enabled: !!user?.center_id,
  });

  return {
    dynamicCategories,
    dynamicItems,
    getIcon
  };
}
