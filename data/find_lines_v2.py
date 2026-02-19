
files = [
    r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\product-prices.json',
    r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\accessories.json'
]

targets = ['353153500900', 'panjur_lamel_profilleri', 'panjur_tambur_boru_profilleri', 'panjur_alt_parça_aksesuarları', 'panjur_tambur_boru_aksesuarları', 'panjur_kutu_profilleri']

with open(r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\lines.txt', 'w', encoding='utf-8') as outfile:
    for filepath in files:
        outfile.write(f"\nFile: {filepath}\n")
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for i, line in enumerate(f):
                    for t in targets:
                        if t in line:
                            outfile.write(f"Line {i+1}: {line.strip()[:100]}\n")
        except Exception as e:
            outfile.write(f"Error reading file: {e}\n")
