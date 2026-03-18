import os
import re

missing_data = {}
with open('missing_ui_report.txt', 'r') as f:
    for line in f:
        match = re.match(r'MISSING (\w+) IN (.+)', line.strip())
        if match:
            comp, filepath = match.groups()
            if filepath not in missing_data:
                missing_data[filepath] = set()
            missing_data[filepath].add(comp)

for filepath, comps in missing_data.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    updated = False
    for comp in comps:
        comp_file = comp.lower()
        if comp in ['CardHeader', 'CardTitle', 'CardContent', 'CardDescription', 'CardFooter']:
            comp_file = 'card'
        elif comp in ['TableHeader', 'TableBody', 'TableHead', 'TableRow', 'TableCell']:
            comp_file = 'table'
        elif comp in ['DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogTrigger', 'DialogFooter']:
            comp_file = 'dialog'
        elif comp in ['SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue']:
            comp_file = 'select'
        elif comp in ['TabsList', 'TabsTrigger', 'TabsContent']:
            comp_file = 'tabs'
        elif comp in ['AvatarImage', 'AvatarFallback']:
            comp_file = 'avatar'
        elif comp in ['AlertTitle', 'AlertDescription']:
            comp_file = 'alert'
        elif comp in ['PopoverContent', 'PopoverTrigger']:
            comp_file = 'popover'
        elif comp in ['SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetTrigger']:
            comp_file = 'sheet'
        elif comp in ['AccordionItem', 'AccordionTrigger', 'AccordionContent']:
            comp_file = 'accordion'
        elif comp in ['TooltipContent', 'TooltipProvider', 'TooltipTrigger']:
            comp_file = 'tooltip'

        # Specific import pattern
        import_pattern = r'import\s*\{([^}]*)\}\s*from\s*["\']@/components/ui/' + comp_file + r'["\']'
        match = re.search(import_pattern, content)
        if match:
            existing_parts = [p.strip() for p in match.group(1).split(',')]
            if comp not in existing_parts:
                new_parts = sorted(list(set(existing_parts + [comp])))
                new_import = f"import {{ {', '.join(new_parts)} }} from \"@/components/ui/{comp_file}\""
                content = content.replace(match.group(0), new_import)
                updated = True
        else:
            # Check if it is already in the file but without @/ (e.g. from relative path)
            # For this task, we assume standard @/ structure.

            # Add new import after the last 'import' line
            new_import = f"import {{ {comp} }} from \"@/components/ui/{comp_file}\";"
            lines = content.split('\n')
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.startswith('import'):
                    last_import_idx = i

            if last_import_idx != -1:
                lines.insert(last_import_idx + 1, new_import)
                content = '\n'.join(lines)
                updated = True
            else:
                content = new_import + '\n' + content
                updated = True

    if updated:
        with open(filepath, 'w') as f:
            f.write(content)
