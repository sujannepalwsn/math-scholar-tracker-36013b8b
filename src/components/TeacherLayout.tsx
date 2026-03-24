import React, { useState } from "react";
import { AlertTriangle, Archive, Award, BarChart3, Book, BookOpen, Brain, Bus, Calendar, CalendarDays, CheckSquare, ClipboardCheck, Clock, DollarSign, FileText, GraduationCap, Home, IdCard, KeyRound, LayoutList, LogOut, Menu, MessageSquare, Paintbrush, PenTool, Plane, Settings, Star, TrendingUp, User, UserCheck, UserPlus, Users, Video } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import CenterLogo from "./CenterLogo";
import NotificationBell from "./NotificationBell";
import SchoolBranding from "./dashboard/SchoolBranding";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDynamicNavigation } from "@/hooks/useDynamicNavigation";
import { DEFAULT_NAV_ITEMS } from "@/lib/navigation-defaults";

const staticNavItems = DEFAULT_NAV_ITEMS.filter(it => it.role === 'teacher');

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { dynamicCategories, dynamicItems, getIcon, syncDefaults, syncMissingItems } = useDynamicNavigation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: unreadMessageCount = 0 } = useQuery({
    queryKey: ["unread-messages-teacher", user?.id, user?.center_id],
    queryFn: async () => {
      if (!user?.id || !user?.center_id) return 0;
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('parent_user_id', user.id)
        .eq('center_id', user.center_id)
        .maybeSingle();
      if (convError || !conversation) return 0;

      const { count, error } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversation.id)
        .eq('is_read', false)
        .neq('sender_user_id', user.id);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id && !!user?.center_id,
    refetchInterval: 10000 });

  const teacherDynamicItems = dynamicItems.filter(it => it.role === 'teacher' || it.role === 'center');
  const teacherStaticItems = DEFAULT_NAV_ITEMS.filter(it => it.role === 'teacher' || it.role === 'center');

  // Auto-sync defaults if no teacher items exist for this center
  React.useEffect(() => {
    if (user?.center_id && dynamicItems.length > 0 && dynamicItems.filter(it => it.role === 'teacher').length === 0) {
      console.log("TeacherLayout: No teacher nav items found, synchronizing defaults...");
      syncDefaults.mutate();
    }
  }, [user?.center_id, dynamicItems.length]);

  let updatedNavItems = teacherDynamicItems.length > 0
    ? teacherDynamicItems.map(it => {
        const cat = dynamicCategories.find(c => c.id === it.category_id);
        return {
          to: it.route,
          label: it.name,
          icon: getIcon(it.icon),
          role: it.role as any,
          featureName: it.feature_name,
          feature_name: it.feature_name,
          category: cat?.name,
          unreadCount: (it.route === "/teacher-messages" || it.route === "/messages") ? unreadMessageCount : undefined,
          is_active: it.is_active
        };
      })
    : teacherStaticItems.map(item => ({
        to: item.route,
        label: item.name,
        icon: getIcon(item.icon),
        role: item.role as any,
        featureName: item.feature_name,
        feature_name: item.feature_name,
        category: item.category as any,
        unreadCount: (item.route === "/teacher-messages" || item.route === "/messages") ? unreadMessageCount : undefined,
        is_active: true
      }));

  // Ensure mandatory items from defaults are always present (fixing issue for existing customized navigation)
  React.useEffect(() => {
    if (teacherDynamicItems.length > 0) {
      const hasMissing = teacherStaticItems.some(
        staticItem => !teacherDynamicItems.some(it => it.route === staticItem.route)
      );
      if (hasMissing) {
        console.log("TeacherLayout: Detected missing navigation items, syncing...");
        syncMissingItems.mutate();
      }
    }
  }, [teacherDynamicItems.length, teacherStaticItems.length]);

  if (teacherDynamicItems.length > 0) {
    const missingItems = teacherStaticItems.filter(
      staticItem => !teacherDynamicItems.some(it => it.route === staticItem.route)
    );

    if (missingItems.length > 0) {
      const additionalItems = missingItems.map(item => ({
        to: item.route,
        label: item.name,
        icon: getIcon(item.icon),
        role: item.role as any,
        featureName: item.feature_name,
        feature_name: item.feature_name,
        category: item.category as any,
        unreadCount: (item.route === "/teacher-messages" || item.route === "/messages") ? unreadMessageCount : undefined,
        is_active: true
      }));
      updatedNavItems = [...updatedNavItems, ...additionalItems];
    }
  }

  const headerContent = (
    <SchoolBranding />
  );

  const footerContent = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground truncate">{user?.username}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background flex-col md:flex-row">
      <Sidebar
        navItems={updatedNavItems}
        headerContent={headerContent}
        footerContent={footerContent}
        onCollapseChange={setSidebarCollapsed}
        isMobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />

      {/* Mobile Header - Optimized for narrow screens */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b z-40 flex items-center justify-between px-2 sm:px-4 shadow-sm overflow-hidden">
        <div className="flex items-center shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/5 text-primary">
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 min-w-0 px-2 flex justify-center overflow-hidden">
          <SchoolBranding className="max-w-full" isMobileCompact={true} />
        </div>

        <div className="flex items-center shrink-0">
          <NotificationBell />
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto mesh-gradient transition-all duration-300",
        "md:h-screen",
        "pt-16 md:pt-0",
        "px-4 pb-20 md:p-6 lg:p-8",
        sidebarCollapsed ? "md:ml-24" : "md:ml-72"
      )}>
        {/* Desktop Header Overlay with Branding - Premium Glass Design */}
        <div className="hidden md:flex sticky top-4 left-0 right-0 h-24 glass-surface z-30 items-center justify-between px-8 mb-8 rounded-[2.5rem] shadow-glass mx-auto max-w-7xl border border-white/40">
          <SchoolBranding />
          <div className="flex items-center gap-6 pr-4">
             <div className="h-10 w-[1px] bg-black/5" />
             <NotificationBell />
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-soft">
                <User className="h-5 w-5 text-primary" />
             </div>
          </div>
        </div>

        <div className="page-enter max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <BottomNav navItems={updatedNavItems} />
    </div>
  );
}
