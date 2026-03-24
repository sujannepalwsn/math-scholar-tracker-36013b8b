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
  Command as CommandIcon,
  UserPlus,
  BarChart3
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: students = [] } = useQuery({
    queryKey: ["command-center-students", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data } = await supabase
        .from("students")
        .select("id, name, grade")
        .ilike("name", `%${search}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!user && search.length >= 2,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["command-center-teachers", search],
    queryFn: async () => {
      if (search.length < 2 || user?.role !== 'center') return [];
      const { data } = await supabase
        .from("teachers")
        .select("id, name, subject")
        .ilike("name", `%${search}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!user && search.length >= 2 && user.role === 'center',
  });

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
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate(user?.role === 'teacher' ? "/teacher-dashboard" : user?.role === 'parent' ? "/parent-dashboard" : "/"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          {user?.role === 'center' && (
            <CommandItem onSelect={() => runCommand(() => navigate("/register"))}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Register New Student</span>
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Modules">
          {user?.role === 'center' && (
            <>
              <CommandItem onSelect={() => runCommand(() => navigate("/teachers"))}>
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
            </>
          )}
          {user?.role === 'teacher' && (
            <>
              <CommandItem onSelect={() => runCommand(() => navigate("/teacher/take-attendance"))}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Take Attendance</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/teacher/lesson-plans"))}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Lesson Plans</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/teacher/homework-management"))}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Homework Management</span>
              </CommandItem>
            </>
          )}
          {user?.role === 'parent' && (
            <>
              <CommandItem onSelect={() => runCommand(() => navigate("/parent-homework"))}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Homework Tracking</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/parent-student-report"))}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Academic Report</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate("/parent-finance"))}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Fees & Payments</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>
        {(students.length > 0 || teachers.length > 0) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="People">
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  onSelect={() => runCommand(() => navigate(user?.role === 'parent' ? "/parent-student-report" : `/student-report?student_id=${student.id}`))}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{student.name} (Grade {student.grade})</span>
                </CommandItem>
              ))}
              {teachers.map((teacher) => (
                <CommandItem
                  key={teacher.id}
                  onSelect={() => runCommand(() => navigate("/teachers"))}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{teacher.name} ({teacher.subject})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => navigate(user?.role === 'teacher' ? "/teacher/settings" : user?.role === 'parent' ? "/parent-settings" : "/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
