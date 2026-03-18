import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import CenterLayout from "./CenterLayout";
import TeacherLayout from "./TeacherLayout";

export default function DynamicRoleLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role === 'teacher') {
    return <TeacherLayout>{children}</TeacherLayout>;
  }

  return <CenterLayout>{children}</CenterLayout>;
}
