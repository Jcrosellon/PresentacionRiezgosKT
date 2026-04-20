import pandas as pd

file_path = "Planes de acciones consolidado hasta 2025 (1).xlsx"
xl = pd.ExcelFile(file_path)
print(f"File: {file_path}")
print(f"Sheets: {xl.sheet_names}")

for sheet in xl.sheet_names:
    print(f"\n--- SHEET: {sheet} ---")
    df = pd.read_excel(file_path, sheet_name=sheet)
    if 'PROCESO' in df.columns or any('PROCESO' in str(c).upper() for c in df.columns):
        p_col = next((c for c in df.columns if 'PROCESO' in str(c).upper()), None)
        procs = df[p_col].dropna().unique()
        print(f"Unique Processes ({len(procs)}): {procs.tolist()}")
    else:
        print("No PROCESO column found.")
