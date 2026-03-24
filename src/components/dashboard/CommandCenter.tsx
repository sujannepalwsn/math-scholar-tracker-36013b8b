import React, { useEffect, useState } from "react";
import {
  Search,
  Users,
  User,
  Settings,
  BookOpen,
  DollarSign,
  Calendar,
  ArrowRight,
  Command as CommandIcon
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const openEvent = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener('open-command-center', openEvent);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener('open-command-center', openEvent);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          {user?.role === 'center' && (
            <CommandItem onSelect={() => runCommand(() => navigate("/register-student"))}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Register New Student</span>
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Modules">
          <CommandItem onSelect={() => runCommand(() => navigate(user?.role === 'teacher' ? "/teacher-management" : "/hr-management"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Staff Management</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/finance"))}>
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Finance Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/academics"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Academic Overview</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Institutional Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function UserPlus({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
