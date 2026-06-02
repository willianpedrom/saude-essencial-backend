import re
import json

with open('nova_tabela.txt', 'r', encoding='utf-8') as f:
    text = f.read()

prices = []
for line in text.split('\n'):
    line = line.strip()
    if 'R$' not in line: continue
    
    # regex for line ends with: R$ <val> R$ <val> <pv>
    m = re.search(r'(R\$\s*[\d.,]+)\s+(R\$\s*[\d.,]+)\s+(\d+)$', line)
    if not m:
        continue
    
    price_reg_str = m.group(1).replace('R$', '').strip().replace('.', '').replace(',', '.')
    price_mem_str = m.group(2).replace('R$', '').strip().replace('.', '').replace(',', '.')
    
    prefix = line[:m.start()].strip()
    
    # remove anything before an 8-digit code
    # e.g., "AROMAS NATURAIS ... INGESTÃO60203876 Basil" -> "60203876 Basil"
    prefix = re.sub(r'^.*?(?=\d{6,8}\s+)', '', prefix)
    
    # remove code at start
    prefix = re.sub(r'^\d{6,8}\s+', '', prefix)
    
    # separate name and size
    size_match = re.search(r'\s+(\d+\s*(?:ml|g|litro|litros|pastilhas|cápsulas|bisna-?\s*gas)|(?:Unidade|Caixa|Kit|Livro|Touch\s*10\s*ml|10\s*ml\s*Touch|5\s*ml|15\s*ml|10\s*ml))$', prefix, re.IGNORECASE)
    
    if size_match:
        size = size_match.group(1).strip()
        name = prefix[:size_match.start()].strip()
    else:
        name = prefix
        size = "Unidade / Kit"
        
    name = name.replace('dōTERRA', '').replace('®', '').replace('™', '').strip()
    name = re.sub(r'\(.*?\)', '', name).strip()
    
    if 'Touch - Roll-On' in name:
        name = name.replace('Touch - Roll-On', 'Touch')
        
    if size.lower() in ['5 ml', '15 ml', '10 ml', '30 ml']:
        size = size.replace(' ', '')
    if size.lower() == '10ml touch':
        size = '10ml Touch'
        
    s = size.lower()
    if 'caixa' in s or 'kit' in s or 'unidade' in s or 'livro' in s:
        size = 'Unidade / Kit'
    if 'pastilhas' in s or 'cápsulas' in s:
        size = 'Cápsulas'
    if 'bisnaga' in s or 'bisna- gas' in s or 'bisna gas' in s:
        size = 'Unidade / Kit'

    if name.endswith('Touch') and size == '10ml':
        size = '10ml Touch'

    prices.append({
        'name': name,
        'size': size,
        'reg': float(price_reg_str),
        'mem': float(price_mem_str)
    })

with open('new_prices.json', 'w', encoding='utf-8') as f:
    json.dump(prices, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(prices)} prices")
