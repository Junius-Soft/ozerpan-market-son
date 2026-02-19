import pandas as pd

excel_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\son_fiyat_listesi190126.xlsx'
output_path = r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\tapa_search_results.txt'

try:
    df = pd.read_excel(excel_path)
    df = df.astype(str)
except Exception as e:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"Error reading Excel file: {e}")
    exit()

keywords = ['tapa', 'yan', 'lamel', 'kapak', 'kepenk', 'end', 'cap']

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("--- TAPA SEARCH RESULTS ---\n\n")
    
    for index, row in df.iterrows():
        row_str = " ".join([str(val) for val in row.values if str(val) != 'nan']).lower()
        # "tapa" kelimesi kesin geçmeli, diğerleri opsiyonel
        if 'tapa' in row_str:
             clean_row = {k: v for k, v in row.to_dict().items() if str(v) != 'nan'}
             f.write(f"Found Row: {clean_row}\n")
    
    f.write("\n--- 'ARIT' SEARCH RESULTS ---\n\n")
    for index, row in df.iterrows():
        row_str = " ".join([str(val) for val in row.values if str(val) != 'nan']).lower()
        if 'arıt' in row_str:
             clean_row = {k: v for k, v in row.to_dict().items() if str(v) != 'nan'}
             f.write(f"Found Row: {clean_row}\n")
