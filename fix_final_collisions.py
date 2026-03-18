import os
import re

def fix_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    # Check for Calendar collision (Shadcn Calendar vs Lucide Calendar)
    if ('from "@/components/ui/calendar"' in content or "from '@/components/ui/calendar'" in content):
        # Remove Calendar from lucide-react import
        content = re.sub(r'import\s*\{([^}]*)\bCalendar\b,\s*([^}]*)\}\s*from\s*["\']lucide-react["\']', r'import {\1\2} from "lucide-react"', content)
        content = re.sub(r'import\s*\{([^}]*),\s*\bCalendar\b([^}]*)\}\s*from\s*["\']lucide-react["\']', r'import {\1\2} from "lucide-react"', content)
        content = re.sub(r'import\s*\{\s*\bCalendar\b\s*\}\s*from\s*["\']lucide-react["\']', '', content)

    # Check for Tooltip collision (Shadcn Tooltip vs Recharts Tooltip)
    if ('from "@/components/ui/tooltip"' in content or "from '@/components/ui/tooltip'" in content) and 'from \'recharts\'' in content:
        # FinanceReports already fixed, but let's be safe
        pass

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))
