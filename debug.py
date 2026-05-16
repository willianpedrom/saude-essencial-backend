import re

with open('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/pages/Inventory.js', 'r', encoding='utf-8') as f:
    inv = f.read()

prices_str = re.search(r'const DOTERRA_PRICES = (\{[\s\S]*?\});\s*//', inv).group(1)

prices = {}
for match in re.finditer(r"'([^']+)':\s*\{([^}]+)\}", prices_str):
    name = match.group(1)
    sizes_str = match.group(2)
    prices[name] = {}
    for s_match in re.finditer(r"'([^']+)':\s*\{\s*r:\s*([\d.]+),\s*m:\s*([\d.]+)\s*\}", sizes_str):
        size = s_match.group(1)
        r = float(s_match.group(2))
        m = float(s_match.group(3))
        prices[name][size] = {'r': r, 'm': m}

print("Keys in prices:")
for k in prices:
    if 'Lavan' in k or 'On Guard' in k:
        print(k, prices[k])

