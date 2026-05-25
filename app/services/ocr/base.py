import os
from datetime import date
from decimal import Decimal
from app.models.schemas import OCRResult

class OCRService:
    def extract(self, image_bytes: bytes) -> OCRResult:
        amount = os.getenv("DEV_OCR_AMOUNT", "").strip()
        ref = os.getenv("DEV_OCR_REFERENCE", "").strip()
        dt = os.getenv("DEV_OCR_DATE", "").strip()

        parsed_amount = Decimal(amount) if amount else None
        parsed_date = date.fromisoformat(dt) if dt else None
        parsed_ref = ref or None

        if parsed_amount is not None or parsed_ref is not None or parsed_date is not None:
            return OCRResult(amount=parsed_amount, date=parsed_date, reference=parsed_ref, raw={"provider": "dev-env"})

        return OCRResult(raw={"provider": "base"})
