import os
import re

def check_brain_usage():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()
                    if 'Brain' in content:
                        # Check for import from lucide-react
                        import_match = re.search(r'import\s+{[^}]*Brain[^}]*}\s+from\s+["\']lucide-react["\']', content)
                        if not import_match:
                            # Check if it's used in JSX
                            if re.search(r'<Brain', content):
                                print(f"Missing import of Brain in {path}")
                            # Also check if it's used as a component variable (e.g. in dynamic nav)
                            elif re.search(r'\bBrain\b', content) and 'import' not in content.split('Brain')[0]:
                                # This is still naive but let's see
                                pass

if __name__ == "__main__":
    check_brain_usage()
