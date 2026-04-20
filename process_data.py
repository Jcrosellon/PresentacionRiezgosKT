import pandas as pd
import json
import math
import os

excel_file = "Planes de acciones consolidado hasta 2025 (1).xlsx"
output_file = "data.json"

def analyze_risk():
    # FUENTE: Hoja1 - Tabla resumen con nombre de proceso y cuenta de hallazgos
    try:
        # La fila 0 está vacía, los encabezados reales están en la fila 1 (header=1)
        df = pd.read_excel(excel_file, sheet_name="Hoja1", header=1)
        df.columns = [str(c).strip() for c in df.columns]

        print(f"Columnas en Hoja1: {list(df.columns)}")
        print(df.head(10))

        # Detectar columnas: la primera es el nombre, la segunda es el conteo
        name_col  = df.columns[0]  # "Etiquetas de fila"
        count_col = df.columns[1]  # "Cuenta de Hallazgo"

        records = []
        for _, row in df.iterrows():
            name  = str(row[name_col]).strip()
            count = row[count_col]

            # Ignorar filas vacías, totales generales o NaN
            if not name or name.lower() in ('nan', 'total general', '(en blanco)'):
                continue
            try:
                count = int(count)
            except (ValueError, TypeError):
                continue

            records.append({'proceso': name, 'count': count})

    except Exception as e:
        print(f"Error leyendo Hoja1: {e}")
        return []

    if not records:
        print("No se encontraron datos en Hoja1.")
        return []

    max_count = max(r['count'] for r in records)

    result = []
    for r in records:
        count = r['count']
        name  = r['proceso']

        # Probabilidad: escala logarítmica 1–5 según cantidad de hallazgos
        prob   = round(1 + 4 * (math.log(count) / math.log(max_count)) if max_count > 1 else 1, 2)

        # Impacto: escala 1–5 basado en cantidad relativa al máximo
        impact = round(1 + 4 * (count / max_count), 2)

        result.append({
            'PROCESO':     name,
            'SUB_PROCESO': name,
            'impact_val':  impact,
            'prob_val':    prob,
            'Hallazgo':    count
        })

    return result


if os.path.exists(output_file):
    os.remove(output_file)

data = analyze_risk()
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nREADY: {len(data)} procesos desde Hoja1.")
print("Lista:", [d['PROCESO'] for d in data])
