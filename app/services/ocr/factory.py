from app.core.config import settings
from app.services.ocr.base import OCRService
from app.services.ocr.google_vision import GoogleVisionOCR

def get_ocr_service() -> OCRService:
    provider = (settings.ocr_provider or "base").lower()
    if provider == "google":
        return GoogleVisionOCR()
    if provider in {"base", "stub"}:
        return OCRService()
    raise RuntimeError(f"OCR_PROVIDER no soportado: {provider}")