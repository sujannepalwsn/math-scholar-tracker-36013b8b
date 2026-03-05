"use client";

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, GraduationCap, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  unreadCount?: number;
  category?: 'Academics' | 'Administration';
}

interface BottomNavProps {
  navItems: NavItem[];
}

export default function BottomNav({ navItems }: BottomNavProps) {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState<'Academics' | 'Administration' | null>(null);

  const dashboardItem = navItems.find(item => item.label === "Dashboard");
  const academicsItems = navItems.filter(item => item.category === 'Academics');
  const administrationItems = navItems.filter(item => item.category === 'Administration');

  const handleMenuToggle = (menu: 'Academics' | 'Administration') => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const closeMenu = () => setActiveMenu(null);

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
          <Link
            key={item.to}
            to={item.to}
            onClick={closeMenu}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] text-center leading-tight truncate w-full">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Sub-menus */}
      {renderSubMenu('Academics', academicsItems)}
      {renderSubMenu('Administration', administrationItems)}

      {/* Main Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 h-16 bg-background/80 backdrop-blur-md border-t flex items-center justify-around px-2 z-40 md:hidden">
        {/* Dashboard */}
        {dashboardItem && (
          <Link
            to={dashboardItem.to}
            onClick={closeMenu}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] transition-colors",
              location.pathname === dashboardItem.to ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
        )}

        {/* Academics */}
        <button
          onClick={() => handleMenuToggle('Academics')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[64px] transition-colors relative",
            activeMenu === 'Academics' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <GraduationCap className="h-5 w-5" />
          <span className="text-[10px] font-medium">Academics</span>
          {academicsItems.some(i => i.unreadCount && i.unreadCount > 0) && (
            <span className="absolute top-0 right-4 h-2 w-2 bg-destructive rounded-full" />
          )}
        </button>

        {/* Administration */}
        <button
          onClick={() => handleMenuToggle('Administration')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[64px] transition-colors relative",
            activeMenu === 'Administration' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <ShieldCheck className="h-5 w-5" />
          <span className="text-[10px] font-medium">Admin</span>
          {administrationItems.some(i => i.unreadCount && i.unreadCount > 0) && (
            <span className="absolute top-0 right-4 h-2 w-2 bg-destructive rounded-full" />
          )}
        </button>
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
