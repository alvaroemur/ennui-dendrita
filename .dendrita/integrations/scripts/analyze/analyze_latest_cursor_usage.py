#!/usr/bin/env python3
"""
Script para encontrar y analizar automáticamente el archivo CSV más reciente
de uso de Cursor en la carpeta _clippings/_imported-manually/

Uso:
    python3 analyze_latest_cursor_usage.py
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import analyze_cursor_usage

def find_latest_csv(directory):
    """
    Encuentra el archivo CSV más reciente en un directorio.
    
    Args:
        directory: Ruta al directorio donde buscar
        
    Returns:
        Path: Ruta al archivo CSV más reciente, o None si no hay archivos
    """
    dir_path = Path(directory)
    
    if not dir_path.exists():
        print(f"❌ El directorio {directory} no existe")
        return None
    
    # Buscar todos los archivos CSV
    csv_files = list(dir_path.glob("*.csv"))
    
    if not csv_files:
        print(f"❌ No se encontraron archivos CSV en {directory}")
        return None
    
    # Encontrar el más reciente por fecha de modificación
    latest_file = max(csv_files, key=lambda f: f.stat().st_mtime)
    
    return latest_file

def main():
    """Función principal."""
    # Directorio donde buscar los CSVs
    csv_directory = "_clippings/_imported-manually"
    
    # Si se proporciona un directorio diferente, usarlo
    if len(sys.argv) > 1:
        csv_directory = sys.argv[1]
    
    print(f"🔍 Buscando el archivo CSV más reciente en: {csv_directory}")
    
    latest_csv = find_latest_csv(csv_directory)
    
    if not latest_csv:
        print("\n💡 Sugerencias:")
        print("   - Verifica que el directorio existe")
        print("   - Asegúrate de que hay archivos CSV en el directorio")
        print("   - O proporciona una ruta diferente como argumento:")
        print("     python3 analyze_latest_cursor_usage.py /ruta/al/directorio")
        sys.exit(1)
    
    print(f"✅ Archivo más reciente encontrado: {latest_csv.name}")
    print(f"   Modificado: {datetime.fromtimestamp(latest_csv.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Tamaño: {latest_csv.stat().st_size / 1024:.1f} KB")
    
    # Analizar el archivo usando la función del script principal
    print(f"\n📊 Analizando {latest_csv}...")
    
    try:
        analysis = analyze_cursor_usage.analyze_cursor_usage(str(latest_csv))
        
        # Guardar resultados en JSON
        output_file = latest_csv.stem + '_analysis.json'
        output_path = latest_csv.parent / output_file
        
        import json
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        # Crear un archivo "latest.json" que siempre apunta al más reciente
        # Convertir rutas a relativas desde el directorio actual
        try:
            csv_rel = str(latest_csv.relative_to(Path.cwd()))
        except ValueError:
            csv_rel = str(latest_csv)
        
        try:
            analysis_rel = str(output_path.relative_to(Path.cwd()))
        except ValueError:
            analysis_rel = str(output_path)
        
        latest_info = {
            'csv_file': csv_rel,
            'analysis_file': analysis_rel,
            'generated_at': datetime.now().isoformat(),
            'csv_name': latest_csv.name,
            'csv_modified': datetime.fromtimestamp(latest_csv.stat().st_mtime).isoformat()
        }
        
        latest_json_path = Path('_clippings/_imported-manually/latest.json')
        with open(latest_json_path, 'w', encoding='utf-8') as f:
            json.dump(latest_info, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Análisis completado!")
        print(f"📊 Estadísticas generales:")
        print(f"   - Total de eventos: {analysis['stats']['total_events']:,}")
        print(f"   - Costo total: ${analysis['stats']['total_cost']:.2f}")
        print(f"   - Uso del presupuesto: {analysis['stats']['usage_percentage']:.1f}%")
        print(f"   - Presupuesto restante: ${analysis['stats']['remaining_budget']:.2f}")
        print(f"   - Proyección mensual: ${analysis['projection']['projected_monthly_cost']:.2f}")
        print(f"\n📁 Resultados guardados en:")
        print(f"   - Análisis completo: {output_path}")
        print(f"   - Referencia más reciente: {latest_json_path}")
        print(f"\n💡 Para ver el dashboard:")
        print(f"   1. Abre cursor-usage-dashboard.html en tu navegador (desde servidor local)")
        print(f"   2. El dashboard intentará cargar automáticamente el JSON más reciente")
        print(f"   3. O carga manualmente: {output_path}")
        
        return analysis
        
    except Exception as e:
        print(f"❌ Error durante el análisis: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

