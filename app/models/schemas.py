from pydantic import BaseModel
from typing import Any, Optional
import datetime
from decimal import Decimal

class OCRResult(BaseModel):
    amount: Optional[Decimal] = None
    date: Optional[datetime.date] = None
    reference: Optional[str] = None
    raw: Optional[Any] = None

class MatchResult(BaseModel):
    matched: bool
    bank_notification_id: Optional[str] = None
    reason: Optional[str] = None