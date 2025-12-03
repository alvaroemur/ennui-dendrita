#!/usr/bin/env python3
"""
Script para analizar el uso de Cursor desde un archivo CSV de eventos.
Genera datos agregados y estadísticas para el dashboard.

Puede analizar un CSV local o descargar directamente desde la API de Cursor.
"""

import pandas as pd
import json
import sys
import argparse
import requests
from datetime import datetime, timedelta
from pathlib import Path

def analyze_cursor_usage(csv_path):
    """
    Analiza el archivo CSV de eventos de uso de Cursor y genera estadísticas.
    
    Args:
        csv_path: Ruta al archivo CSV
        
    Returns:
        dict: Diccionario con todas las estadísticas y datos agregados
    """
    # Leer el CSV
    df = pd.read_csv(csv_path)
    
    # Convertir la columna Date a datetime
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Extraer información de fecha
    df['Date_only'] = df['Date'].dt.date
    df['Hour'] = df['Date'].dt.hour
    df['Day_of_week'] = df['Date'].dt.day_name()
    
    # Calcular estadísticas generales
    stats = {
        'total_events': len(df),
        'total_cost': float(df['Cost'].sum()),
        'total_tokens': int(df['Total Tokens'].sum()),
        'total_input_tokens': int(df['Input (w/ Cache Write)'].sum() + df['Input (w/o Cache Write)'].sum()),
        'total_output_tokens': int(df['Output Tokens'].sum()),
        'total_cache_read': int(df['Cache Read'].sum()),
        'date_range': {
            'start': df['Date'].min().isoformat(),
            'end': df['Date'].max().isoformat()
        },
        'plan_limit': 20.0,  # Plan Pro: $20/mes
        'usage_percentage': (df['Cost'].sum() / 20.0) * 100,
        'remaining_budget': 20.0 - df['Cost'].sum()
    }
    
    # Estadísticas por día
    daily_stats = df.groupby('Date_only').agg({
        'Cost': 'sum',
        'Total Tokens': 'sum',
        'Date': 'count'
    }).reset_index()
    daily_stats.columns = ['date', 'cost', 'total_tokens', 'event_count']
    daily_stats['date'] = daily_stats['date'].astype(str)
    
    # Estadísticas por hora
    hourly_stats = df.groupby('Hour').agg({
        'Cost': 'sum',
        'Total Tokens': 'sum',
        'Date': 'count'
    }).reset_index()
    hourly_stats.columns = ['hour', 'cost', 'total_tokens', 'event_count']
    
    # Estadísticas por día de la semana
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    weekday_stats = df.groupby('Day_of_week').agg({
        'Cost': 'sum',
        'Total Tokens': 'sum',
        'Date': 'count'
    }).reindex(day_order, fill_value=0).reset_index()
    weekday_stats.columns = ['day', 'cost', 'total_tokens', 'event_count']
    
    # Estadísticas por modelo
    model_stats = df.groupby('Model').agg({
        'Cost': 'sum',
        'Total Tokens': 'sum',
        'Date': 'count'
    }).reset_index()
    model_stats.columns = ['model', 'cost', 'total_tokens', 'event_count']
    
    # Estadísticas por Max Mode
    max_mode_stats = df.groupby('Max Mode').agg({
        'Cost': 'sum',
        'Total Tokens': 'sum',
        'Date': 'count'
    }).reset_index()
    max_mode_stats.columns = ['max_mode', 'cost', 'total_tokens', 'event_count']
    
    # Top 10 eventos más costosos
    top_costly = df.nlargest(10, 'Cost')[
        ['Date', 'Model', 'Max Mode', 'Total Tokens', 'Cost']
    ].copy()
    top_costly['Date'] = top_costly['Date'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    # Distribución de tokens
    token_distribution = {
        'input_with_cache': int(df['Input (w/ Cache Write)'].sum()),
        'input_without_cache': int(df['Input (w/o Cache Write)'].sum()),
        'cache_read': int(df['Cache Read'].sum()),
        'output': int(df['Output Tokens'].sum())
    }
    
    # Promedios
    averages = {
        'avg_cost_per_event': float(df['Cost'].mean()),
        'avg_tokens_per_event': float(df['Total Tokens'].mean()),
        'avg_cost_per_day': float(daily_stats['cost'].mean()),
        'avg_events_per_day': float(daily_stats['event_count'].mean())
    }
    
    # Proyección mensual
    days_in_period = (df['Date'].max() - df['Date'].min()).days + 1
    if days_in_period > 0:
        daily_avg_cost = df['Cost'].sum() / days_in_period
        projected_monthly = daily_avg_cost * 30
    else:
        projected_monthly = df['Cost'].sum()
    
    # Compilar todos los datos
    result = {
        'stats': stats,
        'daily_stats': daily_stats.to_dict('records'),
        'hourly_stats': hourly_stats.to_dict('records'),
        'weekday_stats': weekday_stats.to_dict('records'),
        'model_stats': model_stats.to_dict('records'),
        'max_mode_stats': max_mode_stats.to_dict('records'),
        'top_costly_events': top_costly.to_dict('records'),
        'token_distribution': token_distribution,
        'averages': averages,
        'projection': {
            'daily_avg_cost': float(daily_avg_cost) if days_in_period > 0 else 0,
            'projected_monthly_cost': float(projected_monthly),
            'days_analyzed': days_in_period
        }
    }
    
    return result

def download_from_api(start_date, end_date, output_file=None):
    """
    Descarga el CSV de eventos de uso desde la API de Cursor.
    
    Args:
        start_date: Fecha de inicio (datetime o string YYYY-MM-DD)
        end_date: Fecha de fin (datetime o string YYYY-MM-DD)
        output_file: Archivo donde guardar el CSV (opcional)
        
    Returns:
        str: Ruta al archivo CSV descargado
    """
    # Convertir fechas a timestamps en milisegundos
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
    
    start_timestamp = int(start_date.timestamp() * 1000)
    end_timestamp = int((end_date + timedelta(days=1)).timestamp() * 1000) - 1
    
    api_url = f"https://cursor.com/api/dashboard/export-usage-events-csv?startDate={start_timestamp}&endDate={end_timestamp}&strategy=tokens"
    
    print(f"Descargando desde Cursor API...")
    print(f"   Período: {start_date.strftime('%Y-%m-%d')} a {end_date.strftime('%Y-%m-%d')}")
    
    try:
        response = requests.get(api_url, cookies=None)  # Las cookies se manejan automáticamente si usas un navegador
        
        if response.status_code == 401 or response.status_code == 403:
            print("\n⚠️  Error de autenticación")
            print("   Necesitas estar autenticado en Cursor.")
            print("   Opciones:")
            print("   1. Usa el dashboard HTML (funciona automáticamente con las cookies del navegador)")
            print("   2. Exporta el CSV manualmente desde la web de Cursor")
            print("   3. Usa un navegador automatizado con cookies de sesión")
            sys.exit(1)
        
        response.raise_for_status()
        
        if not output_file:
            output_file = f"usage-events-{start_date.strftime('%Y-%m-%d')}-to-{end_date.strftime('%Y-%m-%d')}.csv"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"✅ CSV descargado: {output_file}")
        return output_file
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al descargar: {e}")
        print("\n💡 Sugerencia: Usa el dashboard HTML para descargar desde la API")
        print("   o exporta el CSV manualmente desde cursor.com")
        sys.exit(1)

def main():
    """Función principal."""
    parser = argparse.ArgumentParser(
        description='Analiza el uso de Cursor desde CSV o descarga desde la API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  # Analizar un CSV local:
  python analyze_cursor_usage.py usage-events-2025-11-06.csv
  
  # Descargar desde API y analizar:
  python analyze_cursor_usage.py --download --start 2025-10-01 --end 2025-11-06
  
  # Descargar desde API con rango por defecto (último mes):
  python analyze_cursor_usage.py --download
        """
    )
    
    parser.add_argument('csv_file', nargs='?', help='Ruta al archivo CSV de eventos')
    parser.add_argument('--download', '-d', action='store_true', 
                       help='Descargar CSV desde la API de Cursor')
    parser.add_argument('--start', type=str, 
                       help='Fecha de inicio (YYYY-MM-DD). Por defecto: hace 30 días')
    parser.add_argument('--end', type=str,
                       help='Fecha de fin (YYYY-MM-DD). Por defecto: hoy')
    parser.add_argument('--output', '-o', type=str,
                       help='Archivo de salida para el JSON de análisis')
    
    args = parser.parse_args()
    
    # Si se solicita descarga desde API
    if args.download:
        end_date = datetime.now()
        if args.end:
            end_date = datetime.strptime(args.end, '%Y-%m-%d')
        
        start_date = end_date - timedelta(days=30)
        if args.start:
            start_date = datetime.strptime(args.start, '%Y-%m-%d')
        
        csv_path = download_from_api(start_date, end_date)
    elif args.csv_file:
        csv_path = args.csv_file
    else:
        parser.print_help()
        sys.exit(1)
    
    if not Path(csv_path).exists():
        print(f"❌ Error: No se encontró el archivo {csv_path}")
        sys.exit(1)
    
    print(f"\n📊 Analizando {csv_path}...")
    
    try:
        analysis = analyze_cursor_usage(csv_path)
        
        # Guardar resultados en JSON
        if args.output:
            output_file = args.output
        else:
            output_file = Path(csv_path).stem + '_analysis.json'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Análisis completado!")
        print(f"📊 Estadísticas generales:")
        print(f"   - Total de eventos: {analysis['stats']['total_events']:,}")
        print(f"   - Costo total: ${analysis['stats']['total_cost']:.2f}")
        print(f"   - Uso del presupuesto: {analysis['stats']['usage_percentage']:.1f}%")
        print(f"   - Presupuesto restante: ${analysis['stats']['remaining_budget']:.2f}")
        print(f"   - Proyección mensual: ${analysis['projection']['projected_monthly_cost']:.2f}")
        print(f"\n📁 Resultados guardados en: {output_file}")
        
        return analysis
        
    except Exception as e:
        print(f"❌ Error durante el análisis: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

