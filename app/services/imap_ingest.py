from __future__ import annotations

import imaplib
import re
import time
from email import policy
from email.message import Message
from email.parser import BytesParser
from typing import Optional, Tuple

from app.core.config import settings
from app.core.supabase import get_supabase
from app.services.bank_notifications import parse_nequi_text, insert_bank_notification_and_broadcast


def _decode_body(msg: Message) -> str:
    if msg.is_multipart():
        parts = []
        for part in msg.walk():
            ctype = (part.get_content_type() or "").lower()
            disp = (part.get("Content-Disposition") or "").lower()
            if "attachment" in disp:
                continue
            if ctype in {"text/plain", "text/html"}:
                try:
                    parts.append(part.get_content())
                except Exception:
                    try:
                        payload = part.get_payload(decode=True) or b""
                        parts.append(payload.decode(errors="ignore"))
                    except Exception:
                        pass
        return "\n".join([p for p in parts if p])
    try:
        return msg.get_content() or ""
    except Exception:
        payload = msg.get_payload(decode=True) or b""
        return payload.decode(errors="ignore")


def _strip_html(s: str) -> str:
    if "<" not in s and ">" not in s:
        return s
    s = re.sub(r"(?is)<(script|style).*?>.*?</\\1>", " ", s)
    s = re.sub(r"(?is)<.*?>", " ", s)
    s = re.sub(r"\\s+", " ", s)
    return s.strip()


def _connect() -> imaplib.IMAP4_SSL:
    if not settings.imap_user or not settings.imap_password:
        raise RuntimeError("IMAP_USER e IMAP_PASSWORD son requeridos")
    m = imaplib.IMAP4_SSL(settings.imap_host, settings.imap_port)
    m.login(settings.imap_user, settings.imap_password)
    m.select("INBOX")
    return m


def _search_unseen_from(m: imaplib.IMAP4_SSL) -> list[bytes]:
    token = (settings.imap_sender_contains or "nequi").strip()
    if token:
        criteria = f'(UNSEEN FROM "{token}")'
    else:
        criteria = "(UNSEEN)"
    status, data = m.search(None, criteria)
    if status != "OK":
        return []
    ids = (data[0] or b"").split()
    return ids


def _fetch_message(m: imaplib.IMAP4_SSL, msg_id: bytes) -> Tuple[Optional[Message], bytes]:
    status, data = m.fetch(msg_id, "(RFC822)")
    if status != "OK" or not data or not data[0]:
        return None, b""
    raw = data[0][1] if isinstance(data[0], tuple) else b""
    try:
        msg = BytesParser(policy=policy.default).parsebytes(raw)
        return msg, raw
    except Exception:
        return None, raw


def poll_once() -> dict:
    sb = get_supabase()
    m = _connect()
    processed = 0
    inserted = 0
    try:
        ids = _search_unseen_from(m)
        for mid in ids:
            msg, raw = _fetch_message(m, mid)
            processed += 1
            if not msg:
                m.store(mid, "+FLAGS", "\\Seen")
                continue
            from_hdr = str(msg.get("From") or "")
            subj = str(msg.get("Subject") or "")
            body = _strip_html(_decode_body(msg))
            raw_text = f"{subj}\n{body}"
            n = parse_nequi_text(raw_text, from_hdr)
            if n:
                out = insert_bank_notification_and_broadcast(
                    sb,
                    n,
                    source="imap",
                    raw_payload={"source": "imap", "from": from_hdr, "subject": subj},
                )
                if out.get("status") == "success":
                    inserted += 1
            m.store(mid, "+FLAGS", "\\Seen")
    finally:
        try:
            m.logout()
        except Exception:
            pass
    return {"processed": processed, "inserted": inserted}


def run_forever():
    while True:
        try:
            poll_once()
        except Exception as e:
            print(f"IMAP ingest error: {e}")
        time.sleep(settings.imap_poll_interval_sec)
