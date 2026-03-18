import os
import re

missing_data = {}
with open('missing_icons_report.txt', 'r') as f:
    for line in f:
        match = re.match(r'MISSING (\w+) IN (.+)', line.strip())
        if match:
            icon, filepath = match.groups()
            if filepath not in missing_data:
                missing_data[filepath] = set()
            missing_data[filepath].add(icon)

for filepath, icons in missing_data.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # Try to find existing lucide-react import
    import_match = re.search(r'import\s*\{([^}]*)\}\s*from\s*["\']lucide-react["\']', content)
    if import_match:
        existing_icons = [i.strip() for i in import_match.group(1).split(',')]
        new_icons = sorted(list(set(existing_icons + list(icons))))
        new_icons_str = ', '.join([i for i in new_icons if i])
        new_import = f'import {{ {new_icons_str} }} from "lucide-react"'
        content = content.replace(import_match.group(0), new_import)
    else:
        # No existing import, add one after React import or at the top
        new_import = f'import {{ {", ".join(sorted(list(icons)))} }} from "lucide-react";\n'
        react_match = re.search(r'import React.*from ["\']react["\']', content)
        if react_match:
            content = content[:react_match.end()] + '\n' + new_import + content[react_match.end():]
        else:
            content = new_import + content

    with open(filepath, 'w') as f:
        f.write(content)
