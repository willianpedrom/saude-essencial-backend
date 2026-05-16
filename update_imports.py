import os
import re

directory = '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js'

import_pattern = re.compile(r"(from\s+['\"]|import\s*\(['\"])([^'\"]+\.js)(?:\?v=\d+)?(['\"])")

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add or update ?v=999
    new_content = import_pattern.sub(r"\g<1>\g<2>?v=999\g<3>", content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.js'):
            update_file(os.path.join(root, file))

print("Done")
