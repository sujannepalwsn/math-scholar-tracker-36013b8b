import os
import re

def consolidate(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        lines = f.readlines()

    lucide_icons = set()
    ui_imports = {} # {component_file: set(components)}
    other_lines = []

    for line in lines:
        # Match lucide-react imports
        lucide_match = re.search(r'import\s*\{([^}]*)\}\s*from\s*["\']lucide-react["\']', line)
        if lucide_match:
            icons = [i.strip() for i in lucide_match.group(1).split(',')]
            for icon in icons:
                if icon: lucide_icons.add(icon)
            continue

        # Match @/components/ui/ imports
        ui_match = re.search(r'import\s*\{([^}]*)\}\s*from\s*["\']@/components/ui/([^"\']+)["\']', line)
        if ui_match:
            parts = [p.strip() for p in ui_match.group(1).split(',')]
            comp_file = ui_match.group(2)
            if comp_file not in ui_imports:
                ui_imports[comp_file] = set()
            for p in parts:
                if p: ui_imports[comp_file].add(p)
            continue

        other_lines.append(line)

    # Build new header
    new_header = []
    if lucide_icons:
        new_header.append(f'import {{ {", ".join(sorted(list(lucide_icons)))} }} from "lucide-react";\n')

    for comp_file, comps in sorted(ui_imports.items()):
        new_header.append(f'import {{ {", ".join(sorted(list(comps)))} }} from "@/components/ui/{comp_file}";\n')

    # Remove leading empty lines from other_lines
    while other_lines and not other_lines[0].strip():
        other_lines.pop(0)

    # Combine
    # We want to keep existing imports that are NOT lucide or UI
    final_imports = []
    final_content = []
    for line in other_lines:
        if line.startswith('import'):
            final_imports.append(line)
        else:
            final_content.append(line)

    with open(filepath, 'w') as f:
        f.writelines(new_header)
        f.writelines(final_imports)
        f.writelines(final_content)

files_to_fix = [
    'src/pages/Dashboard.tsx',
    'src/pages/TakeAttendance.tsx',
    'src/pages/HomeworkManagement.tsx',
    'src/pages/TeacherManagement.tsx',
    'src/pages/MeetingManagement.tsx',
    'src/pages/Tests.tsx',
    'src/pages/DisciplineIssues.tsx',
    'src/pages/AdminFinance.tsx',
    'src/pages/ParentDashboard.tsx',
    'src/pages/ParentFinanceDashboard.tsx'
]

for f in files_to_fix:
    consolidate(f)
