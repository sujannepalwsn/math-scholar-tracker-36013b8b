import os
import re

files_to_fix = [
    'src/pages/TakeAttendance.tsx',
    'src/pages/TeacherAttendance.tsx',
    'src/pages/ViewRecords.tsx'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # Check if both imports exist
    if 'from "@/components/ui/calendar"' in content or "from '@/components/ui/calendar'" in content:
        # Remove Calendar from lucide-react import
        content = re.sub(r'(import\s*\{[^}]*)\bCalendar\b,\s*', r'\1', content)
        content = re.sub(r'(import\s*\{[^}]*),\s*\bCalendar\b\s*\}', r'\1}', content)
        # Handle case where it's the only one (unlikely given my fix_icons.py)
        content = re.sub(r'import\s*\{\s*\bCalendar\b\s*\}\s*from\s*["\']lucide-react["\']', '', content)

    with open(filepath, 'w') as f:
        f.write(content)
