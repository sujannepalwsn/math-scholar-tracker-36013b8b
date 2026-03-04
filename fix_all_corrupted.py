import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    new_lines = []
    import_seen = set()

    for line in lines:
        # Check if line is a corrupted import
        if 'import { Progress } from "@/components/ui/progress";' in line and line.strip().startswith('import'):
            if 'Progress' not in import_seen:
                new_lines.append('import { Progress } from "@/components/ui/progress";\n')
                import_seen.add('Progress')
            continue

        # If it's a standard import, track it
        match = re.search(r'import\s*\{([^}]*)\}\s*from\s*["\']([^"\']+)["\']', line)
        if match:
            parts = [p.strip() for p in match.group(1).split(',')]
            for p in parts:
                import_seen.add(p)
            new_lines.append(line)
        else:
            # Check for corrupted lines like " supabase } from ..."
            if re.search(r'^\s*\w+\s*\}\s*from', line):
                # This is likely a broken multiline import
                new_lines.append(line)
            elif line.strip():
                new_lines.append(line)
            else:
                new_lines.append(line)

    # Actually, let's just use a more surgical approach for Dashboard.tsx
    if 'Dashboard.tsx' in filepath:
        # Restore a clean version of imports for Dashboard.tsx
        return None

    return "".join(new_lines)

# Manual fix for Dashboard.tsx to be safe
dashboard_content = """import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CalendarIcon,
  BookOpen,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
"""

# Let's just rewrite the problematic files completely or use a better sed
