import os
from app.core.config import settings
from app.services.ocr.base import OCRService
from app.services.ocr.google_vision import GoogleVisionOCR

def get_ocr_service() -> OCRService:
    provider = (settings.ocr_provider or "").strip().lower()
    if not provider or provider in {"base", "stub"}:
        if (os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "") or "").strip() or (os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON", "") or "").strip() or (os.getenv("GOOGLE_CREDS_JSON", "") or "").strip():
            provider = "google"
        else:
            provider = "base"
    if provider == "google":
        return GoogleVisionOCR()
    if provider in {"base", "stub"}:
        return OCRService()
    raise RuntimeError(f"OCR_PROVIDER no soportado: {provider}")
