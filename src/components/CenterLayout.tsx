import React, { useState } from "react";
import { AlertTriangle, Archive, Award, BarChart3, Bell, Book, BookOpen, Brain, Bus, Calendar, CalendarDays, CheckSquare, ClipboardCheck, Clock, CreditCard, DollarSign, FileText, GraduationCap, Home, IdCard, KeyRound, LayoutList, LogOut, Menu, MessageSquare, Paintbrush, PenTool, Plane, Settings, Star, TrendingUp, User, UserCheck, UserPlus, Users, Video } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import CenterLogo from "./CenterLogo";
import NotificationBell from "./NotificationBell";
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useDynamicNavigation } from "@/hooks/useDynamicNavigation";
import { DEFAULT_NAV_ITEMS } from "@/lib/navigation-defaults";

const staticNavItems = DEFAULT_NAV_ITEMS.filter(it => it.role === 'center');

export default function CenterLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { dynamicCategories, dynamicItems, getIcon } = useDynamicNavigation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: unreadMessageCount = 0 } = useQuery({
    queryKey: ["unread-messages-center", user?.id, user?.center_id],
    queryFn: async () => {
      if (!user?.id || !user?.center_id) return 0;
      const { data: conversations, error: convError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('center_id', user.center_id);
      if (convError) return 0;
      const conversationIds = conversations.map(c => c.id);
      if (conversationIds.length === 0) return 0;

      const { count, error } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact' })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_user_id', user.id);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id && !!user?.center_id,
    refetchInterval: 10000 });

  const updatedNavItems = dynamicItems.filter(it => it.role === 'center').length > 0
    ? dynamicItems.filter(it => it.role === 'center').map(it => {
        const cat = dynamicCategories.find(c => c.id === it.category_id);
        return {
          to: it.route,
          label: it.name,
          icon: getIcon(it.icon),
          role: it.role as any,
          featureName: it.feature_name,
          category: cat?.name,
          unreadCount: it.route === "/messages" ? unreadMessageCount : undefined,
          is_active: it.is_active
        };
      })
    : staticNavItems.map(item => ({
        to: item.route,
        label: item.name,
        icon: getIcon(item.icon),
        role: item.role as any,
        featureName: item.feature_name,
        category: item.category as any,
        unreadCount: item.route === "/messages" ? unreadMessageCount : undefined
      }));

  const headerContent = (
    <CenterLogo size="md" showName={true} />
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

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
          <CenterLogo size="sm" showName={true} />
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto bg-background transition-all duration-200",
        "md:h-screen",
        "pt-16 md:pt-0",
        "px-4 pb-20 md:p-6 lg:p-8",
        sidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <div className="page-enter max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <BottomNav navItems={updatedNavItems} />
    </div>
  );
}
