
files = [
    r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\product-prices.json',
    r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\accessories.json'
]

targets = ['352123900200', '352131100200', '352321211900', '352451121200']

with open(r'c:\Users\sadi2\Desktop\ERP\projeler\cam2\ozerpan-market-son\data\lines_v3.txt', 'w', encoding='utf-8') as outfile:
    for filepath in files:
        outfile.write(f"\nFile: {filepath}\n")
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for i, line in enumerate(f):
                    for t in targets:
                        if t in line:
                            outfile.write(f"Line {i+1}: {line.strip()}\n")
                            # Read surrounding lines for context? 
                            # No need, I will view file around these lines.
        except Exception as e:
            outfile.write(f"Error reading file: {e}\n")
