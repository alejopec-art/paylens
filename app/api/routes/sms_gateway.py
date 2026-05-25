from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings
from app.core.supabase import get_supabase
from app.services.bank_notifications import parse_nequi_text, insert_bank_notification_and_broadcast

router = APIRouter()


@router.post("/sms-gateway")
async def sms_gateway(request: Request):
    token = request.headers.get("X-SMS-Token", "")
    enforce = (settings.app_env or "").strip().lower() == "production"
    if settings.sms_gateway_token:
        if token != settings.sms_gateway_token:
            raise HTTPException(status_code=401, detail="Token inválido")
    elif enforce:
        raise HTTPException(status_code=500, detail="SMS_GATEWAY_TOKEN no configurado")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="JSON inválido")

    body = (payload.get("body") or payload.get("text") or payload.get("message") or "").strip()
    sender = str(payload.get("from") or payload.get("sender") or payload.get("phone") or "")
    if not body:
        raise HTTPException(status_code=400, detail="body requerido")

    n = parse_nequi_text(body, sender)
    if not n:
        return {"status": "ignored", "message": "no-nequi"}

    sb = get_supabase()
    return insert_bank_notification_and_broadcast(
        sb,
        n,
        source="sms",
        raw_payload={"source": "sms", "from": sender},
    )
