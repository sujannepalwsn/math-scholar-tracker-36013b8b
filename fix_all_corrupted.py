import os
import re

files_to_fix = [
    'src/pages/Dashboard.tsx',
    'src/pages/TakeAttendance.tsx',
    'src/pages/HomeworkManagement.tsx',
    'src/pages/TeacherManagement.tsx',
    'src/pages/MeetingManagement.tsx'
]

def clean_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove all duplicated UI imports
    content = re.sub(r'import\s*\{\s*Progress\s*\}\s*from\s*["\']@/components/ui/progress["\'];?\s*', '', content)
    content = re.sub(r'import\s*\{\s*Badge\s*\}\s*from\s*["\']@/components/ui/badge["\'];?\s*', '', content)
    content = re.sub(r'import\s*\{\s*Select\s*\}\s*from\s*["\']@/components/ui/select["\'];?\s*', '', content)
    content = re.sub(r'import\s*\{\s*Loader2\s*\}\s*from\s*["\']lucide-react["\'];?\s*', '', content)

    # Re-add them cleanly if needed
    if 'Progress' in content and 'import { Progress }' not in content:
        content = "import { Progress } from \"@/components/ui/progress\";\n" + content
    if 'Badge' in content and 'import { Badge }' not in content:
        content = "import { Badge } from \"@/components/ui/badge\";\n" + content
    if 'Select' in content and 'import { Select' not in content:
        # Note: some files might import Select, SelectContent etc.
        content = "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@/components/ui/select\";\n" + content
    if 'Loader2' in content and 'import { Loader2 }' not in content:
        content = "import { Loader2 } from \"lucide-react\";\n" + content

    with open(filepath, 'w') as f:
        f.write(content)

for f in files_to_fix:
    clean_file(f)
