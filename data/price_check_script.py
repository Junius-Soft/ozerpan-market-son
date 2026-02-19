import json
import pandas as pd
import os

# File paths
json_prices_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\product-prices.json'
json_accessories_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\accessories.json'
excel_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\son_fiyat_listesi190126.xlsx'
output_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\price_check_output.txt'

# Load JSON data
try:
    with open(json_prices_path, 'r', encoding='utf-8') as f:
        prices_data = json.load(f)

    with open(json_accessories_path, 'r', encoding='utf-8') as f:
        accessories_data = json.load(f)
except Exception as e:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"Error loading JSONs: {e}")
    exit()

# Combine all products into a single list
all_products = []

def extract_products(data, source):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        item['source_file'] = source
                        item['category_key'] = key
                        all_products.append(item)
            elif isinstance(value, dict):
                extract_products(value, source)

extract_products(prices_data, 'product-prices.json')
extract_products(accessories_data, 'accessories.json')

# Load Excel data
try:
    df = pd.read_excel(excel_path)
    # Convert all columns to string to make searching easier
    df = df.astype(str)
except Exception as e:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"Error reading Excel file: {e}")
    exit()

def search_json(keywords):
    results = []
    for product in all_products:
        desc = str(product.get('description', '')).lower()
        if all(k.lower() in desc for k in keywords):
            results.append(product)
    return results

def search_excel(keywords):
    results = []
    for index, row in df.iterrows():
        # Create a string representation of the row
        row_str = " ".join([str(val) for val in row.values if str(val) != 'nan']).lower()
        if all(k.lower() in row_str for k in keywords):
            clean_row = {k: v for k, v in row.to_dict().items() if str(v) != 'nan'}
            results.append(clean_row)
    return results

targets = [
    {"name": "KEPENK ALT PARÇA", "json_keywords": ["alt", "parça"], "excel_keywords": ["alt", "parça"]},
    {"name": "KEPENK DİKME", "json_keywords": ["dikme"], "excel_keywords": ["dikme"]},
    {"name": "70 LİK SEKİZGEN BORU", "json_keywords": ["70", "sekizgen", "boru"], "excel_keywords": ["70", "sekizgen", "boru"]},
    {"name": "KEPENK ALT PARÇA LASTİĞİ", "json_keywords": ["alt", "parça", "lastiği"], "excel_keywords": ["alt", "parça", "lastiği"]},
    {"name": "KEPENK BORU BAŞI", "json_keywords": ["boru", "başı"], "excel_keywords": ["boru", "başı"]}
]

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("--- PRICE CHECK REPORT ---\n\n")

    for target in targets:
        f.write(f"checking: {target['name']}\n")
        
        # JSON Search
        f.write(f"  > Searching JSON with keywords: {target['json_keywords']}\n")
        json_matches = search_json(target['json_keywords'])
        if json_matches:
            for m in json_matches[:10]: # Limit to 10
                 f.write(f"    - Found: {m.get('description')} | Price: {m.get('price')} | Code: {m.get('stock_code')}\n")
        else:
            f.write("    - No matches in JSON.\n")

        # Excel Search
        f.write(f"  > Searching Excel with keywords: {target['excel_keywords']}\n")
        excel_matches = search_excel(target['excel_keywords'])
        if excel_matches:
            for m in excel_matches:
                 # Try to find price column - often explicitly named 'Fiyat' or 'Price' or just a number
                 # We'll just print the whole row for now
                 f.write(f"    - Found Row: {m}\n")
        else:
            # Fallback for Excel: maybe just one keyword if multiple failed?
            # E.g. for "70 mm" instead of "70 lik"
            if "70" in target['name']:
                 f.write("    - Retrying Excel with '70' and 'boru'...\n")
                 excel_matches_retry = search_excel(["70", "boru"])
                 for m in excel_matches_retry:
                     f.write(f"      - Found Retry: {m}\n")
            elif "KEPENK BORU BAŞI" == target['name']:
                 f.write("    - Retrying Excel with 'boru' and 'başı'...\n")
                 excel_matches_retry = search_excel(["boru", "başı"])
                 for m in excel_matches_retry:
                     f.write(f"      - Found Retry: {m}\n")

            if not excel_matches:
                f.write("    - No matches in Excel.\n")
        
        f.write("\n" + "="*50 + "\n")
