import pandas as pd

xl = pd.ExcelFile("Planes de acciones consolidado hasta 2025 (1).xlsx")
print("Hojas disponibles:")
for i, name in enumerate(xl.sheet_names):
    df = pd.read_excel(xl, sheet_name=name, nrows=2)
    cols = [str(c).strip().upper() for c in df.columns]
    print(f'  [{i}] "{name}" -> columnas: {cols[:5]}')
