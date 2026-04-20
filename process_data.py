import pandas as pd
import json
import math
import os

excel_file = "Planes de acciones consolidado hasta 2025 (1).xlsx"
output_file = "data.json"

def analyze_risk():
    # EXCLUSIVE SOURCE: Sheet 5 ('Consolidado') - The high-level executive view with 2026 data.
    all_raw = []
    
    try:
        df = pd.read_excel(excel_file, sheet_name=0)  # Hoja 1
        df.columns = [str(c).strip().upper() for c in df.columns]
        
        # Buscar columna "Sub proceso" primero, luego fallback a "Proceso"
        sp_col = next((c for c in df.columns if 'SUB' in c and 'PROCESO' in c), None)
        p_col  = next((c for c in df.columns if c == 'PROCESO' or (c.startswith('PROCESO') and 'SUB' not in c)), None)
        h_col  = next((c for c in df.columns if 'HALLAZGO' in c), None)
        
        group_col = sp_col if sp_col else p_col
        
        print(f"Columnas disponibles: {list(df.columns)}")
        print(f"Columna de agrupación utilizada: {group_col}")
        
        if group_col and h_col:
            for _, row in df.iterrows():
                name = str(row[group_col]).strip()
                if not name or name.lower() == 'nan': continue
                
                text = str(row[h_col])
                all_raw.append({'proceso': name, 'text': text})
    except Exception as e:
        print(f"Error reading Sheet 5: {e}")
        return []

    if not all_raw: return []

    # Count frequencies
    counts = {}
    for r in all_raw:
        name = r['proceso']
        counts[name] = counts.get(name, 0) + 1
    
    max_count = max(counts.values()) if counts else 1

    # Analysis
    high_keywords = ['ALTO', 'CRITICO', 'GRAVE', 'RIESGO ALTO', 'SANCION', 'FRAUDE', 'SOPORTE', 'INCUMPLIMIENTO']
    process_risks = {}
    for r in all_raw:
        name = r['proceso']
        if name not in process_risks:
            process_risks[name] = {'impact_scores': [], 'count': 0}
        
        score = 2.5
        txt = str(r['text']).upper()
        if any(k in txt for k in high_keywords): score = 4.5
        
        process_risks[name]['impact_scores'].append(score)
        process_risks[name]['count'] += 1

    result = []
    for name, stats in process_risks.items():
        prob = 1 + 4 * (math.log(stats['count']) / math.log(max_count)) if max_count > 1 else 1
        impact = max(stats['impact_scores'])
        
        result.append({
            'PROCESO': name,
            'SUB_PROCESO': name,
            'impact_val': round(impact, 2),
            'prob_val': round(prob, 2),
            'Hallazgo': stats['count']
        })

    return result

if os.path.exists(output_file):
    os.remove(output_file)

data = analyze_risk()
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"READY: {len(data)} processes from Sheet 5.")
print("Process list:", [d['PROCESO'] for d in data])
