import pandas as pd

xl = pd.ExcelFile("Planes de acciones consolidado hasta 2025 (1).xlsx")
print("Inspeccionando HOJA1:")
df = pd.read_excel(xl, sheet_name="Hoja1")
print(f"Filas: {len(df)}")
print(f"Columnas: {list(df.columns)}")
print(df.head(5))
