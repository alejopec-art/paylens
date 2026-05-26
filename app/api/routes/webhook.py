import json
import os
import re
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Request, Response, HTTPException, Query
from app.core.config import settings
from app.core.security import verify_meta_signature
from app.core.supabase import get_supabase
from app.models.schemas import OCRResult
from app.services.whatsapp import iter_messages, download_media_bytes, send_message
from app.services.ocr.factory import get_ocr_service
from app.services.matching import match_payment

router = APIRouter()

def _dev_skip_media_download() -> bool:
    v = os.getenv("DEV_SKIP_MEDIA_DOWNLOAD", "").strip().lower()
    return v in {"1", "true", "yes", "y"}

def _compact_webhook(msg: dict, value: dict) -> dict:
    out = {
        "from": msg.get("from"),
        "id": msg.get("id"),
        "type": msg.get("type"),
        "timestamp": msg.get("timestamp"),
    }
    md = (value or {}).get("metadata") or {}
    if md:
        out["phone_number_id"] = md.get("phone_number_id")
        out["display_phone_number"] = md.get("display_phone_number")
    if msg.get("image"):
        out["media_id"] = (msg.get("image") or {}).get("id")
    if msg.get("text"):
        out["text"] = (msg.get("text") or {}).get("body")
    return out

def _get_existing_receipt_id(sb, message_id: str | None) -> str | None:
    if not sb or not message_id:
        return None
    try:
        res = sb.table("processed_receipts").select("id").eq("message_id", message_id).limit(1).execute()
        rows = res.data if hasattr(res, "data") else []
        if rows:
            return rows[0].get("id")
    except Exception:
        return None
    return None

def _parse_amount_from_text(text: str) -> Decimal | None:
    if not text:
        return None
    s = str(text).replace("$", "").replace(" ", "").replace("'", "").strip()
    m = re.search(r"(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)", s)
    if not m:
        return None
    amount_str = m.group(1)
    if "," in amount_str:
        if "." in amount_str:
            amount_str = amount_str.replace(".", "").replace(",", ".")
        else:
            parts = amount_str.split(",")
            if len(parts[-1]) == 3:
                amount_str = amount_str.replace(",", "")
            else:
                amount_str = amount_str.replace(",", ".")
    elif "." in amount_str:
        parts = amount_str.split(".")
        if len(parts[-1]) == 3:
            amount_str = amount_str.replace(".", "")
    try:
        return Decimal(amount_str)
    except Exception:
        return None

def _parse_reference_from_text(text: str) -> str | None:
    if not text:
        return None
    s = str(text).strip().upper()
    m = re.search(r"\b([A-Z]{1,3}\d{6,14})\b", s)
    if m:
        return m.group(1)
    m = re.search(r"\b(\d{6,12})\b", s)
    if m:
        return m.group(1)
    return None

def _attempt_match(sb, ocr: OCRResult, rec_id: str | None, wa_from: str | None, warnings: list):
    if not sb:
        return
    if not rec_id:
        return
    if ocr.amount is None and not ocr.reference:
        return
    m = match_payment(sb, ocr)
    if m.matched and m.bank_notification_id:
        try:
            sb.table("processed_receipts").update({
                "matched": True,
                "bank_notification_id": m.bank_notification_id,
            }).eq("id", rec_id).execute()
            sb.table("bank_notifications").update({
                "matched": True,
                "matched_receipt_id": rec_id,
            }).eq("id", m.bank_notification_id).execute()
            text = f"✅ ¡Pago verificado con éxito!\nMonto: ${ocr.amount}\nReferencia: {ocr.reference or 'N/A'}\nGracias por tu pago."
            if wa_from:
                send_message(wa_from, text)
        except Exception as e:
            print(f"Error actualizando match: {e}")
            warnings.append("Fallo actualizando matching en Supabase")
        return

    ref_parcial = (ocr.reference[-4:] if ocr.reference and len(ocr.reference) > 4 else "N/A")
    if m.reason == "FRAUDE_DUPLICADO":
        text = "🛑 *ALERTA DE SEGURIDAD*\nEsta referencia ya ha sido utilizada.\nSi considera que esto es un error, contacte soporte de inmediato."
    elif m.reason == "REVISION_MANUAL":
        text = f"⚠️ *REVISIÓN EN CURSO*\nNo pudimos validar tu pago automáticamente debido a una diferencia mínima en los datos.\nUn asesor revisará tu caso en breve.\nReferencia detectada: ***{ref_parcial}"
    else:
        text = f"⚠️ *NOTIFICACIÓN PAYLENS*\nNo pudimos validar tu pago automáticamente.\nUn asesor revisará tu caso en breve.\nReferencia detectada: ***{ref_parcial}"
    if wa_from:
        send_message(wa_from, text)

@router.get("/health")
def health():
    supa_url = (os.getenv("SUPABASE_URL", "") or "").strip()
    supa_host = ""
    supa_ref = ""
    try:
        from urllib.parse import urlparse
        supa_host = (urlparse(supa_url).hostname or "") if supa_url else ""
        m = re.search(r"^([a-z0-9]+)\.supabase\.co$", supa_host, re.IGNORECASE)
        if m:
            supa_ref = m.group(1)
    except Exception:
        supa_host = ""
        supa_ref = ""
    diag = {
        "supabase_url_set": bool((os.getenv("SUPABASE_URL", "") or "").strip()),
        "supabase_key_set": bool((os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or "").strip()),
        "supabase_key_looks_service_role": (os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or "").strip().startswith("sb_secret_"),
        "supabase_host": supa_host,
        "supabase_project_ref": supa_ref,
    }
    try:
        sb = get_supabase()
    except Exception as e:
        return {"ok": True, "supabase": "down", "error": str(e), "diag": diag}
    try:
        sb.table("bank_notifications").select("id").limit(1).execute()
        return {"ok": True, "supabase": "up", "diag": diag}
    except Exception as e:
        msg = str(e)
        if "Supabase REST 401" in msg:
            msg = msg + " (key incorrecta o de otro proyecto; usa service_role sb_secret_...)"
        return {"ok": True, "supabase": "down", "error": msg, "diag": diag}

@router.get("/whatsapp")
def verify_webhook(
    hub_mode: str = Query("", alias="hub.mode"),
    hub_verify_token: str = Query("", alias="hub.verify_token"),
    hub_challenge: str = Query("", alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.wa_verify_token and hub_challenge:
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verificación fallida")

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    raw = await request.body()
    sig = request.headers.get("X-Hub-Signature-256", "")
    enforce_sig = (settings.app_env or "").strip().lower() == "production" and not settings.wa_skip_signature
    if not verify_meta_signature(settings.wa_app_secret, raw, sig):
        if enforce_sig:
            raise HTTPException(status_code=401, detail="Firma inválida")
        print("FIRMA INVALIDA (saltada por configuración no-productiva)")

    try:
        payload = json.loads(raw.decode("utf-8")) if raw else {}
    except Exception:
        raise HTTPException(status_code=400, detail="JSON inválido")

    if payload and not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido (se esperaba objeto JSON)")

    sb = None
    sb_error = None
    try:
        sb = get_supabase()
    except Exception as e:
        sb = None
        sb_error = str(e)
    ocr_service = get_ocr_service()

    processed = 0
    warnings = []
    for msg, value in iter_messages(payload):
        processed += 1
        wa_from = msg.get("from")
        msg_id = msg.get("id")
        msg_type = msg.get("type")

        webhook_blob = payload if settings.store_raw_webhook else _compact_webhook(msg, value)
        receipt_row = {
            "whatsapp_from": wa_from,
            "message_id": msg_id,
            "raw_webhook": webhook_blob,
            "matched": False,
        }

        rec_id = None
        if msg_type == "image":
            media_id = (msg.get("image") or {}).get("id")
            receipt_row["media_id"] = media_id
            if media_id:
                img = b""
                caption = (msg.get("image") or {}).get("caption") or ""
                cap_amount = _parse_amount_from_text(caption)
                cap_ref = _parse_reference_from_text(caption)
                ocr = OCRResult(amount=cap_amount, reference=cap_ref, raw={"provider": "caption"}) if (cap_amount is not None or cap_ref) else None

                if ocr is None:
                    if not _dev_skip_media_download() and settings.wa_access_token:
                        try:
                            img = download_media_bytes(media_id)
                            print(f"Imagen descargada: {len(img)} bytes")
                        except Exception as e:
                            print(f"ERROR bajando imagen: {str(e)}")
                            warnings.append(f"No se pudo descargar media: {str(e)}")
                    ocr = ocr_service.extract(img)
                    print(f"OCR RESULT: Cantidad=${ocr.amount}, Ref={ocr.reference}")
                    if ocr.amount is None and not ocr.reference:
                        if wa_from:
                            send_message(
                                wa_from,
                                "⚠️ No pude leer el monto o la referencia en la foto.\n\nIntenta:\n- Enviar la foto más nítida (sin reflejos, acercada)\n- O escribe en un solo mensaje: MONTO + REFERENCIA\nEjemplo: 15000 ref 123456",
                            )

                receipt_row["ocr_amount"] = str(ocr.amount) if ocr.amount is not None else None
                receipt_row["ocr_date"] = ocr.date.isoformat() if ocr.date else None
                receipt_row["ocr_reference"] = ocr.reference
                receipt_row["raw_ocr"] = ocr.raw

                if sb:
                    try:
                        ins = sb.table("processed_receipts").insert(receipt_row).execute()
                        rec_id = (ins.data[0]["id"] if hasattr(ins, "data") and ins.data else None)
                    except Exception as e:
                        if "Supabase REST 409" in str(e) and "processed_receipts_message_id_uix" in str(e):
                            rec_id = _get_existing_receipt_id(sb, msg_id)
                        else:
                            print(f"Supabase insert error: {str(e)}")
                            warnings.append(f"Fallo escribiendo processed_receipts: {str(e)[:120]}")
                            sb_error = str(e)
                            sb = None

                _attempt_match(sb, ocr, rec_id, wa_from, warnings)
            else:
                if sb:
                    try:
                        sb.table("processed_receipts").insert(receipt_row).execute()
                    except Exception as e:
                        print(f"Supabase insert (no media): {str(e)}")
                        warnings.append(f"Fallo processed_receipts: {str(e)[:120]}")
        elif msg_type == "text":
            body = ((msg.get("text") or {}).get("body") or "")
            t_amount = _parse_amount_from_text(body)
            t_ref = _parse_reference_from_text(body)
            if t_amount is None and not t_ref:
                if wa_from:
                    send_message(
                        wa_from,
                        "✅ PayLens está activo.\n\nPara verificar un pago, envía la *foto del comprobante* o escribe en un solo mensaje:\nMONTO + REFERENCIA\nEjemplo: 15000 ref 123456",
                    )
            ocr = OCRResult(amount=t_amount, reference=t_ref, raw={"provider": "text"})
            receipt_row["ocr_amount"] = str(ocr.amount) if ocr.amount is not None else None
            receipt_row["ocr_reference"] = ocr.reference
            receipt_row["raw_ocr"] = ocr.raw
            if sb:
                try:
                    ins = sb.table("processed_receipts").insert(receipt_row).execute()
                    rec_id = (ins.data[0]["id"] if hasattr(ins, "data") and ins.data else None)
                except Exception as e:
                    if "Supabase REST 409" in str(e) and "processed_receipts_message_id_uix" in str(e):
                        rec_id = _get_existing_receipt_id(sb, msg_id)
                    else:
                        print(f"Supabase insert (text): {str(e)}")
                        warnings.append(f"Fallo processed_receipts: {str(e)[:120]}")
                        sb_error = str(e)
                        sb = None
            _attempt_match(sb, ocr, rec_id, wa_from, warnings)
        else:
            if sb:
                try:
                    sb.table("processed_receipts").insert(receipt_row).execute()
                except Exception as e:
                    print(f"Supabase insert (other type): {str(e)}")
                    warnings.append(f"Fallo processed_receipts: {str(e)[:120]}")

    out = {"ok": True, "processed": processed}
    if not sb:
        out["warning"] = "SUPABASE no configurado (se omitió escritura/matching)"
        if sb_error:
            out["supabase_error"] = sb_error
    if warnings:
        out["warnings"] = list(dict.fromkeys(warnings))
    return out

@router.get("/processed-receipts")
def get_processed_receipts(limit: int = 50):
    """
    Obtiene los últimos recibos procesados desde Supabase.
    """
    sb = get_supabase()
    if not sb:
        return []
    try:
        res = sb.table("processed_receipts").select(
            "id,created_at,whatsapp_from,message_id,media_id,ocr_amount,ocr_date,ocr_reference,matched,bank_notification_id"
        ).order("created_at", descending=True).limit(limit).execute()
        return res.data if hasattr(res, "data") else []
    except Exception as e:
        print(f"Error cargando recibos: {e}")
        return []

@router.get("/dashboard-stats")
def get_dashboard_stats():
    """
    Calcula estadísticas clave para el Dashboard Elite.
    """
    sb = get_supabase()
    if not sb:
        return {"score": 0, "totalVolume": 0, "fraudCount": 0, "todayTotal": 0, "todayCount": 0, "shifts": []}

    try:
        from datetime import datetime, timedelta, timezone
        from zoneinfo import ZoneInfo

        tz = ZoneInfo(settings.local_tz)
        now_local = datetime.now(tz)
        day_start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end_local = day_start_local + timedelta(days=1)
        day_start_utc = day_start_local.astimezone(timezone.utc).isoformat()
        day_end_utc = day_end_local.astimezone(timezone.utc).isoformat()

        base_q = sb.table("bank_notifications").select("amount,reference,payment_date,matched").eq("matched", True)
        res_today = base_q.gte("payment_date", day_start_utc).lt("payment_date", day_end_utc).limit(5000).execute()
        data_today = res_today.data if hasattr(res_today, "data") else []

        today_total = sum([float(r.get("amount") or 0) for r in data_today])
        today_count = len(data_today)
        refs = [r.get("reference") for r in data_today if r.get("reference")]
        duplicates = len(refs) - len(set(refs))

        shifts = []
        for i, part in enumerate((settings.shift_schedule or "").split(",")):
            part = part.strip()
            if not part:
                continue
            if "-" not in part:
                continue
            a, b = [x.strip() for x in part.split("-", 1)]
            try:
                sh, sm = [int(x) for x in a.split(":", 1)]
                eh, em = [int(x) for x in b.split(":", 1)]
            except Exception:
                continue

            s_local = day_start_local.replace(hour=sh, minute=sm)
            e_local = day_start_local.replace(hour=eh, minute=em) + timedelta(minutes=1)
            s_utc = s_local.astimezone(timezone.utc).isoformat()
            e_utc = e_local.astimezone(timezone.utc).isoformat()
            res_shift = base_q.gte("payment_date", s_utc).lt("payment_date", e_utc).limit(5000).execute()
            rows = res_shift.data if hasattr(res_shift, "data") else []
            shifts.append({
                "index": i,
                "start": s_local.isoformat(),
                "end": e_local.isoformat(),
                "total": sum([float(r.get("amount") or 0) for r in rows]),
                "count": len(rows),
            })

        return {
            "score": 100,
            "totalVolume": today_total,
            "fraudCount": duplicates,
            "todayTotal": today_total,
            "todayCount": today_count,
            "shifts": shifts,
        }
    except Exception as e:
        print(f"Error calculando stats: {e}")
        return {"score": 0, "totalVolume": 0, "fraudCount": 0, "todayTotal": 0, "todayCount": 0, "shifts": []}

@router.post("/bank-notification")
async def bank_notification(request: Request):
    """
    Endpoint para recibir notificaciones de bancos (vía Zapier, Make o App SMS).
    Se espera un JSON con: bank, amount, reference, currency, date.
    """
    try:
        data = await request.json()
        print(f"PAYLOAD RECIBIDO DEL BANCO: {data}")
    except Exception:
        raise HTTPException(status_code=400, detail="JSON inválido")

    # Mapeo de campos (normalización)
    bank = data.get("bank", "Desconocido")
    
    # Manejo robusto de amount
    amount_raw = data.get("amount")
    if amount_raw is None or str(amount_raw).lower() == "none":
        amount_val = 0.0
    else:
        # Convertir a string y limpiar
        amount_str = str(amount_raw).replace("$", "").replace(" ", "").replace("'", "").strip()
        try:
            # Lógica para manejar el formato de moneda colombiano (9.200 -> 9200)
            # Primero quitamos los puntos que actúan como separadores de miles
            # Si hay una coma, es probable que sea el separador decimal
            if "," in amount_str:
                if "." in amount_str:
                    # Caso 1.234,56 -> 1234.56
                    amount_val = float(amount_str.replace(".", "").replace(",", "."))
                else:
                    # Caso 1234,56 -> 1234.56 o 1,234 -> 1234 (depende del contexto)
                    parts = amount_str.split(",")
                    if len(parts[-1]) == 3: # Probablemente miles: 1,000
                        amount_val = float(amount_str.replace(",", ""))
                    else: # Probablemente decimal: 1,50
                        amount_val = float(amount_str.replace(",", "."))
            elif "." in amount_str:
                # Caso 1.234 -> 1234 o 1.23 -> 1.23
                parts = amount_str.split(".")
                if len(parts[-1]) == 3: # Probablemente miles: 1.000
                    amount_val = float(amount_str.replace(".", ""))
                else: # Probablemente decimal: 1.50
                    amount_val = float(amount_str)
            else:
                amount_val = float(amount_str)
        except Exception as e:
            print(f"Error parseando monto '{amount_raw}': {e}")
            amount_val = 0.0

    reference = data.get("reference")
    # Si no hay referencia, intentamos buscarla en el cuerpo si viene como 'text' o 'body'
    if not reference:
        body_text = data.get("text") or data.get("body") or ""
        # Buscar patrones comunes de referencia (M0123456, etc)
        ref_match = re.search(r"\b([A-Z]{1,3}\d{6,14})\b", str(body_text))
        if ref_match:
            reference = ref_match.group(1)

    currency = data.get("currency", "COP")
    payment_date = data.get("date") or data.get("payment_date") or datetime.utcnow().isoformat()

    if not amount_val and not reference:
        print("ADVERTENCIA: Notificación sin monto ni referencia válida")
        return {"ok": False, "error": "No se detectó monto ni referencia"}

    # Guardar en Supabase
    sb = get_supabase()
    if not sb:
        print("ERROR: Supabase no configurado en bank_notification")
        return {"ok": False, "error": "Supabase no configurado"}

    try:
        row = {
            "bank": bank,
            "amount": amount_val,
            "reference": str(reference) if reference else None,
            "currency": currency,
            "payment_date": payment_date,
            "raw_payload": data,
            "matched": False
        }
        sb.table("bank_notifications").insert(row).execute()
        print(f"NOTIFICACIÓN GUARDADA EXITOSAMENTE: {bank} - ${amount_val} - Ref: {reference}")
        return {"ok": True}
    except Exception as e:
        print(f"Error crítico guardando en Supabase: {e}")
        # Retornamos 200 para que Pipedream no marque error, pero logueamos el fallo
        return {"ok": False, "error": str(e)}
