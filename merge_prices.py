import json
import re

with open('new_prices.json', 'r', encoding='utf-8') as f:
    new_prices = json.load(f)

# old prices dictionary
# we can parse it from public/js/pages/Inventory.js
with open('public/js/pages/Inventory.js', 'r', encoding='utf-8') as f:
    inv_js = f.read()

start_idx = inv_js.find('const DOTERRA_PRICES = {')
end_idx = inv_js.find('};', start_idx)
dict_str = inv_js[start_idx + len('const DOTERRA_PRICES = {'):end_idx]

import ast
# dict_str has format: 'Item': { 'size': { r: 123, m: 123 } },
# python can't parse it directly because of { r: 123, m: 123 } without quotes.
dict_str_clean = re.sub(r'([a-zA-Z0-9_]+):', r'"\1":', dict_str)
dict_str_clean = re.sub(r'\'', '"', dict_str_clean)
# some keys might be double quoted now: ""key"":
dict_str_clean = re.sub(r'""', '"', dict_str_clean)
dict_str_clean = "{" + dict_str_clean + "}"

try:
    old_prices = json.loads(dict_str_clean)
except Exception as e:
    # let's write a simple regex parser instead
    print("Fallback to regex parsing")
    old_prices = {}
    
old_prices = {}
for line in dict_str.split('\n'):
    line = line.strip()
    if not line: continue
    # 'Adaptiv': { '15ml': { r: 303, m: 227 } },
    # 'Adaptiv Pastilhas': { 'Unidade / Kit': { r: 247, m: 185 } },
    # 'Basil (Manjericão)': { '15ml': { r: 245, m: 184 }, '5ml': { r: 101, m: 76 } },
    m = re.match(r'^[\'"](.+?)[\'"]:\s*\{(.*)\},?$', line)
    if m:
        name = m.group(1)
        sizes_str = m.group(2)
        sizes = {}
        for sm in re.finditer(r'[\'"](.+?)[\'"]:\s*\{\s*r:\s*([\d.]+),\s*m:\s*([\d.]+)\s*\}', sizes_str):
            sizes[sm.group(1)] = {'r': float(sm.group(2)), 'm': float(sm.group(3))}
        old_prices[name] = sizes

updated_count = 0
unmatched = []

for old_name, old_sizes in old_prices.items():
    clean_old_name = re.sub(r'\(.*?\)', '', old_name).replace('®', '').replace('™', '').strip().lower()
    
    for old_size, old_vals in old_sizes.items():
        clean_old_size = old_size.lower()
        if 'unidade' in clean_old_size or 'kit' in clean_old_size:
            clean_old_size = 'unidade / kit'
        
        best_match = None
        best_score = -1
        
        for np in new_prices:
            clean_np_name = re.sub(r'\(.*?\)', '', np['name']).replace('®', '').replace('™', '').split('-')[0].strip().lower()
            clean_np_size = np['size'].lower()
            if 'unidade' in clean_np_size or 'kit' in clean_np_size or 'g' in clean_np_size or 'litro' in clean_np_size:
                clean_np_size = 'unidade / kit'
            if 'pastilha' in clean_np_size or 'cápsulas' in clean_np_size:
                clean_np_size = 'cápsulas'
                
            if clean_old_size == 'cápsulas' and 'pastilha' in old_name.lower():
                clean_np_size = 'cápsulas'
                
            # match logic
            name_match = (clean_np_name == clean_old_name) or (clean_np_name in clean_old_name) or (clean_old_name in clean_np_name)
            
            # exceptions / synonyms
            if clean_old_name == 'melaleuca' and clean_np_name == 'tea tree': name_match = True
            if 'smart & sassy' in clean_old_name and 'metapwr' in clean_np_name: pass # they might be different
            if clean_old_name == 'zen gest' and 'zengest' in clean_np_name: name_match = True
            if clean_old_name == 'copaiba' and 'copaíba' in clean_np_name: name_match = True
            
            size_match = False
            if clean_old_size == clean_np_size: size_match = True
            if clean_old_size == '10ml touch' and 'touch' in clean_np_size: size_match = True
            if clean_old_size == 'unidade / kit' and clean_np_size == 'unidade / kit': size_match = True
            if clean_old_size == 'unidade / kit' and clean_np_size == 'cápsulas' and ('pastilha' in old_name.lower() or 'cápsula' in old_name.lower()): size_match = True
            
            if name_match and size_match:
                score = 1
                if clean_np_name == clean_old_name: score += 10
                if clean_old_size == clean_np_size: score += 5
                
                if score > best_score:
                    best_score = score
                    best_match = np
                    
        if best_match:
            if old_vals['r'] != best_match['reg'] or old_vals['m'] != best_match['mem']:
                old_prices[old_name][old_size]['r'] = best_match['reg']
                old_prices[old_name][old_size]['m'] = best_match['mem']
                updated_count += 1
        else:
            unmatched.append(f"{old_name} [{old_size}]")

print(f"Updated {updated_count} prices.")
print("Unmatched:")
for u in unmatched:
    print(u)

# build js
js_str = 'const DOTERRA_PRICES = {\n'
for name in sorted(old_prices.keys()):
    js_str += f"    '{name}': {{ "
    sizes_str = []
    for size, vals in old_prices[name].items():
        sizes_str.append(f"'{size}': {{ r: {vals['r']}, m: {vals['m']} }}")
    js_str += ", ".join(sizes_str) + " },\n"
js_str += '};'

new_inv_js = inv_js[:start_idx] + js_str + inv_js[end_idx+2:]
with open('public/js/pages/Inventory.js', 'w', encoding='utf-8') as f:
    f.write(new_inv_js)
