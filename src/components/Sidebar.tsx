"use client";

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  role?: 'admin' | 'center' | 'parent' | 'teacher';
  featureName?: string;
  unreadCount?: number;
  category?: 'Academics' | 'Administration';
}

interface SidebarProps {
  navItems: NavItem[];
  headerContent: React.ReactNode;
  footerContent: React.ReactNode;
  onCollapseChange?: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export default function Sidebar({
  navItems,
  headerContent,
  footerContent,
  onCollapseChange,
  isMobileOpen = false,
  onMobileOpenChange
}: SidebarProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  // Prevent animation glitch on first render
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleCollapseToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapseChange?.(newState);
  };

  const handleMobileClose = () => {
    onMobileOpenChange?.(false);
  };

  // Handle back button on mobile when sidebar is open
  useEffect(() => {
    if (!isMobileOpen) return;

    // Push a new state when the sidebar opens
    window.history.pushState({ sidebarOpen: true }, "");

    const handlePopState = (event: PopStateEvent) => {
      // If the user clicks back, close the sidebar
      if (onMobileOpenChange) {
        onMobileOpenChange(false);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // If the sidebar is still "open" in history, but being closed by React state change,
      // we need to remove the extra state we pushed to keep history clean.
      if (window.history.state?.sidebarOpen) {
        window.history.back();
      }
    };
  }, [isMobileOpen, onMobileOpenChange]);

  const filteredNavItems = navItems.filter(item => {
    if (item.role && user?.role !== item.role) {
      return false;
    }

    if (item.featureName) {
      if (user?.role === 'center' && user.centerPermissions) {
        return user.centerPermissions[item.featureName];
      }
      if (user?.role === 'teacher' && user.teacherPermissions) {
        return user.teacherPermissions[item.featureName];
      }
    }
    return true;
  });

  // Desktop sidebar
  const desktopSidebar = (
    <TooltipProvider>
      <div
        className={cn(
          "fixed top-0 left-0 h-screen z-20 hidden md:flex flex-col border-r",
          "bg-card text-card-foreground shadow-soft",
          mounted ? "transition-all duration-300" : "",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-4">
          {!isCollapsed && <div className="flex-1 animate-in fade-in slide-in-from-left-4">{headerContent}</div>}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCollapseToggle}
            className="h-8 w-8 hover:bg-muted"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {(() => {
            const items: React.ReactNode[] = [];
            let lastCategory: string | undefined = undefined;

            filteredNavItems.forEach((item) => {
              if (item.category !== lastCategory) {
                if (item.category && !isCollapsed) {
                  items.push(
                    <div key={`cat-${item.category}`} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 first:mt-0">
                      {item.category}
                    </div>
                  );
                } else if (item.category && isCollapsed) {
                  items.push(
                    <div key={`cat-sep-${item.category}`} className="mx-4 border-t border-muted my-4 first:hidden" />
                  );
                }
                lastCategory = item.category;
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              items.push(
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        isCollapsed ? "justify-center px-0" : ""
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && (
                        <span className="flex items-center justify-between w-full truncate">
                          {item.label}
                          {item.unreadCount && item.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-auto px-1.5 py-0 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center">
                              {item.unreadCount}
                            </Badge>
                          )}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <span className="flex items-center gap-2">
                        {item.label}
                        {item.unreadCount && item.unreadCount > 0 && (
                          <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                            {item.unreadCount}
                          </Badge>
                        )}
                      </span>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            });
            return items;
          })()}
        </nav>

        {/* Footer */}
        <div className="mt-auto p-4 border-t">
          {!isCollapsed && <div className="text-sm text-muted-foreground">{footerContent}</div>}
          {isCollapsed && (
            <div className="flex justify-center">
              {footerContent}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );

  // Mobile drawer
  const mobileSidebar = (
    <div
      className={cn(
        "fixed inset-0 z-40 md:hidden transition-opacity duration-200",
        isMobileOpen ? "bg-black/50 backdrop-blur-sm" : "pointer-events-none opacity-0"
      )}
      onClick={handleMobileClose}
    >
      {isMobileOpen && (
        <style>{`
          body {
            overflow: hidden;
          }
        `}</style>
      )}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen w-72 bg-card text-card-foreground shadow-lg flex flex-col transition-transform duration-300 ease-out z-50",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex-1">{headerContent}</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMobileClose}
            className="h-9 w-9 rounded-lg hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {(() => {
            const items: React.ReactNode[] = [];
            let lastCategory: string | undefined = undefined;

            filteredNavItems.forEach((item) => {
              if (item.category !== lastCategory) {
                if (item.category) {
                  items.push(
                    <div key={`mob-cat-${item.category}`} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 first:mt-0">
                      {item.category}
                    </div>
                  );
                }
                lastCategory = item.category;
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              items.push(
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleMobileClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex items-center justify-between flex-1 truncate">
                    {item.label}
                    {item.unreadCount && item.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto px-1.5 py-0 text-[10px]">
                        {item.unreadCount}
                      </Badge>
                    )}
                  </span>
                </Link>
              );
            });
            return items;
          })()}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="text-sm text-muted-foreground">{footerContent}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}
