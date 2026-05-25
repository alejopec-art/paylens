from decimal import Decimal
from datetime import datetime
from typing import Tuple, Optional
from app.models.schemas import OCRResult, MatchResult

def _to_decimal(x):
    if x is None:
        return None
    if isinstance(x, Decimal):
        return x
    return Decimal(str(x))

def _log_audit(sb, event: str, reference: str = None, details: str = ""):
    try:
        sb.table("system_audit_logs").insert({
            "event": event,
            "reference": reference,
            "details": details,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Error escribiendo log de auditoría: {e}")

def match_payment(sb, ocr: OCRResult, amount_tolerance: Decimal = Decimal("500.00")) -> MatchResult:
    """
    Motor de Conciliación Avanzado con Detección de Fraude y Tolerancia.
    """
    if not ocr.amount and not ocr.reference:
        return MatchResult(matched=False, reason="OCR sin datos legibles")

    # 1. Detección de Fraude (Duplicados)
    if ocr.reference:
        ref_clean = ocr.reference.strip().upper()
        check_dup = sb.table("processed_receipts")\
            .select("id")\
            .eq("ocr_reference", ref_clean)\
            .eq("matched", True)\
            .execute()
        
        if hasattr(check_dup, "data") and check_dup.data:
            _log_audit(sb, "FRAUDE_DUPLICADO", ref_clean, "Referencia ya procesada anteriormente.")
            return MatchResult(matched=False, reason="FRAUDE_DUPLICADO")

    # 2. Búsqueda de coincidencia exacta o cercana en bank_notifications
    q = sb.table("bank_notifications").select("id,amount,payment_date,reference").eq("matched", False)
    res = q.limit(100).execute()
    rows = (res.data or []) if hasattr(res, "data") else []

    if not rows:
        return MatchResult(matched=False, reason="No hay notificaciones bancarias pendientes.")

    o_amount = _to_decimal(ocr.amount)
    
    best_candidate = None
    manual_review_needed = False

    for r in rows:
        r_amount = _to_decimal(r.get("amount"))
        r_ref = (r.get("reference") or "").strip().upper()
        
        # Match Exacto de Referencia
        ref_match = False
        if ocr.reference:
            o_ref = ocr.reference.strip().upper()
            if o_ref == r_ref or (len(o_ref) > 4 and o_ref in r_ref):
                ref_match = True

        # Match de Monto con Tolerancia
        amount_exact = False
        amount_close = False
        if o_amount is not None and r_amount is not None:
            diff = abs(o_amount - r_amount)
            if diff == 0:
                amount_exact = True
            elif diff <= amount_tolerance:
                amount_close = True

        # Lógica de Decisión
        if ref_match and amount_exact:
            _log_audit(sb, "MATCH_SUCCESS", r_ref, f"Coincidencia exacta: ${o_amount}")
            return MatchResult(matched=True, bank_notification_id=r["id"])
        
        if amount_exact and not ref_match:
            # Si el monto es exacto pero no hay referencia, marcamos para revisión manual
            # o aceptamos si la fecha es muy cercana (esto se puede ampliar)
            best_candidate = r["id"]
            manual_review_needed = True

        if ref_match and amount_close:
            _log_audit(sb, "MANUAL_REVIEW_SUGGESTED", r_ref, f"Referencia coincide pero monto difiere por ${abs(o_amount-r_amount)}")
            best_candidate = r["id"]
            manual_review_needed = True

    if manual_review_needed and best_candidate:
        return MatchResult(matched=False, reason="REVISION_MANUAL", bank_notification_id=best_candidate)

    return MatchResult(matched=False, reason="No se encontró coincidencia con los datos bancarios.")