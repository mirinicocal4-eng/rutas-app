import hashlib
import json
import os
import re
import tempfile
import traceback
from typing import Dict, List, Optional

import pdfplumber
import requests
from bs4 import BeautifulSoup

# URL of the page containing the PDF link
URL = (
    "https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/"
    "Plantilla100Detalle/1251181050732/Tramite/1285524936298/Tramite"
)

# Absolute paths for output and checksum
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(
    BASE_DIR, "src", "data", "rutas.json"
)
CHECKSUM_PATH = os.path.join(
    BASE_DIR, "src", "data", "checksum.txt"
)


def get_file_hash(file_path: str) -> str:
    """Calculate SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        # Read in chunks to be memory efficient
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def clean_text(text: Optional[str]) -> str:
    """Clean text by removing extra whitespaces and newlines."""
    if not text:
        return ""
    # Remove newlines and extra spaces
    return re.sub(r"\s+", " ", text).strip()


def download_pdf() -> str:
    """
    Search for the PDF link on the page and download it to a temporary file.
    """
    print(f"Obteniendo pÃ¡gina: {URL}")
    try:
        response = requests.get(URL, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        raise RuntimeError(f"Error al acceder a la pÃ¡gina: {e}") from e

    soup = BeautifulSoup(response.content, "html.parser")

    # Buscar el enlace que contiene "Rutas bonificadas" o similar
    pdf_link: Optional[str] = None
    for a in soup.find_all("a", href=True):
        link_text = a.get_text()
        if "Rutas bonificadas" in link_text:
            href = a["href"]
            # Ensure href is a string (BS4 can return list for multi-valued)
            if isinstance(href, list):
                pdf_link = href[0]
            else:
                pdf_link = href
            break

    if pdf_link is None:
        raise ValueError(
            "No se encontrÃ³ el enlace al PDF de rutas bonificadas en la pÃ¡gina."
        )

    # After this point, pdf_link is guaranteed to be a string
    full_url = pdf_link
    if not full_url.startswith("http"):
        full_url = "https://www.tramitacastillayleon.jcyl.es" + full_url

    print(f"Descargando PDF desde: {full_url}")
    try:
        pdf_response = requests.get(full_url, timeout=60)
        pdf_response.raise_for_status()
    except requests.RequestException as e:
        raise RuntimeError(f"Error al descargar el PDF: {e}") from e

    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(pdf_response.content)
    except Exception as e:
        os.close(fd)
        raise RuntimeError(
            f"Error al escribir el archivo temporal: {e}"
        ) from e

    return temp_path


def main() -> None:
    """Main execution function."""
    temp_pdf_path = None
    try:
        temp_pdf_path = download_pdf()

        # --- Checksum logic ---
        new_hash = get_file_hash(temp_pdf_path)
        old_hash = ""

        if os.path.exists(CHECKSUM_PATH):
            with open(CHECKSUM_PATH, "r", encoding="utf-8") as f:
                old_hash = f.read().strip()

        if new_hash == old_hash:
            print(
                f"El Checksum ({new_hash}) coincide. "
                "El PDF no ha cambiado. Terminando robot."
            )
            return

        print(f"Nuevo Checksum detectado: {new_hash}. Iniciando extracciÃ³n...")

        data: List[Dict[str, str]] = []

        # Column indices
        ruta_idx = 0
        provincia_idx = 1
        # concesion_idx = 2  # Unused
        operador_idx = 3
        tipo_idx = 4

        print(f"Abriendo PDF: {temp_pdf_path}")

        with pdfplumber.open(temp_pdf_path) as pdf:
            total_pages = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                print(f"Procesando pÃ¡gina {i+1}/{total_pages}")
                table = page.extract_table()
                if table:
                    for row in table:
                        if not row or len(row) < 5:
                            continue

                        # Check if it's a header row
                        if "RUTA" in str(row[ruta_idx]).upper():
                            continue

                        ruta_val = clean_text(row[ruta_idx])
                        prov_val = clean_text(row[provincia_idx])
                        oper_val = clean_text(row[operador_idx])
                        tipo_val = clean_text(row[tipo_idx])

                        if ruta_val and prov_val:
                            data.append(
                                {
                                    "ruta": ruta_val,
                                    "provincia": prov_val,
                                    "operador": oper_val,
                                    "tipo": tipo_val,
                                }
                            )

        print(f"Total de rutas extraÃ­das: {len(data)}")

        # Categorize by Province -> Operador -> Rutas
        categorized: Dict[str, Dict[str, List[Dict[str, str]]]] = {}

        for item in data:
            prov = item["provincia"].upper()
            op = item["operador"]
            ruta = item["ruta"]

            if prov not in categorized:
                categorized[prov] = {}

            if op not in categorized[prov]:
                categorized[prov][op] = []

            categorized[prov][op].append(
                {"nombre": ruta, "tipo": item["tipo"]}
            )

        # Create src/data dir if it doesn't exist
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(categorized, f, ensure_ascii=False, indent=2)

        print(f"Datos guardados en {OUTPUT_PATH}")

        # Save the new checksum
        with open(CHECKSUM_PATH, "w", encoding="utf-8") as f:
            f.write(new_hash)
        print(f"Checksum actualizado: {new_hash}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        traceback.print_exc()
    finally:
        # Clean up temp file
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
            except Exception as e:
                print(
                    f"Warning: Could not remove temp file {temp_pdf_path}: {e}"
                )



if __name__ == "__main__":
    main()
