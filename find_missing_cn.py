import os
import re

def check_files():
    missing_files = []
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                if filepath == 'src/lib/utils.ts':
                    continue
                with open(filepath, 'r') as f:
                    content = f.read()
                    if 'cn(' in content:
                        if not re.search(r'import.*\{.*cn.*\}.*from', content) and not re.search(r'import.*cn.*from', content):
                            # Check if it's defined in the file
                            if 'function cn(' not in content and 'const cn =' not in content:
                                missing_files.append(filepath)
    return missing_files

if __name__ == "__main__":
    missing = check_files()
    for m in missing:
        print(m)
