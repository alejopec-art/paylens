import re
import time
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel

class BankNotification(BaseModel):
    bank: str
    amount: Decimal
    reference: str
    payment_date: datetime
    raw_text: str
    sender_name: Optional[str] = None

class BankRelayService:
    @staticmethod
    def parse_notification(raw_text: str, sender: str = "") -> Optional[BankNotification]:
        """
        Analiza el texto de un correo/notificación bancaria y extrae los datos clave.
        """
        # Normalización de texto y sender
        text = raw_text.replace("\n", " ").replace("\r", " ").replace("\t", " ")
        if isinstance(sender, dict):
            sender = sender.get("address", str(sender))
        
        print(f"DEBUG RELAY: Emisor={sender}")
        print(f"DEBUG RELAY: Texto={text[:150]}...")

        # --- PATRÓN NEQUI (Oficial / Bre-B Universal) ---
        nequi_match = re.search(r"Recibiste\s+([\d\.,]+)\s+de\s+(.*?)\s+el", text, re.IGNORECASE)
        if not nequi_match:
            nequi_match = re.search(r"¡Te transfirieron!\s+(.*?)\s+te envió\s+\$([\d\.,]+)", text, re.IGNORECASE)
            if nequi_match:
                sender_name = nequi_match.group(1).strip()
                amount_str = nequi_match.group(2).replace(".", "").replace(",", ".")
            else:
                sender_name = None
                amount_str = None
        else:
            amount_str = nequi_match.group(1).replace(".", "").replace(",", ".")
            sender_name = nequi_match.group(2).strip()

        if amount_str and sender_name:
            try:
                sender_name = sender_name.split(" el ")[0].split(".")[0].strip()
                ref_match = re.search(r"Ref:\s*(\d+)", text, re.IGNORECASE)
                ref = ref_match.group(1) if ref_match else f"NEQUI-{int(time.time())}"
                
                return BankNotification(
                    bank="Nequi",
                    amount=Decimal(amount_str),
                    reference=ref,
                    payment_date=datetime.now(),
                    raw_text=raw_text,
                    sender_name=sender_name
                )
            except Exception as e:
                print(f"DEBUG RELAY: Error parsing Nequi: {e}")

        # --- PATRÓN BANCOLOMBIA ---
        banco_match = re.search(r"Bancolombia.*\$([\d\.,]+).*Ref:\s*(\d+)", text, re.IGNORECASE)
        if banco_match:
            try:
                amount_str = banco_match.group(1).replace(".", "").replace(",", ".")
                ref = banco_match.group(2)
                return BankNotification(
                    bank="Bancolombia",
                    amount=Decimal(amount_str),
                    reference=ref,
                    payment_date=datetime.now(),
                    raw_text=raw_text
                )
            except Exception: pass

        return None

    @staticmethod
    def dispatch_direct_notification(notification: BankNotification):
        """
        Envía una notificación profesional al grupo de WhatsApp configurado.
        """
        from app.services.whatsapp import send_message
        from app.core.config import settings

        if not settings.wa_group_id:
            print("SRE WARN: WHATSAPP_GROUP_ID no configurado. Se omite despacho.")
            return

        monto_fmt = f"{float(notification.amount):,.0f}".replace(",", ".")
        nombre = notification.sender_name or "Cliente Desconocido"
        
        msg = (
            "🚀 *¡DINERO ENTRANTE DETECTADO!*\n\n"
            f"💰 *Monto:* ${monto_fmt}\n"
            f"👤 *De:* {nombre}\n"
            f"🆔 *Ref:* {notification.reference}\n\n"
            "✅ _Validado automáticamente por PayLens Elite System_"
        )
        
        send_message(settings.wa_group_id, msg)

    @staticmethod
    async def process_webhook(sb, payload: Dict[str, Any]):
        """
        Procesa el webhook de Pipedream e inserta en Supabase.
        """
        if not sb:
            return {"status": "error", "message": "Supabase no configurado"}

        raw_content = payload.get("text", payload.get("body", ""))
        sender_raw = payload.get("from", "")
        
        notification = BankRelayService.parse_notification(raw_content, sender_raw)
        
        if notification:
            # Detección inteligente de remitente oficial
            sender_str = str(sender_raw).lower()
            text_str = raw_content.lower()
            
            # Es directo si viene del correo oficial O si tiene la cabecera oficial de Bre-B
            is_direct = (
                "notificaciones@nequi.com.co" in sender_str or 
                "recibiste plata por bre-b" in text_str or
                "transfirieron" in text_str
            )
            
            data = {
                "bank": notification.bank,
                "amount": float(notification.amount),
                "reference": notification.reference,
                "payment_date": notification.payment_date.isoformat(),
                "raw_payload": {"text": notification.raw_text},
                "matched": is_direct
            }
            
            try:
                sb.table("bank_notifications").insert(data).execute()
            except Exception as e:
                print(f"SRE ERROR: Supabase: {e}")

            if is_direct:
                BankRelayService.dispatch_direct_notification(notification)
                event_type = "DIRECT_BANK_VALIDATION"
                details = f"Notificación de {notification.sender_name} enviada a WhatsApp"
            else:
                event_type = "BANK_NOTIFICATION_RECEIVED"
                details = f"Notificación manual de {notification.bank}"

            try:
                sb.table("system_audit_logs").insert({
                    "event": event_type,
                    "reference": notification.reference,
                    "details": details
                }).execute()
            except Exception: pass
            
            return {"status": "success", "message": "Procesado"}
        else:
            return {"status": "ignored", "message": "No se reconoció patrón"}
