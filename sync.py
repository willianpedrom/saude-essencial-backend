import json
import re
import math

with open('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/pages/Inventory.js', 'r', encoding='utf-8') as f:
    inv = f.read()

prices_str = re.search(r'const DOTERRA_PRICES = (\{[\s\S]*?\});\s*//', inv).group(1)
aliases_str = re.search(r'const DOTERRA_ALIASES = (\{[\s\S]*?\});', inv).group(1)


# Let's extract keys and values from prices_str
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

aliases = {}
for match in re.finditer(r"'([^']+)':\s*'([^']+)'", aliases_str):
    aliases[match.group(1)] = match.group(2)

def get_dot_prices(nome, tamanho):
    if not nome: return None
    orig = nome.strip()
    lower = orig.lower()
    
    size_search = tamanho.lower()
    if size_search == '10 ml touch' or size_search == 'roll-on 10 ml': size_search = '10ml touch'
    if size_search == '15 ml': size_search = '15ml'
    if size_search == '5 ml': size_search = '5ml'
    if size_search == '10 ml roll-on': size_search = '10ml touch'
    size_search = size_search.replace(' ml', 'ml')
    
    alias_key = aliases.get(lower)
    if alias_key and alias_key in prices:
        e = prices[alias_key]
        return e.get(size_search) or list(e.values())[0]

    entry = prices.get(orig)
    if not entry:
        for k in prices:
            if k.lower() == lower:
                entry = prices[k]
                break

    if not entry:
        def get_tokens(s):
            out = re.sub(r'\(.*?\)', '', s).strip().lower()
            m = re.search(r'\((.*?)\)', s)
            ins = m.group(1).strip().lower() if m else ''
            return [x for x in [out, ins] if x]
        
        lower_tokens = get_tokens(orig)
        for k in prices:
            key_tokens = get_tokens(k)
            if any(t in key_tokens for t in lower_tokens):
                entry = prices[k]
                break

    if not entry:
        stripped = re.sub(r'\s*\(.*?\)\s*', '', lower).strip()
        best_key = None
        min_len = float('inf')
        for k in prices:
            kl = re.sub(r'\s*\(.*?\)\s*', '', k.lower()).strip()
            if kl == stripped or kl.startswith(lower) or lower.startswith(kl) or lower in kl or kl in lower or (len(stripped) > 3 and (kl.startswith(stripped) or stripped.startswith(kl))):
                starts_match = kl.startswith(stripped) or stripped.startswith(kl)
                score = len(kl) + (0 if starts_match else 100)
                if score < min_len:
                    min_len = score
                    best_key = k
        if best_key:
            entry = prices[best_key]

    if not entry: return None

    price = entry.get(size_search)
    if not price:
        num_match = re.search(r'\d+', size_search)
        if num_match:
            for k in entry:
                if num_match.group() in k:
                    return entry[k]
        price = list(entry.values())[0]
    return price

with open('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/oils.js', 'r', encoding='utf-8') as f:
    oils = f.read()

# We need to parse OILS_DATABASE sizes array
def replacer(match):
    oil_name = match.group(1)
    before = match.group(2)
    array_inner = match.group(3)
    after = match.group(4)
    
    # Very dirty parser for sizes array
    sizes = []
    for s_match in re.finditer(r'\{([^}]+)\}', array_inner):
        s_inner = s_match.group(1)
        size_obj = {}
        # parse key-values
        for kv in re.finditer(r'"([^"]+)":\s*([\d.]+|"[^"]+")', s_inner):
            key = kv.group(1)
            val = kv.group(2)
            if val.startswith('"'): val = val.strip('"')
            else: val = float(val)
            size_obj[key] = val
        sizes.append(size_obj)
        
    changed = False
    for sObj in sizes:
        p = get_dot_prices(oil_name, sObj['size'])
        if not p and oil_name.lower() == 'zengest' and '10' in sObj['size']: p = get_dot_prices('zengest touch', '10ml touch')
        if not p and oil_name.lower() == 'clarycalm' and '10' in sObj['size']: p = get_dot_prices('clarycalm', '10ml touch')
        if not p and oil_name.lower() == 'pasttense' and '10' in sObj['size']: p = get_dot_prices('pasttense', '10ml touch')
        if not p and oil_name.lower() == 'intune' and '10' in sObj['size']: p = get_dot_prices('intune', '10ml touch')
        
        if p:
            if sObj.get('regular') != p['r'] or sObj.get('member') != p['m']:
                sObj['regular'] = p['r']
                sObj['member'] = p['m']
                changed = True
        else:
            print("Could not map price for:", oil_name, sObj['size'])
            
    if changed:
        # rebuild json array string
        # format: [{"size": "15 ml", "regular": 197.0, "member": 148.0, "pv": 23}]
        arr_str = []
        for sObj in sizes:
            parts = []
            for k, v in sObj.items():
                if isinstance(v, str): parts.append(f'"{k}": "{v}"')
                else: parts.append(f'"{k}": {v}')
            arr_str.append('{' + ', '.join(parts) + '}')
        new_inner = ', '.join(arr_str)
        return f"'{oil_name}': {{{before}sizes: [{new_inner}]{after}}}"
    return match.group(0)

new_oils = re.sub(r"'([^']+)':\s*\{([^}]+)sizes:\s*\[(.*?)\]([^}]*)\}", replacer, oils)

with open('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/oils.js', 'w', encoding='utf-8') as f:
    f.write(new_oils)
print("Done Python")
