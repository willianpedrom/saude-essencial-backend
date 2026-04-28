import re

inventory_path = '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/pages/Inventory.js'

with open(inventory_path, 'r') as f:
    lines = f.readlines()

for line in lines:
    if 'DOTERRA_PRICES' in line:
        pass
    if 'col' in line or 'Colágeno' in line:
        print(line.strip())

