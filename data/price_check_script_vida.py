import json
import pandas as pd
import os

# File paths
json_prices_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\product-prices.json'
json_accessories_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\accessories.json'
excel_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\son_fiyat_listesi190126.xlsx'
output_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\price_check_output_vida.txt'

# Load Excel data
try:
    df = pd.read_excel(excel_path)
    df = df.astype(str)
except Exception as e:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"Error reading Excel file: {e}")
    exit()

def search_excel(keywords):
    results = []
    for index, row in df.iterrows():
        row_str = " ".join([str(val) for val in row.values if str(val) != 'nan']).lower()
        if all(k.lower() in row_str for k in keywords):
            clean_row = {k: v for k, v in row.to_dict().items() if str(v) != 'nan'}
            results.append(clean_row)
    return results

targets = [
    {"name": "VİDA", "keywords": ["vida"]}
]

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("--- PRICE CHECK REPORT (VİDA) ---\n\n")

    for target in targets:
        f.write(f"checking: {target['name']}\n")
        
        # Excel Search
        f.write(f"  > Searching Excel with keywords: {target['keywords']}\n")
        excel_matches = search_excel(target['keywords'])
        if excel_matches:
            for m in excel_matches:
                 f.write(f"    - Found Row: {m}\n")
        else:
            f.write("    - No matches in Excel.\n")
        
        f.write("\n" + "="*50 + "\n")
