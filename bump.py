import os
import re

directory = '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public'

# We want to replace ?v=999 with ?v=1000 in .js and .html files
def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(r'\?v=\d+', '?v=1007', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            update_file(os.path.join(root, file))

print("Done bumping versions")
