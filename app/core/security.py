import hmac
import hashlib

def verify_meta_signature(app_secret: str, raw_body: bytes, signature_header: str) -> bool:
    if not app_secret or not signature_header:
        return False
    prefix = "sha256="
    if not signature_header.startswith(prefix):
        return False
    received = signature_header[len(prefix):].strip()
    computed = hmac.new(app_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(received, computed)
