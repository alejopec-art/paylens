import re
import os
import io
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any

try:
    from google.cloud import vision
except ImportError:
    vision = None

from app.models.schemas import OCRResult
from app.services.ocr.base import OCRService

class GoogleVisionOCR(OCRService):
    """
    Servicio de OCR avanzado utilizando Google Cloud Vision API.
    Optimizado para capturas de pantalla de bancos colombianos (Nequi, Bancolombia, Daviplata).
    """

    def __init__(self):
        # La variable de entorno GOOGLE_APPLICATION_CREDENTIALS debe estar configurada.
        # Si existe el archivo de credenciales en core, lo configuramos por defecto.
        creds_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "core", "google_creds.json")
        if os.path.exists(creds_path) and not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path
        
        try:
            self.client = vision.ImageAnnotatorClient()
            if self.client: print("Google Vision Client: INICIALIZADO")
        except Exception as e:
            print(f"ERROR inicializando Google Vision: {str(e)}")
            self.client = None

    def extract(self, image_bytes: bytes) -> OCRResult:
        if not image_bytes:
            return OCRResult(raw={"error": "No image bytes provided"})
        
        if self.client is None:
            print("ERROR: Cliente de Google Vision no existe (revisa credenciales)")
            return OCRResult(raw={"error": "Google Vision Client not initialized."})

        try:
            image = vision.Image(content=image_bytes)
            response = self.client.text_detection(image=image)
            
            if response.error.message:
                print(f"ERROR de Google API: {response.error.message}")
                return OCRResult(raw={"error": response.error.message})

            texts = response.text_annotations
            if not texts:
                print("ADVERTENCIA: Google Vision no detectó ningún texto en la imagen")
                return OCRResult(raw={"error": "No text detected"})

            # El primer elemento contiene todo el texto detectado
            full_text = texts[0].description
            # print("-" * 30)
            # print(f"EL ROBOT ESTÁ LEYENDO ESTO:\n{full_text}")
            # print("-" * 30)

            extracted_data = self._parse_text(full_text)

            raw_meta = {"provider": "google_vision"}
            try:
                from app.core.config import settings
                if settings.store_ocr_text:
                    raw_meta["full_text"] = full_text
            except Exception:
                pass

            return OCRResult(
                amount=extracted_data.get("amount"),
                date=extracted_data.get("date"),
                reference=extracted_data.get("reference"),
                raw=raw_meta
            )

        except Exception as e:
            print(f"ERROR crítico en procesamiento OCR: {str(e)}")
            return OCRResult(raw={"error": str(e)})

    def _parse_text(self, text: str) -> Dict[str, Any]:
        """
        Extrae datos usando expresiones regulares optimizadas para bancos colombianos.
        """
        data = {
            "amount": None,
            "date": None,
            "reference": None
        }

        # 1. Extraer MONTO (Súper agresivo para Nequi/Bre-B/Daviplata)
        amount_patterns = [
            r"(?:¿?Cu[aá]nto\??|Valor|Monto|Total|Cantidad)\s*[:\?]?\s*\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)",
            r"\$\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)",
            r"(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)",
            r"(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)",
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                val_str = match.group(1)
                # Lógica robusta para montos:
                # Si tiene coma y punto, el último es el decimal
                if "," in val_str and "." in val_str:
                    if val_str.rfind(",") > val_str.rfind("."):
                        # Coma es decimal: 1.234,56 -> 1234.56
                        val_str = val_str.replace(".", "").replace(",", ".")
                    else:
                        # Punto es decimal: 1,234.56 -> 1234.56
                        val_str = val_str.replace(",", "")
                elif "," in val_str:
                    # Solo coma: si tiene 2 decimales al final, es decimal. Si no, miles.
                    if re.search(r",\d{2}$", val_str):
                        val_str = val_str.replace(",", ".")
                    else:
                        val_str = val_str.replace(",", "")
                elif "." in val_str:
                    # Solo punto: si tiene 2 decimales al final, es decimal. Si no, miles.
                    if re.search(r"\.\d{2}$", val_str):
                        pass # ya es punto
                    else:
                        val_str = val_str.replace(".", "")
                
                try:
                    data["amount"] = Decimal(val_str)
                    break
                except:
                    continue

        # 2. Extraer REFERENCIA (Más patrones colombianos)
        # Patrones ordenados por especificidad: etiquetas primero, luego formatos conocidos
        _PHONE_RE = re.compile(r"^(57)?3\d{9}$")  # Evitar capturar teléfonos colombianos
        ref_patterns = [
            r"(?:Referencia|Comprobante|ID de\s+\w+|Ref\.?|Aprobaci[oó]n|Autorizaci[oó]n|C[oó]digo|Transacci[oó]n)\s*[:#]?\s*([A-Z]*\d+[A-Z0-9]*)",
            r"\b([A-Z]{1,3}\d{6,14})\b",  # Nequi: M01485058, Bancolombia: BC12345678
            r"\b(\d{6,12})\b",             # Numérico puro (6-12 dígitos)
        ]

        for pattern in ref_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                candidate = match.group(1)
                if not _PHONE_RE.match(candidate):
                    data["reference"] = candidate
                    break

        # 3. Extraer FECHA
        date_patterns = [
            r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            r"(\d{1,2})\s?de\s?([a-zA-Z]+)\s?de\s?(\d{4})"
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 1:
                    try:
                        dstr = match.group(1).replace("-", "/")
                        p = dstr.split("/")
                        data["date"] = date(int(p[2]) if int(p[2])>100 else int(p[2])+2000, int(p[1]), int(p[0]))
                        break
                    except: continue
                else:
                    try:
                        ms = {"enero":1,"febrero":2,"marzo":3,"abril":4,"mayo":5,"junio":6,"julio":7,"agosto":8,"septiembre":9,"octubre":10,"noviembre":11,"diciembre":12}
                        if match.group(2).lower() in ms:
                            data["date"] = date(int(match.group(3)), ms[match.group(2).lower()], int(match.group(1)))
                            break
                    except: continue

        return data
