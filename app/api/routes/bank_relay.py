from fastapi import APIRouter, Request, Depends, HTTPException
from app.services.bank_relay import BankRelayService
from app.core.supabase import get_supabase
import logging

router = APIRouter()

@router.post("/notify")
async def receive_bank_notification(request: Request):
    """
    Endpoint para recibir webhooks de parsers de correo (Pipedream, SendGrid, etc.)
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Payload JSON inválido")

    try:
        sb = get_supabase()
    except Exception as e:
        return {"status": "error", "message": str(e)}
    result = await BankRelayService.process_webhook(sb, payload)
    return result

@router.get("/status")
async def relay_status():
    return {"status": "active", "service": "BankRelayService"}
