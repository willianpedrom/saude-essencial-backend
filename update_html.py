import os
import re

directory = '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public'

html_pattern = re.compile(r'(src=["\']/js/[^"\'>]+\.js)(?:\?v=\d+)?(["\'])')

def update_html(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = html_pattern.sub(r"\g<1>?v=999\g<2>", content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for file in os.listdir(directory):
    if file.endswith('.html'):
        update_html(os.path.join(directory, file))

print("Done HTML")
