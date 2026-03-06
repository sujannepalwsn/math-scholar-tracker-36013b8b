"use client";

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, GraduationCap, ShieldCheck, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  unreadCount?: number;
  category?: 'Academics' | 'Administration' | 'Reports and Communications';
}

interface BottomNavProps {
  navItems: NavItem[];
}

export default function BottomNav({ navItems }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<'Academics' | 'Administration' | 'Reports and Communications' | null>(null);

  const dashboardItem = navItems.find(item => item.label === "Dashboard");
  const academicsItems = navItems.filter(item => item.category === 'Academics');
  const administrationItems = navItems.filter(item => item.category === 'Administration');
  const reportsItems = navItems.filter(item => item.category === 'Reports and Communications');

  const handleMenuToggle = (menu: 'Academics' | 'Administration' | 'Reports and Communications') => {
    if (activeMenu === menu) {
      closeMenu();
    } else {
      setActiveMenu(menu);
      window.history.pushState({ menuOpen: true }, "");
    }
  };

  const closeMenu = () => {
    setActiveMenu(null);
    if (window.history.state?.menuOpen) {
      window.history.back();
    }
  };

  // Close menu and navigate
  const handleNavigation = (to: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMenu(null);
    if (window.history.state?.menuOpen) {
      window.history.back();
    }
    setTimeout(() => {
      navigate(to);
    }, 10);
  };

  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (activeMenu) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeMenu]);

  const renderSubMenu = (category: string, items: NavItem[]) => (
    <div
      className={cn(
        "fixed inset-x-0 bottom-16 bg-card border-t shadow-lg p-4 grid grid-cols-4 gap-4 transition-transform duration-300 z-30",
        activeMenu === category ? "translate-y-0" : "translate-y-full pointer-events-none opacity-0"
      )}
    >
      <div className="col-span-4 flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase text-muted-foreground">{category}</span>
        <button onClick={closeMenu} className="p-1 hover:bg-muted rounded-full">
          <X className="h-4 w-4" />
        </button>
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <button
            key={item.to}
            onClick={(e) => handleNavigation(item.to, e)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95",
              isActive ? "bg-primary text-primary-foreground shadow-medium" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-bold text-center leading-tight truncate w-full">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Sub-menus */}
      {renderSubMenu('Academics', academicsItems)}
      {renderSubMenu('Administration', administrationItems)}
      {renderSubMenu('Reports and Communications', reportsItems)}

      {/* Main Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 h-16 bg-white/80 backdrop-blur-xl border-t border-white/20 flex items-center justify-between px-2 z-40 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {/* Dashboard */}
        {dashboardItem && (
          <button
            onClick={(e) => handleNavigation(dashboardItem.to, e)}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] transition-all active:scale-95",
              location.pathname === dashboardItem.to ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Home className={cn("h-6 w-6 transition-transform", location.pathname === dashboardItem.to && "scale-110")} />
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>
        )}

        {/* Academics */}
        {academicsItems.length > 0 && (
          <button
            onClick={() => handleMenuToggle('Academics')}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] transition-all relative active:scale-95",
              activeMenu === 'Academics' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <GraduationCap className={cn("h-6 w-6 transition-transform", activeMenu === 'Academics' && "scale-110")} />
            <span className="text-[10px] font-bold">Academics</span>
            {academicsItems.some(i => i.unreadCount && i.unreadCount > 0) && (
              <span className="absolute top-0 right-4 h-2 w-2 bg-destructive rounded-full" />
            )}
          </button>
        )}

        {/* Administration */}
        {administrationItems.length > 0 && (
          <button
            onClick={() => handleMenuToggle('Administration')}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] transition-all relative active:scale-95",
              activeMenu === 'Administration' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <ShieldCheck className={cn("h-6 w-6 transition-transform", activeMenu === 'Administration' && "scale-110")} />
            <span className="text-[10px] font-bold">Admin</span>
            {administrationItems.some(i => i.unreadCount && i.unreadCount > 0) && (
              <span className="absolute top-0 right-4 h-2 w-2 bg-destructive rounded-full" />
            )}
          </button>
        )}

        {/* Reports */}
        {reportsItems.length > 0 && (
          <button
            onClick={() => handleMenuToggle('Reports and Communications')}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] transition-all relative active:scale-95",
              activeMenu === 'Reports and Communications' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <FileText className={cn("h-6 w-6 transition-transform", activeMenu === 'Reports and Communications' && "scale-110")} />
            <span className="text-[10px] font-bold text-center leading-tight">Reports</span>
            {reportsItems.some(i => i.unreadCount && i.unreadCount > 0) && (
              <span className="absolute top-0 right-4 h-2 w-2 bg-destructive rounded-full" />
            )}
          </button>
        )}
      </div>

      {/* Backdrop for sub-menus */}
      {activeMenu && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  );
}
