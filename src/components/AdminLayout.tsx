import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, DollarSign, Settings, LogOut, User, Shield, KeyRound, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import { useState } from "react";

const navItems: Array<{
  to: string;
  label: string;
  icon: React.ElementType;
  role: 'admin' | 'center' | 'parent' | 'teacher';
}> = [
  { to: "/admin-dashboard", label: "Dashboard", icon: Home, role: 'admin' as const },
  { to: "/admin/finance", label: "Finance", icon: DollarSign, role: 'admin' as const },
  { to: "/admin/settings", label: "Settings", icon: Settings, role: 'admin' as const },
  { to: "/change-password", label: "Change Password", icon: KeyRound, role: 'admin' as const },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login-admin');
  };

  const headerContent = (
    <div className="flex items-center gap-2">
      <Shield className="h-6 w-6 text-destructive" />
      <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{user?.username}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="fixed top-0 left-0 h-screen z-10 hidden md:block">
        <Sidebar
          navItems={navItems}
          headerContent={headerContent}
          footerContent={footerContent}
          onCollapseChange={setSidebarCollapsed}
          isMobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sidebar
        navItems={navItems}
        headerContent={headerContent}
        footerContent={footerContent}
        isMobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-destructive" />
          <h1 className="text-lg font-bold text-foreground">Admin</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto bg-background",
        "md:h-screen md:p-6",
        "pt-20 md:pt-0",
        "p-4 md:p-6",
        sidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}
