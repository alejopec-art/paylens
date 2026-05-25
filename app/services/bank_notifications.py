from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.services.bank_relay import BankNotification, BankRelayService
from app.services.whatsapp import send_message
from app.core.config import settings


def _now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _format_amount(amount: float) -> str:
    try:
        return f"{float(amount):,.0f}".replace(",", ".")
    except Exception:
        return str(amount)


def format_ticket_elite(n: BankNotification) -> str:
    monto_fmt = _format_amount(float(n.amount))
    nombre = n.sender_name or "Cliente"
    ref = n.reference or "N/A"
    return (
        "✅ *TICKET DIGITAL ELITE*\n\n"
        f"🏦 *Banco:* {n.bank}\n"
        f"💰 *Monto:* ${monto_fmt}\n"
        f"👤 *De:* {nombre}\n"
        f"🆔 *Ref:* {ref}\n"
        f"🕒 *Hora:* {_now_utc_iso()}\n\n"
        "🔒 *VERIFICADO (FUENTE REAL)*"
    )


def _dedupe_by_reference(sb, reference: str) -> bool:
    if not reference:
        return False
    try:
        res = sb.table("bank_notifications").select("id").eq("reference", reference).limit(1).execute()
        rows = res.data if hasattr(res, "data") else []
        return bool(rows)
    except Exception:
        return False


def insert_bank_notification_and_broadcast(
    sb,
    notification: BankNotification,
    source: str,
    raw_payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    ref = (notification.reference or "").strip()
    if ref and _dedupe_by_reference(sb, ref):
        return {"status": "ignored", "message": "duplicado", "reference": ref}

    dt = notification.payment_date
    if dt and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    row = {
        "bank": notification.bank,
        "amount": float(notification.amount),
        "reference": notification.reference,
        "payment_date": dt.astimezone(timezone.utc).isoformat() if dt else _now_utc_iso(),
        "raw_payload": raw_payload or {},
        "matched": True,
    }
    try:
        sb.table("bank_notifications").insert(row).execute()
    except Exception as e:
        return {"status": "error", "message": str(e)}

    if settings.wa_group_id:
        send_message(settings.wa_group_id, format_ticket_elite(notification))

    return {"status": "success", "reference": notification.reference}


def parse_nequi_text(raw_text: str, sender: str = "") -> Optional[BankNotification]:
    n = BankRelayService.parse_notification(raw_text or "", sender or "")
    if not n:
        return None
    if (n.bank or "").strip().lower() != "nequi":
        return None
    return n
