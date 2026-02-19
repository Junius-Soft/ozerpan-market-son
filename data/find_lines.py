import json

files = [
    r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\product-prices.json',
    r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\accessories.json'
]

targets = ['353153500900', 'panjur_lamel_profilleri', 'panjur_tambur_boru_profilleri', 'panjur_alt_parça_aksesuarları', 'panjur_tambur_boru_aksesuarları']

for filepath in files:
    print(f"File: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            for t in targets:
                if t in line:
                    print(f"Found '{t}' at line {i+1}: {line.strip()[:100]}")
