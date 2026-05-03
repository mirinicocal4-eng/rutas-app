import pdfplumber
import json
import re
import requests
from bs4 import BeautifulSoup
import os
import tempfile

url = "https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Tramite/1285524936298/Tramite"
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "data", "rutas.json")

def clean_text(text):
    if not text:
        return ""
    # Remove newlines and extra spaces
    return re.sub(r'\s+', ' ', text).strip()

def download_pdf():
    print(f"Obteniendo página: {url}")
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Buscar el enlace que contiene "Rutas bonificadas" o similar
    pdf_link = None
    for a in soup.find_all('a', href=True):
        if "Rutas bonificadas" in a.text and ".pdf" in a['href'].lower():
            pdf_link = a['href']
            break
        elif "Rutas bonificadas" in a.text:
             pdf_link = a['href']
             break
            
    if not pdf_link:
        raise Exception("No se encontró el enlace al PDF de rutas bonificadas.")
        
    if not pdf_link.startswith('http'):
        pdf_link = "https://www.tramitacastillayleon.jcyl.es" + pdf_link
        
    print(f"Descargando PDF desde: {pdf_link}")
    pdf_response = requests.get(pdf_link)
    pdf_response.raise_for_status()
    
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    with os.fdopen(fd, 'wb') as f:
        f.write(pdf_response.content)
        
    return temp_path

def main():
    pdf_path = download_pdf()
    
    data = []
    
    # Column indices
    RUTA_IDX = 0
    PROVINCIA_IDX = 1
    CONCESION_IDX = 2
    OPERADOR_IDX = 3
    TIPO_IDX = 4
    
    print(f"Abriendo PDF: {pdf_path}")
    
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            print(f"Procesando página {i+1}/{total_pages}")
            table = page.extract_table()
            if table:
                for row in table:
                    if not row or len(row) < 5:
                        continue
                    
                    # Check if it's a header row
                    if "RUTA" in str(row[RUTA_IDX]).upper():
                        continue
                    
                    ruta = clean_text(row[RUTA_IDX])
                    provincia = clean_text(row[PROVINCIA_IDX])
                    operador = clean_text(row[OPERADOR_IDX])
                    tipo = clean_text(row[TIPO_IDX])
                    
                    if ruta and provincia:
                        data.append({
                            "ruta": ruta,
                            "provincia": provincia,
                            "operador": operador,
                            "tipo": tipo
                        })

    print(f"Total de rutas extraídas: {len(data)}")

    # Categorize by Province -> Operador -> Rutas
    categorized = {}
    
    for item in data:
        prov = item["provincia"].upper()
        op = item["operador"]
        ruta = item["ruta"]
        
        if prov not in categorized:
            categorized[prov] = {}
            
        if op not in categorized[prov]:
            categorized[prov][op] = []
            
        categorized[prov][op].append({"nombre": ruta, "tipo": item["tipo"]})

    # Create src/data dir if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(categorized, f, ensure_ascii=False, indent=2)

    print(f"Datos guardados en {output_path}")
    
    # Clean up
    os.remove(pdf_path)

if __name__ == "__main__":
    main()
