import os
import re

ui_components = [
    'Badge', 'Button', 'Card', 'CardHeader', 'CardTitle', 'CardContent', 'CardDescription', 'CardFooter',
    'Input', 'Label', 'Textarea', 'Table', 'TableHeader', 'TableBody', 'TableHead', 'TableRow', 'TableCell',
    'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogTrigger', 'DialogFooter',
    'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
    'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
    'Avatar', 'AvatarImage', 'AvatarFallback',
    'Alert', 'AlertTitle', 'AlertDescription',
    'Checkbox', 'Progress', 'Skeleton', 'Switch', 'Separator', 'Popover', 'PopoverContent', 'PopoverTrigger',
    'Sheet', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetTrigger',
    'Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent',
    'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger'
]

def check_files():
    results = []
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                if 'components/ui' in filepath:
                    continue
                with open(filepath, 'r') as f:
                    content = f.read()
                    for comp in ui_components:
                        # Match <Comp or Comp. or {Comp
                        if re.search(r'\b' + comp + r'\b', content):
                            # Check if it's imported (handling multiline and various paths)
                            if not re.search(r'import\s*\{[^}]*\b' + comp + r'\b[^}]*\}\s*from\s*["\']@/components/ui/', content, re.MULTILINE | re.DOTALL):
                                # Check if it's defined in the file
                                if f'const {comp} =' not in content and f'function {comp}' not in content:
                                    results.append((filepath, comp))
    return results

if __name__ == "__main__":
    missing = check_files()
    for filepath, comp in sorted(missing):
        print(f"MISSING {comp} IN {filepath}")
